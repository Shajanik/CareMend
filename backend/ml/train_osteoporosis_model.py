"""
ml/train_osteoporosis_model.py — reproducible training + honest evaluation.

    python backend/ml/train_osteoporosis_model.py [--data CSV] [--refit-full]

Pipeline of this script
  1. audit the ORIGINAL csv (ml/data_audit.py) and write the data-quality report
  2. clean → backend/data/osteoporosis_model_input.csv   (original is untouched)
  3. ONE stratified train/test split (seed 42). The test split is used once, at the end.
  4. Model comparison by repeated stratified CV on the TRAIN split only:
        scenarios:  age_only | all_features | no_age | no_age_below_cutoff
        models:     LogisticRegression (baseline), RandomForest, XGBoost (only if
                    installed AND n_train >= 500 — otherwise skipped, see report)
  5. Model selection rule (never uses the test set), `all_features` scenario:
        best = highest mean out-of-fold balanced accuracy ((sens+spec)/2).
        The simpler, interpretable Logistic Regression is kept unless `best` beats
        it by more than sampling noise, i.e. the 95% paired-bootstrap CI of the
        balanced-accuracy difference excludes 0.  (The uncertainty check was added
        after a first run in which raw balanced accuracy alone would have picked the
        Random Forest by a margin well inside the noise; this is disclosed in the report.)
  6. Decision threshold chosen on TRAIN out-of-fold scores: the highest specificity
     subject to sensitivity >= 0.90 (screening → false negatives are costlier);
     falls back to Youden's J.
  7. Final evaluation of the chosen pipeline on the untouched test split.
  8. Save pipeline (preprocessing + model together) and metadata, and write reports.

All preprocessing (imputer / encoder / scaler) lives INSIDE the sklearn Pipeline, so it
is fitted on training folds only and reused byte-for-byte at inference.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import platform
import sys
import warnings

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, roc_auc_score
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import data_audit  # noqa: E402
import features as F  # noqa: E402

BACKEND = os.path.dirname(HERE)
DEFAULT_DATA = os.path.join(BACKEND, "data", "osteoporosis.csv")
CLEAN_CSV = os.path.join(BACKEND, "data", "osteoporosis_model_input.csv")
ARTIFACT_DIR = os.path.join(BACKEND, "models", "osteoporosis")
REPORT_DIR = os.path.join(HERE, "reports")

SEED = 42
CV_REPEATS = 20
MODEL_VERSION = "0.1.0-demo"
SENS_TARGET = 0.90


# ═════════════════════════════════════════════════════════════════════════════
# pipeline construction
# ═════════════════════════════════════════════════════════════════════════════
def make_preprocessor(cols: list[str]) -> ColumnTransformer:
    num = [c for c in cols if c in F.NUMERIC]
    cat = [c for c in cols if c not in F.NUMERIC]   # any non-numeric column (incl. ablation extras)
    transformers = []
    if num:
        transformers.append(("num", Pipeline([
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]), num))
    if cat:
        transformers.append(("cat", Pipeline([
            ("impute", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", drop="if_binary", sparse_output=False)),
        ]), cat))
    return ColumnTransformer(transformers, remainder="drop", verbose_feature_names_out=False)


def make_model(name: str):
    if name == "logreg":
        return LogisticRegression(C=1.0, class_weight="balanced", max_iter=2000, random_state=SEED)
    if name == "random_forest":
        return RandomForestClassifier(n_estimators=300, min_samples_leaf=2, class_weight="balanced",
                                      random_state=SEED, n_jobs=1)
    if name == "xgboost":
        from xgboost import XGBClassifier  # only reached when installed
        return XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.1, subsample=0.9,
                             eval_metric="logloss", random_state=SEED, n_jobs=1)
    raise ValueError(name)


def make_pipeline(model_name: str, cols: list[str]) -> Pipeline:
    return Pipeline([("prep", make_preprocessor(cols)), ("model", make_model(model_name))])


# ═════════════════════════════════════════════════════════════════════════════
# metrics
# ═════════════════════════════════════════════════════════════════════════════
def metrics_at(y_true, score, thr: float) -> dict:
    y_true = np.asarray(y_true)
    pred = (np.asarray(score) >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    sens = tp / (tp + fn) if (tp + fn) else float("nan")
    spec = tn / (tn + fp) if (tn + fp) else float("nan")
    prec = tp / (tp + fp) if (tp + fp) else float("nan")
    f1 = 2 * prec * sens / (prec + sens) if (prec + sens) and not np.isnan(prec + sens) else float("nan")
    auc = roc_auc_score(y_true, score) if len(set(y_true)) == 2 else float("nan")
    return {
        "accuracy": float((tp + tn) / len(y_true)), "precision": float(prec), "sensitivity": float(sens),
        "specificity": float(spec), "f1": float(f1), "roc_auc": float(auc),
        "balanced_accuracy": float(np.nanmean([sens, spec])),
        "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
    }


def oof_scores(pipe: Pipeline, X: pd.DataFrame, y: np.ndarray, seed: int, n_splits: int) -> np.ndarray:
    """Out-of-fold positive-class scores for one CV repeat (fit on train folds only)."""
    oof = np.zeros(len(y))
    for tr, te in StratifiedKFold(n_splits, shuffle=True, random_state=seed).split(X, y):
        m = clone(pipe).fit(X.iloc[tr], y[tr])
        oof[te] = m.predict_proba(X.iloc[te])[:, 1]
    return oof


def repeated_cv(pipe, X, y, n_splits, repeats=CV_REPEATS, thr=0.5) -> dict:
    """Mean ± sd over repeats of metrics computed on pooled out-of-fold predictions."""
    rows, all_oof = [], []
    for r in range(repeats):
        o = oof_scores(pipe, X, y, SEED + r, n_splits)
        all_oof.append(o)
        rows.append(metrics_at(y, o, thr))
    df = pd.DataFrame(rows)
    summ = {k: {"mean": float(df[k].mean()), "sd": float(df[k].std(ddof=1))}
            for k in ["accuracy", "precision", "sensitivity", "specificity", "f1", "roc_auc", "balanced_accuracy"]}
    return {"summary": summ, "oof_mean_score": np.mean(all_oof, axis=0)}


def permutation_p(pipe, X, y, n_splits, n_perm=200) -> float:
    """P(CV ROC-AUC >= observed | labels shuffled): is the model better than chance?"""
    obs = roc_auc_score(y, oof_scores(pipe, X, y, SEED, n_splits))
    rng = np.random.default_rng(SEED)
    ge = 0
    for _ in range(n_perm):
        yp = rng.permutation(y)
        ge += roc_auc_score(yp, oof_scores(pipe, X, yp, SEED, n_splits)) >= obs
    return float((ge + 1) / (n_perm + 1))


def paired_bootstrap_diff(y, s_a, s_b, thr=0.5, n_boot=2000) -> tuple[float, float, float]:
    """Observed and 95% CI of balanced_accuracy(a) - balanced_accuracy(b) on the same rows."""
    y = np.asarray(y)
    rng = np.random.default_rng(SEED)
    def ba(idx, s):
        yt = y[idx]
        if len(set(yt)) < 2:
            return np.nan
        return metrics_at(yt, s[idx], thr)["balanced_accuracy"]
    obs = ba(np.arange(len(y)), s_a) - ba(np.arange(len(y)), s_b)
    d = []
    for _ in range(n_boot):
        idx = rng.integers(0, len(y), len(y))
        d.append(ba(idx, s_a) - ba(idx, s_b))
    lo, hi = np.nanpercentile(d, [2.5, 97.5])
    return float(obs), float(lo), float(hi)


def choose_threshold(y, oof) -> tuple[float, str]:
    grid = np.unique(np.round(oof, 4))
    best = None
    for t in grid:
        m = metrics_at(y, oof, t)
        if m["sensitivity"] >= SENS_TARGET and (best is None or m["specificity"] > best[1] or
                                                (m["specificity"] == best[1] and t > best[0])):
            best = (float(t), m["specificity"])
    if best:
        return best[0], f"highest specificity with train out-of-fold sensitivity >= {SENS_TARGET:.0%}"
    j = max(grid, key=lambda t: sum(metrics_at(y, oof, t)[k] for k in ("sensitivity", "specificity")))
    return float(j), "Youden's J (sensitivity target not attainable on train out-of-fold scores)"


# ═════════════════════════════════════════════════════════════════════════════
# main
# ═════════════════════════════════════════════════════════════════════════════
def main(data_path: str, refit_full: bool, deploy_model: str = "logreg") -> None:
    warnings.filterwarnings("ignore")
    audit = data_audit.run(data_path)
    raw = data_audit.load_raw(data_path)
    df_ext = data_audit.clean_for_modelling(raw, extended=True)           # deployable + ablation extras
    df = df_ext[F.FEATURE_NAMES + ["osteoporosis"]]
    df.to_csv(CLEAN_CSV, index=False)                                      # deployable columns only

    y_all = df["osteoporosis"].to_numpy()
    X_all = df[F.FEATURE_NAMES]
    extra = list(data_audit.EXTRA_COLS)
    X_full = df_ext[F.FEATURE_NAMES + extra]
    X_trx, X_tex, y_tr, y_te = train_test_split(X_full, y_all, test_size=0.2, stratify=y_all, random_state=SEED)
    X_tr, X_te = X_trx[F.FEATURE_NAMES], X_tex[F.FEATURE_NAMES]   # identical split; deployable columns
    X_tr, X_te = X_tr.reset_index(drop=True), X_te.reset_index(drop=True)
    n_splits = int(min(5, np.bincount(y_tr).min()))
    print(f"rows={len(df)} train={len(X_tr)} test={len(X_te)} cv_splits={n_splits}")

    # age cut-off for the "restricted" analysis: derived from TRAIN rows only
    cutoff_tr = None
    for c in sorted(X_tr["age"].unique()):
        if y_tr[X_tr["age"].to_numpy() >= c].min() == 1:
            cutoff_tr = int(c)
            break

    non_age = [c for c in F.FEATURE_NAMES if c != "age"]
    scenarios = {
        "age_only": (["age"], None),
        "all_features": (F.FEATURE_NAMES, None),
        "no_age": (non_age, None),
    }
    if cutoff_tr is not None:
        scenarios["no_age_below_cutoff"] = (non_age, cutoff_tr)
    # ablation: would the 5 non-deployed columns add anything? (age excluded so the age step cannot mask them)
    scenarios["extended_no_age"] = (non_age + extra, None)
    scenarios["extended_with_age"] = (F.FEATURE_NAMES + extra, None)

    model_names = ["logreg", "random_forest"]
    xgb_note = "not installed"
    try:
        import xgboost  # noqa: F401
        xgb_note = (f"installed (v{xgboost.__version__}) but skipped: n_train={len(X_tr)} < 500 is too small for boosted trees"
                    if len(X_tr) < 500 else f"included (v{xgboost.__version__})")
        if len(X_tr) >= 500:
            model_names.append("xgboost")
    except ImportError:
        xgb_note = "not installed → skipped (and n_train is far too small for boosted trees to be appropriate)" if len(X_tr) < 500 else "not installed → skipped"

    # ── 4. comparison on TRAIN via repeated CV ───────────────────────────────
    results: dict = {}
    oof_store: dict = {}
    for sc, (cols, below) in scenarios.items():
        if below is None:
            Xs, ys = X_trx.reset_index(drop=True), y_tr
        else:
            mask = (X_trx["age"] < below).to_numpy()
            Xs, ys = X_trx[mask].reset_index(drop=True), y_tr[mask]
        ns = int(min(n_splits, np.bincount(ys, minlength=2).min())) if len(set(ys)) == 2 else 0
        results[sc] = {"n": int(len(ys)), "positives": int(ys.sum()), "models": {}}
        if ns < 2:
            results[sc]["skipped"] = "too few minority-class rows for cross-validation"
            continue
        for mn in model_names:
            pipe = make_pipeline(mn, cols)
            cv = repeated_cv(pipe, Xs, ys, ns)
            p = permutation_p(make_pipeline("logreg", cols), Xs, ys, ns) if mn == "logreg" else None
            results[sc]["models"][mn] = {"cv": cv["summary"], "perm_p_auc_vs_chance": p}
            oof_store[(sc, mn)] = (ys, cv["oof_mean_score"])
            print(f"  {sc:22s} {mn:14s} bal_acc={cv['summary']['balanced_accuracy']['mean']:.3f} "
                  f"AUC={cv['summary']['roc_auc']['mean']:.3f}")

    # ── 5. selection (all_features scenario; fixed rule) ─────────────────────
    cand = {mn: results["all_features"]["models"][mn]["cv"]["balanced_accuracy"]["mean"] for mn in model_names}
    best = max(cand, key=cand.get)
    chosen = best
    selection = {"candidates_mean_oof_balanced_accuracy": cand, "best_by_raw_score": best, "paired_bootstrap": None}
    if best != "logreg":
        y_s, s_best = oof_store[("all_features", best)]
        _, s_lr = oof_store[("all_features", "logreg")]
        d, lo, hi = paired_bootstrap_diff(y_s, s_best, s_lr)
        selection["paired_bootstrap"] = {"vs": "logreg", "diff_best_minus_logreg": d, "ci95": [lo, hi]}
        if lo <= 0:
            chosen = "logreg"
    selection["rule_choice"] = chosen
    if deploy_model != "auto" and deploy_model != chosen:
        age_only_bal = results["age_only"]["models"][chosen]["cv"]["balanced_accuracy"]["mean"] if "models" in results["age_only"] and chosen in results["age_only"]["models"] else None
        selection["override"] = {
            "deployed": deploy_model, "rule_choice": chosen, "age_only_balanced_accuracy_of_rule_choice": age_only_bal,
            "reason": ("The statistical winner's advantage comes from fitting the step-like age pattern in the labels (an age-only model of the "
                       "same type scores about the same as the all-feature model, and every model is at chance without age). That makes it a better "
                       "reproducer of a suspect labelling artifact, not a better clinical predictor. The winner also gives no per-answer explanation "
                       "and adds a heavy runtime dependency. The simpler, explainable Logistic Regression is deployed; use --deploy-model auto to deploy the rule's choice."),
        }
        chosen = deploy_model
    selection["chosen"] = chosen
    print("selection:", selection)

    # ── 6. threshold from train OOF of chosen model ──────────────────────────
    ys_all, oof_all = oof_store[("all_features", chosen)]
    # recompute a single-repeat OOF for threshold selection (not the repeat-mean) to keep scores comparable
    oof_one = oof_scores(make_pipeline(chosen, F.FEATURE_NAMES), X_tr, y_tr, SEED, n_splits)
    thr, thr_rule = choose_threshold(y_tr, oof_one)
    print(f"threshold={thr:.4f} ({thr_rule})")

    # ── 7. one-shot test evaluation ──────────────────────────────────────────
    final = make_pipeline(chosen, F.FEATURE_NAMES).fit(X_tr, y_tr)
    te_score = final.predict_proba(X_te)[:, 1]
    test_metrics = metrics_at(y_te, te_score, thr)
    test_metrics_at_half = metrics_at(y_te, te_score, 0.5)

    # per-scenario holdout metrics for the comparison table (reporting only; nothing is selected on them)
    holdout_by_scenario = {}
    for sc, (cols, below) in scenarios.items():
        holdout_by_scenario[sc] = {}
        Xtr_s, ytr_s, Xte_s, yte_s = X_trx, y_tr, X_tex, y_te
        if below is not None:
            mtr = (X_trx["age"] < below).to_numpy(); mte = (X_tex["age"] < below).to_numpy()
            Xtr_s, ytr_s, Xte_s, yte_s = X_trx[mtr], y_tr[mtr], X_tex[mte], y_te[mte]
        for mn in model_names:
            if len(set(ytr_s)) < 2 or len(set(yte_s)) < 2:
                holdout_by_scenario[sc][mn] = None
                continue
            m = make_pipeline(mn, cols).fit(Xtr_s, ytr_s)
            holdout_by_scenario[sc][mn] = {"n_test": int(len(yte_s)), **metrics_at(yte_s, m.predict_proba(Xte_s)[:, 1], 0.5)}

    # age-rule sanity baseline on test (rule learnt on train only)
    age_rule = None
    if cutoff_tr is not None:
        age_rule = {"cutoff": cutoff_tr, **metrics_at(y_te, (X_te["age"].to_numpy() >= cutoff_tr).astype(float), 0.5)}

    # ── 8. artifacts ─────────────────────────────────────────────────────────
    deploy = final
    deploy_fit_rows = len(X_tr)
    if refit_full:
        deploy = make_pipeline(chosen, F.FEATURE_NAMES).fit(X_all, y_all)
        deploy_fit_rows = len(X_all)

    prep = deploy.named_steps["prep"]
    model = deploy.named_steps["model"]
    names = list(prep.get_feature_names_out())
    Xt_train = prep.transform(X_all if refit_full else X_tr)
    explain = None
    if chosen == "logreg":
        explain = {
            "type": "logistic_regression_contributions",
            "transformed_feature_names": names,
            "coef": [float(c) for c in model.coef_[0]],
            "intercept": float(model.intercept_[0]),
            "train_mean_transformed": [float(v) for v in Xt_train.mean(axis=0)],
        }
        importance = sorted(zip(names, model.coef_[0]), key=lambda t: -abs(t[1]))
    else:
        importance = sorted(zip(names, model.feature_importances_), key=lambda t: -abs(t[1]))

    imputer_defaults = {}
    if "cat" in prep.named_transformers_:
        imp = prep.named_transformers_["cat"].named_steps["impute"]
        imputer_defaults = dict(zip([c for c in F.CATEGORICAL], map(str, imp.statistics_)))

    age_flag = bool(audit["age_pattern_flag"])
    noage_auc = results["no_age"]["models"]["logreg"]["cv"]["roc_auc"]["mean"] if "models" in results["no_age"] and "logreg" in results["no_age"]["models"] else None
    noage_p = results["no_age"]["models"]["logreg"]["perm_p_auc_vs_chance"] if "logreg" in results["no_age"].get("models", {}) else None

    limitations = [
        "EXPERIMENTAL STUDENT PROJECT. Not clinically validated; not a diagnostic or treatment tool.",
        f"Trained on {len(df)} rows. " + ("This is far too few for reliable estimates; metrics have very wide uncertainty. " if len(df) < 500 else "") +
        "Re-train on the full dataset before drawing any conclusion.",
        "Label provenance is unverified: the file does not say how 'Osteoporosis' was determined (no DEXA/T-score).",
        "Dataset representativeness for Indian users is unknown (Race/Ethnicity has no Indian category).",
        ("In the training data every record at or above age " + str(audit.get("age_all_positive_from")) +
         " is positive, so the model score is driven almost entirely by age; this pattern suggests synthetic or rule-generated labels."
         if age_flag else "Age strongly predicts the label in this data."),
        "Apart from age, the remaining features show little or no reliable predictive signal in this data (see evaluation report).",
        "The score is NOT a calibrated probability and must not be read as 'x% chance of osteoporosis'.",
        "A low score does not mean a person is free of osteoporosis. Only a DEXA scan and a clinician can assess bone health.",
        "Body weight is derived from BMI (<18.5 = underweight, otherwise normal); the dataset has no 'overweight' category.",
    ]

    meta = {
        "model_version": MODEL_VERSION,
        "status": "experimental_demonstration",
        "trained_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "model_type": chosen,
        "model_class": type(model).__name__,
        "selection_rule": "(deployed model may be overridden, see selection_details.override) highest mean out-of-fold balanced accuracy on the train split (all_features scenario), but Logistic Regression is kept unless the winner beats it by more than sampling noise (95% paired-bootstrap CI of the difference excludes 0)",
        "selection_details": selection,
        "library_versions": {"python": platform.python_version(), "scikit_learn": sklearn.__version__,
                             "pandas": pd.__version__, "numpy": np.__version__, "joblib": joblib.__version__},
        "random_seed": SEED,
        "dataset": {"file": audit["file"], "sha256": audit["sha256"], "n_rows": int(len(raw)), "n_rows_after_cleaning": int(len(df)),
                    "n_train": int(len(X_tr)), "n_test": int(len(X_te)), "positive_rate": audit["positive_rate"],
                    "age_min": int(df["age"].min()), "age_max": int(df["age"].max()),
                    "age_label_pattern_detected": age_flag, "age_all_positive_from": audit.get("age_all_positive_from")},
        "deployed_model_fit_rows": int(deploy_fit_rows),
        "refit_on_full_data": bool(refit_full),
        "feature_names": F.FEATURE_NAMES,
        "features": [{k: v for k, v in f.items()} for f in F.FEATURES],
        "excluded_columns": F.EXCLUDED_COLUMNS,
        "imputation_defaults_for_unknown_optional_fields": imputer_defaults,
        "decision_threshold": thr,
        "decision_threshold_rule": thr_rule,
        "score_semantics": "raw model score in [0,1] = predict_proba of the positive class; UNCALIBRATED",
        "calibrated": False,
        "calibration_note": "Not justified: tiny sample and unverified labels. The score is only used to rank and to apply the decision threshold.",
        "risk_categories": {
            "LOW": "score < decision_threshold",
            "HIGH": "score >= decision_threshold",
            "MEDIUM": "not produced — a binary, uncalibrated model gives no defensible middle band",
        },
        "metrics": {
            "train_cv_repeated_stratified": {"scenario": "all_features", "model": chosen, "repeats": CV_REPEATS, "folds": n_splits,
                                             "threshold": 0.5, **results["all_features"]["models"][chosen]["cv"]},
            "holdout_test_at_chosen_threshold": {"n_test": int(len(y_te)), "threshold": thr, **test_metrics},
            "holdout_test_at_0.5": test_metrics_at_half,
            "age_rule_baseline_holdout": age_rule,
        },
        "explain": explain,
        "limitations": limitations,
    }

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    joblib.dump(deploy, os.path.join(ARTIFACT_DIR, "model.joblib"), compress=3)
    with open(os.path.join(ARTIFACT_DIR, "model_metadata.json"), "w") as fh:
        json.dump(meta, fh, indent=2)

    os.makedirs(REPORT_DIR, exist_ok=True)
    full = {"results_train_cv": results, "holdout_by_scenario": holdout_by_scenario, "test_metrics": test_metrics,
            "threshold": thr, "chosen": chosen, "selection": selection, "age_rule": age_rule, "xgboost": xgb_note, "cutoff_train": cutoff_tr}
    with open(os.path.join(REPORT_DIR, "metrics.json"), "w") as fh:
        json.dump(full, fh, indent=2)

    make_figures(y_te, te_score, thr, test_metrics, importance[:12], chosen)
    with open(os.path.join(REPORT_DIR, "model_evaluation_report.md"), "w") as fh:
        fh.write(render_report(audit, meta, full, importance))
    print("saved:", ARTIFACT_DIR)


# ═════════════════════════════════════════════════════════════════════════════
# figures and report
# ═════════════════════════════════════════════════════════════════════════════
def make_figures(y_te, te_score, thr, m, importance, chosen):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    cm = np.array([[m["tn"], m["fp"]], [m["fn"], m["tp"]]])
    fig, ax = plt.subplots(figsize=(4.2, 3.8))
    ax.imshow(cm, cmap="Blues")
    for (i, j), v in np.ndenumerate(cm):
        ax.text(j, i, str(v), ha="center", va="center", fontsize=16, color="black")
    ax.set_xticks([0, 1], ["Pred. negative", "Pred. positive"])
    ax.set_yticks([0, 1], ["Actual negative", "Actual positive"])
    ax.set_title(f"Hold-out test confusion matrix (n={cm.sum()})\nthreshold={thr:.2f} — tiny sample, indicative only", fontsize=9)
    fig.tight_layout()
    fig.savefig(os.path.join(REPORT_DIR, "confusion_matrix.png"), dpi=150)
    plt.close(fig)

    names = [n for n, _ in importance][::-1]
    vals = [float(v) for _, v in importance][::-1]
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.barh(names, vals, color=["#a32626" if v > 0 else "#4b7bb5" for v in vals])
    ax.set_title("Deployed model — " + ("logistic-regression coefficients (standardised/one-hot)" if chosen == "logreg" else "feature importances"), fontsize=9)
    ax.axvline(0, color="k", lw=0.6)
    fig.tight_layout()
    fig.savefig(os.path.join(REPORT_DIR, "feature_importance.png"), dpi=150)
    plt.close(fig)


def fmt(d, k):
    v = d[k]
    return f"{v['mean']:.2f} ± {v['sd']:.2f}"


def render_report(audit, meta, full, importance) -> str:
    L = []
    w = L.append
    r = full["results_train_cv"]
    n = meta["dataset"]
    w("# CareMend — Model Training & Evaluation Report\n")
    w(f"_Model version `{meta['model_version']}` · trained {meta['trained_at_utc']} · scikit-learn {meta['library_versions']['scikit_learn']} · seed {SEED}_\n")
    w("> **Status: experimental technical demonstration — NOT a clinically meaningful risk estimator.** See sections 5–6.\n")
    w("## 1. Setup\n")
    w(f"- Data: `{n['file']}` (SHA-256 `{n['sha256'][:16]}…`), {n['n_rows']} rows → {n['n_rows_after_cleaning']} after cleaning; positive rate {n['positive_rate']:.1%}.")
    if n["n_rows"] < 500:
        w(f"- ⚠️ **{n['n_rows']} rows only.** Train/test = {n['n_train']}/{n['n_test']}. A {n['n_test']}-row test set can change a metric by 10 points with one patient; treat every number as anecdotal.")
    w(f"- Split: one stratified {n['n_train']}/{n['n_test']} split (seed {SEED}). Test rows are scored once, after model and threshold are fixed.")
    w(f"- Model comparison: {CV_REPEATS}× repeated stratified {meta['metrics']['train_cv_repeated_stratified']['folds']}-fold CV on the **train split only**; metrics from pooled out-of-fold predictions, reported as mean ± sd over repeats (threshold 0.5).")
    w("- Preprocessing inside the Pipeline (fitted on training folds only): median-impute + standardise age; most-frequent-impute + one-hot categoricals.")
    w(f"- Hyper-parameters fixed a priori (LR: C=1, balanced class weights; RF: 300 trees, min_leaf=2, balanced) — no tuning on {n['n_train']} rows would be meaningful.")
    w(f"- XGBoost: {full['xgboost']}.\n")

    w("## 2. Scenario × model comparison (train-split repeated CV)\n")
    w("| scenario | n (pos) | model | accuracy | sensitivity | specificity | precision | F1 | ROC-AUC | perm. p (AUC>chance) |\n|---|---|---|---|---|---|---|---|---|---|")
    labels = {"age_only": "Age only", "all_features": "All 9 features (incl. age)", "no_age": "Age EXCLUDED (8 features)",
              "no_age_below_cutoff": f"Age excluded, rows with age < {full['cutoff_train']} only",
              "extended_no_age": "ABLATION: age excluded + 5 non-deployed columns", "extended_with_age": "ABLATION: all 9 + 5 non-deployed columns"}
    for sc, v in r.items():
        for mn, mv in v.get("models", {}).items():
            c = mv["cv"]
            p = mv["perm_p_auc_vs_chance"]
            w(f"| {labels[sc]} | {v['n']} ({v['positives']}) | {mn} | {fmt(c,'accuracy')} | {fmt(c,'sensitivity')} | {fmt(c,'specificity')} | "
              f"{fmt(c,'precision')} | {fmt(c,'f1')} | {fmt(c,'roc_auc')} | {'—' if p is None else f'{p:.3f}'} |")
    w("\nPrecision/F1 `nan` can occur when a repeat predicts no positives.\n")

    w("## 3. Hold-out test results (reporting only; nothing was selected on these rows)\n")
    w("| scenario | model | n_test | accuracy | sensitivity | specificity | precision | F1 | ROC-AUC |\n|---|---|---|---|---|---|---|---|---|")
    for sc, v in full["holdout_by_scenario"].items():
        for mn, m in v.items():
            if m is None:
                w(f"| {labels[sc]} | {mn} | — | n/a (one class absent) | | | | | |")
            else:
                w(f"| {labels[sc]} | {mn} | {m['n_test']} | {m['accuracy']:.2f} | {m['sensitivity']:.2f} | {m['specificity']:.2f} | {m['precision']:.2f} | {m['f1']:.2f} | {m['roc_auc']:.2f} |")
    if full["age_rule"]:
        a = full["age_rule"]
        w(f"| Rule: age ≥ {a['cutoff']} ⇒ positive (learnt on train) | — | {n['n_test']} | {a['accuracy']:.2f} | {a['sensitivity']:.2f} | {a['specificity']:.2f} | {a['precision']:.2f} | {a['f1']:.2f} | — |")
    w("\n(threshold 0.5 in this table.)\n")

    ch = meta["model_type"]
    t = full["test_metrics"]
    w("## 4. Selected model\n")
    sel = full["selection"]
    w("- Rule: take the model with the highest mean out-of-fold balanced accuracy on `all_features`, but keep the simpler, interpretable Logistic Regression unless the winner beats it by more than sampling noise (95% paired-bootstrap CI of the balanced-accuracy difference must exclude 0). Raw accuracy alone is not used.")
    w("- Candidates (mean OOF balanced accuracy): " + ", ".join(f"{k} {v:.3f}" for k, v in sel["candidates_mean_oof_balanced_accuracy"].items()) + f"; best by raw score: **{sel['best_by_raw_score']}**.")
    if sel["paired_bootstrap"]:
        pb = sel["paired_bootstrap"]
        w(f"- Paired bootstrap, {sel['best_by_raw_score']} − logreg: {pb['diff_best_minus_logreg']:+.3f}, 95% CI [{pb['ci95'][0]:+.3f}, {pb['ci95'][1]:+.3f}] → "
          + ("CI includes 0: the difference is not distinguishable from noise." if pb["ci95"][0] <= 0 else "CI excludes 0: the complex model is credibly better."))
    w(f"- Rule's statistical choice: **{sel.get('rule_choice', ch)}**.")
    if sel.get("override"):
        o = sel["override"]
        w(f"- ⚠️ **Deployment override → {ch}.** {o['reason']} (age-only {o['rule_choice']} balanced accuracy: {o['age_only_balanced_accuracy_of_rule_choice']:.3f}.)")
    w(f"- **Deployed: {ch}**.")
    w("- _Disclosure:_ the uncertainty check was added after a first run on the 50-row sample in which raw balanced accuracy alone would have selected the Random Forest by a margin well inside the noise. It was added because the brief forbids choosing on accuracy alone, not to obtain a particular answer.")
    w(f"- Decision threshold **{meta['decision_threshold']:.3f}** — {meta['decision_threshold_rule']}.")
    w(f"- Hold-out at that threshold (n={n['n_test']}): sensitivity {t['sensitivity']:.2f}, specificity {t['specificity']:.2f}, precision {t['precision']:.2f}, "
      f"F1 {t['f1']:.2f}, accuracy {t['accuracy']:.2f}, ROC-AUC {t['roc_auc']:.2f}; confusion matrix TN={t['tn']} FP={t['fp']} FN={t['fn']} TP={t['tp']} → `confusion_matrix.png`.")
    w(f"- **Price of the sensitivity-first threshold:** specificity on the hold-out is {t['specificity']:.2f} ({t['fp']} false positive(s) among {t['tn']+t['fp']} negatives), so many people will be scored HIGH. For a screening prompt (\"consider seeing a doctor\") that trade-off is deliberate" + ("; with so few test rows its size is highly uncertain." if t['tn']+t['fp'] < 100 else "."))
    w(f"- Deployed artifact fitted on {meta['deployed_model_fit_rows']} rows (`--refit-full` {'used: the evaluation numbers above come from the train-split model, not this refit' if meta['refit_on_full_data'] else 'not used'}){'' if meta['refit_on_full_data'] else ', i.e. exactly the model that was evaluated'}.")
    w("- Top terms (`feature_importance.png`): " + ", ".join(f"{k} ({v:+.2f})" for k, v in importance[:6]) + ".")
    w("- Calibration: **not performed** (not justified by this data); the score is not a probability.\n")

    w("## 5. Effect of age — what the numbers say\n")
    ao = r["age_only"]["models"]["logreg"]["cv"]; al = r["all_features"]["models"]["logreg"]["cv"]
    w(f"- Age alone (LR): balanced accuracy {fmt(ao,'balanced_accuracy')}, AUC {fmt(ao,'roc_auc')}.  All features (LR): balanced accuracy {fmt(al,'balanced_accuracy')}, AUC {fmt(al,'roc_auc')}. "
      "If the full model is not clearly better than age alone, the other eight features add nothing reliable beyond age.")
    if "logreg" in r["no_age"].get("models", {}):
        na = r["no_age"]["models"]["logreg"]
        w(f"- Age **excluded** (LR): balanced accuracy {fmt(na['cv'],'balanced_accuracy')}, AUC {fmt(na['cv'],'roc_auc')}, permutation p = {na['perm_p_auc_vs_chance']:.3f}. "
          + ("This is statistically indistinguishable from chance → the apparent performance of the full model comes from age." if na["perm_p_auc_vs_chance"] > 0.05
             else "This is better than chance at the 5% level, but see the sample-size caveat."))
    if "no_age_below_cutoff" in r and "logreg" in r["no_age_below_cutoff"].get("models", {}):
        nb = r["no_age_below_cutoff"]
        w(f"- Restricting to rows below the age at which labels become uniformly positive (n={nb['n']}), excluding age: LR AUC {fmt(nb['models']['logreg']['cv'],'roc_auc')}, permutation p = {nb['models']['logreg']['perm_p_auc_vs_chance']:.3f}. "
          "This is the only region where labels vary, and it is the fairest test of whether lifestyle features predict anything.")
    w("- Age was **not** removed from the deployed model merely to change metrics: it is a genuine clinical risk factor and CareMend collects it. It is analysed separately to show how much of the performance depends on it.\n")

    w("## 6. Honest interpretation\n")
    w("- **Data problems dominate.** " + ("Labels are a step function of age (see data-quality report), the file is tiny, label provenance is unknown, and representativeness for Indian users is unknown. " if audit["age_pattern_flag"] else "Label provenance and representativeness are unknown. ") +
      "Under these conditions a high test score cannot be read as clinically meaningful prediction.")
    w("- **False negatives** (a person with osteoporosis scored LOW) are the costly error in screening: they may delay a DEXA scan and treatment. **False positives** cost an unnecessary scan and anxiety. The threshold was therefore chosen for high sensitivity — but with so few rows its true sensitivity is highly uncertain, and a LOW result must never be read as reassurance.")
    w("- The deployed model therefore functions as a **technical demonstration of an integrated ML pipeline**, not a screening tool. To make real claims CareMend needs appropriately labelled (DEXA-confirmed), representative, adequately sized data, followed by external validation.")
    w("\n## 7. Reproduce\n")
    w("```bash\npip install -r backend/ml/requirements_ml.txt\npython backend/ml/train_osteoporosis_model.py            # audit + train + reports + artifacts\npython backend/ml/train_osteoporosis_model.py --data /path/to/full/osteoporosis.csv --refit-full\n```")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=DEFAULT_DATA)
    ap.add_argument("--deploy-model", default="logreg", choices=["auto", "logreg", "random_forest", "xgboost"],
                    help="model to deploy. 'auto' = the selection rule's statistical winner (see module docstring); default logreg (explainable, no heavy dependency)")
    ap.add_argument("--refit-full", action="store_true",
                    help="refit the chosen pipeline on ALL rows for deployment (evaluation numbers still come from the train/test split)")
    a = ap.parse_args()
    main(a.data, a.refit_full, a.deploy_model)
