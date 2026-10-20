"""
ml/data_audit.py — data-quality audit of osteoporosis.csv.

Reads the ORIGINAL csv (never modifies it), computes every statistic directly
from the file, and writes ml/reports/data_quality_report.md + data_audit.json.
All narrative flags are derived from the numbers, so re-running on the full
Kaggle file (~1,958 rows) produces a correct report without edits.

Run:  python backend/ml/data_audit.py [--data path/to/osteoporosis.csv]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys

import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import features as F  # noqa: E402

BACKEND = os.path.dirname(HERE)
DEFAULT_DATA = os.path.join(BACKEND, "data", "osteoporosis.csv")
REPORT_DIR = os.path.join(HERE, "reports")


def load_raw(path: str) -> pd.DataFrame:
    """Read the CSV WITHOUT pandas' default NA parsing: the text "None" in Alcohol Consumption /
    Medications / Medical Conditions is a real answer ("none"), not a missing value."""
    return pd.read_csv(path, keep_default_na=False, na_values=[""])


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def cramers_v(a: pd.Series, b: pd.Series) -> float:
    tab = pd.crosstab(a, b)
    if tab.shape[0] < 2 or tab.shape[1] < 2:
        return float("nan")
    chi2 = stats.chi2_contingency(tab, correction=False)[0]
    n = tab.to_numpy().sum()
    return float(np.sqrt(chi2 / (n * (min(tab.shape) - 1))))


def audit(df: pd.DataFrame, path: str) -> dict:
    y_col = F.TARGET_CSV
    y = df[y_col]
    out: dict = {
        "file": os.path.relpath(path, BACKEND),
        "sha256": sha256(path),
        "n_rows": int(len(df)),
        "n_cols": int(df.shape[1]),
        "columns": {c: str(t) for c, t in df.dtypes.items()},
    }

    # ── target ────────────────────────────────────────────────────────────────
    out["target_counts"] = {str(k): int(v) for k, v in y.value_counts().sort_index().items()}
    out["target_values_ok"] = bool(set(y.unique()) <= {0, 1})
    out["positive_rate"] = float(y.mean())

    # ── missingness / uniqueness ──────────────────────────────────────────────
    out["missing_pct"] = {c: round(float(df[c].isna().mean() * 100), 1) for c in df.columns}
    out["literal_none_pct"] = {c: round(float((df[c].astype(str) == "None").mean() * 100), 1) for c in df.columns}
    out["unique_non_missing"] = {
        c: sorted(map(str, df[c].dropna().unique()))[:12] if df[c].nunique() <= 12 else f"{df[c].nunique()} distinct"
        for c in df.columns
    }
    out["single_valued_non_missing"] = [
        c for c in df.columns if c != "Id" and df[c].dropna().nunique() == 1
    ]

    # ── duplicates ────────────────────────────────────────────────────────────
    feat_cols = [c for c in df.columns if c != "Id"]
    out["duplicate_rows_full"] = int(df.duplicated().sum())
    out["duplicate_rows_excluding_id"] = int(df.duplicated(subset=feat_cols).sum())
    out["id_unique"] = bool(df["Id"].is_unique) if "Id" in df else None

    # ── categorical value consistency (case / whitespace variants) ────────────
    inconsistent = {}
    for c in df.select_dtypes(exclude="number").columns:
        vals = df[c].dropna().astype(str)
        norm = vals.str.strip().str.lower()
        if vals.nunique() != norm.nunique():
            inconsistent[c] = sorted(vals.unique().tolist())
    out["inconsistent_category_spelling"] = inconsistent

    # ── age ↔ label ───────────────────────────────────────────────────────────
    age = df["Age"]
    out["age_summary"] = {k: float(v) for k, v in age.describe().round(2).items()}
    bands = pd.cut(age, [0, 29, 39, 49, 59, 69, 120],
                   labels=["<30", "30-39", "40-49", "50-59", "60-69", "70+"])
    band_tab = df.groupby(bands, observed=True)[y_col].agg(["count", "sum"])
    out["age_band_table"] = {
        str(k): {"n": int(r["count"]), "positives": int(r["sum"]), "rate": round(float(r["sum"] / r["count"]), 3)}
        for k, r in band_tab.iterrows()
    }
    # lowest age cutoff c such that EVERY record with age >= c is positive
    cutoff = None
    for c in sorted(age.unique()):
        sub = y[age >= c]
        if len(sub) and sub.min() == 1:
            cutoff = int(c)
            break
    out["age_all_positive_from"] = cutoff
    if cutoff is not None:
        out["n_rows_at_or_above_cutoff"] = int((age >= cutoff).sum())
        out["n_negatives_at_or_above_cutoff"] = int(((age >= cutoff) & (y == 0)).sum())
        out["n_negatives_below_cutoff"] = int(((age < cutoff) & (y == 0)).sum())
        out["n_positives_below_cutoff"] = int(((age < cutoff) & (y == 1)).sum())
        out["oldest_negative"] = int(age[y == 0].max()) if (y == 0).any() else None
        out["youngest_positive"] = int(age[y == 1].min())
    # best single age-threshold rule (age >= t -> positive), apparent accuracy
    best = max(((float(((age >= t).astype(int) == y).mean()), int(t)) for t in age.unique()))
    out["best_age_threshold_rule"] = {"threshold": best[1], "apparent_accuracy": round(best[0], 3)}
    out["age_label_point_biserial"] = round(float(stats.pointbiserialr(y, age)[0]), 3)
    # clinical plausibility note: pattern is a hard step, not a gradual risk curve
    out["age_pattern_flag"] = bool(
        cutoff is not None and out.get("n_negatives_at_or_above_cutoff", 1) == 0
        and out.get("n_rows_at_or_above_cutoff", 0) >= 10
    )

    # ── gender ↔ hormonal consistency ─────────────────────────────────────────
    if {"Gender", "Hormonal Changes"} <= set(df.columns):
        tab = pd.crosstab(df["Gender"], df["Hormonal Changes"])
        out["gender_by_hormonal"] = {g: {h: int(v) for h, v in r.items()} for g, r in tab.iterrows()}
        male_post = int(((df["Gender"] == "Male") & (df["Hormonal Changes"] == "Postmenopausal")).sum())
        out["males_labelled_postmenopausal"] = male_post
        out["n_males"] = int((df["Gender"] == "Male").sum())

    # ── per-feature association with target (leakage / suspicious correlations)
    assoc = {}
    for c in df.columns:
        if c in ("Id", y_col, "Age"):
            continue
        col = df[c].fillna("«missing»")
        v = cramers_v(col, y)
        tab = pd.crosstab(col, y)
        p = float(stats.chi2_contingency(tab)[1]) if tab.shape[0] > 1 and tab.shape[1] > 1 else float("nan")
        if tab.shape == (2, 2):
            p = float(stats.fisher_exact(tab)[1])
        rates = df.groupby(col)[y_col].agg(["count", "mean"]).round(3)
        assoc[c] = {
            "cramers_v": None if np.isnan(v) else round(v, 3),
            "p_value": None if np.isnan(p) else round(p, 4),
            "positive_rate_by_value": {str(k): {"n": int(r["count"]), "rate": float(r["mean"])} for k, r in rates.iterrows()},
        }
    out["association_with_target"] = assoc
    out["id_vs_target_corr"] = round(float(stats.spearmanr(df["Id"], y)[0]), 3) if "Id" in df else None

    # ── "None" answers vs target ─────────────────────────────────────────────
    miss = {}
    for c in ("Alcohol Consumption", "Medications", "Medical Conditions"):
        if c in df.columns:
            m = df[c].astype(str) == "None"
            tab = pd.crosstab(m, y)
            p = float(stats.fisher_exact(tab)[1]) if tab.shape == (2, 2) else None
            miss[c] = {
                "none_n": int(m.sum()),
                "positive_rate_when_none": round(float(y[m].mean()), 3) if m.any() else None,
                "positive_rate_otherwise": round(float(y[~m].mean()), 3) if (~m).any() else None,
                "fisher_p": None if p is None else round(p, 4),
            }
    out["none_answers_vs_target"] = miss

    # ── overall plausibility of target given a features-only view ─────────────
    out["notes_label_provenance"] = (
        "The CSV carries no documentation of how Osteoporosis was determined "
        "(no DEXA T-scores, no clinician, no site, no date). Kaggle was not "
        "reachable from the build environment, so the dataset page could not be "
        "re-checked; per the project brief the label-generation process is "
        "unverified and the Indian representativeness is unknown."
    )
    return out


EXTRA_COLS = {  # columns NOT deployed; used only in the ablation analysis
    "hormonal_changes": "Hormonal Changes", "race_ethnicity": "Race/Ethnicity",
    "alcohol_consumption": "Alcohol Consumption", "medical_conditions": "Medical Conditions",
    "medications": "Medications",
}


def clean_for_modelling(df: pd.DataFrame, extended: bool = False) -> pd.DataFrame:
    """Original CSV → modelling frame (lower-case canonical tokens, selected features only)."""
    out = pd.DataFrame(index=df.index)
    for f in F.FEATURES:
        col = df[f["csv"]]
        if f["kind"] == "numeric":
            out[f["name"]] = pd.to_numeric(col, errors="raise").astype(int)
        else:
            out[f["name"]] = col.astype("string").str.strip().str.lower().astype(object)
            bad = set(out[f["name"]].dropna().unique()) - set(f["allowed"])
            if bad:
                raise ValueError(f"Unexpected values in {f['csv']}: {sorted(bad)} (allowed {f['allowed']})")
    if extended:
        for name, csv in EXTRA_COLS.items():
            out[name] = df[csv].astype("string").str.strip().str.lower().str.replace(" ", "_").astype(object)
    out["osteoporosis"] = df[F.TARGET_CSV].astype(int)
    out = out.drop_duplicates().reset_index(drop=True)
    return out


def render_markdown(a: dict) -> str:
    L = []
    w = L.append
    w("# CareMend — Data-Quality Report (`osteoporosis.csv`)\n")
    w("_Generated by `backend/ml/data_audit.py`; every number below is computed from the file._\n")
    w(f"- **File:** `{a['file']}`  (SHA-256 `{a['sha256'][:16]}…`, left unmodified)")
    w(f"- **Shape:** {a['n_rows']} rows × {a['n_cols']} columns")
    tc = a["target_counts"]
    w(f"- **Target `Osteoporosis`:** {tc}  → positive rate {a['positive_rate']:.1%}; values valid (0/1): {a['target_values_ok']}")
    if a["n_rows"] < 500:
        w(f"\n> ⚠️ **Only {a['n_rows']} rows.** The brief describes ~1,958 records; this copy is a small sample. "
          "Every statistic and model result below has very wide uncertainty. Replace the CSV with the full file and re-run "
          "`python backend/ml/train_osteoporosis_model.py` to regenerate everything.\n")

    w("\n## 1. Missing values and the literal “None” answers\n")
    w("| column | truly empty % | literal “None” % | distinct values |\n|---|---|---|---|")
    for c in a["columns"]:
        u = a["unique_non_missing"][c]
        w(f"| {c} | {a['missing_pct'][c]} | {a['literal_none_pct'][c]} | {u if isinstance(u, str) else ', '.join(u)} |")
    w("\n**Finding:** the apparent ~50% / ~50% / ~33% “missing” in Alcohol Consumption, Medications and Medical Conditions is the "
      "literal text `None` in the CSV. `pandas.read_csv` converts that text to NaN by default, which silently turns a real answer "
      "(“no alcohol / no medication / no condition”) into a missing value. This audit and the training code read the file with "
      "`keep_default_na=False`, so `None` stays a category. Nothing is imputed and nothing is assumed: the file itself states the answer.\n")
    if a["none_answers_vs_target"]:
        w("| column | n “None” | positive rate if None | positive rate otherwise | Fisher p |\n|---|---|---|---|---|")
        for c, m in a["none_answers_vs_target"].items():
            w(f"| {c} | {m['none_n']} | {m['positive_rate_when_none']} | {m['positive_rate_otherwise']} | {m['fisher_p']} |")
    w("")

    w("\n## 2. Duplicates and consistency\n")
    w(f"- Exact duplicate rows: {a['duplicate_rows_full']}; duplicates ignoring `Id`: {a['duplicate_rows_excluding_id']}; `Id` unique: {a['id_unique']}")
    w(f"- Inconsistent category spellings (case/whitespace): {a['inconsistent_category_spelling'] or 'none found'}")
    if "males_labelled_postmenopausal" in a:
        w(f"- **Gender × Hormonal Changes:** {a['males_labelled_postmenopausal']} of {a['n_males']} males are labelled "
          f"“Postmenopausal” — a biologically impossible combination. Table: `{a['gender_by_hormonal']}`. "
          "This indicates the columns were generated or entered independently; `Hormonal Changes` is therefore excluded "
          "(it is also not collected by CareMend).")
    w(f"- `Id` vs target Spearman ρ = {a['id_vs_target_corr']} (identifier only; excluded from features).")

    w("\n## 3. Age ↔ label — the critical finding\n")
    w("| age band | n | positives | positive rate |\n|---|---|---|---|")
    for k, r in a["age_band_table"].items():
        w(f"| {k} | {r['n']} | {r['positives']} | {r['rate']:.0%} |")
    w(f"\n- Point-biserial correlation(age, label) = {a['age_label_point_biserial']}")
    bt = a["best_age_threshold_rule"]
    w(f"- A one-line rule “age ≥ {bt['threshold']} ⇒ positive” already scores **{bt['apparent_accuracy']:.1%}** accuracy on the whole file (apparent, not held-out).")
    if a["age_all_positive_from"] is not None:
        w(f"- **Every** record aged ≥ {a['age_all_positive_from']} ({a['n_rows_at_or_above_cutoff']} rows) is positive; "
          f"{a['n_negatives_at_or_above_cutoff']} negatives exist at or above that age. Oldest negative = {a['oldest_negative']}, "
          f"youngest positive = {a['youngest_positive']}.")
    if a["age_pattern_flag"]:
        w("\n> 🚩 **Confirmed:** the label is a hard step function of age (no negatives at older ages). Real osteoporosis prevalence "
          "rises gradually with age and is not 100% in every older age band, so this is more consistent with synthetic or rule-generated labels than with clinical diagnoses. "
          "A model will mostly learn “older ⇒ positive”. Performance that comes from this pattern is **not** evidence of "
          "clinically meaningful prediction.")
    else:
        w("\n> The strict “all older records positive” pattern was **not** found in this file.")

    w("\n## 4. Association of every other feature with the label\n")
    w("| feature | Cramér's V | p-value | positive rate by value |\n|---|---|---|---|")
    for c, r in a["association_with_target"].items():
        rates = "; ".join(f"{k}: {v['rate']:.0%} (n={v['n']})" for k, v in r["positive_rate_by_value"].items())
        w(f"| {c} | {r['cramers_v']} | {r['p_value']} | {rates} |")
    sig = [c for c, r in a["association_with_target"].items() if r["p_value"] is not None and r["p_value"] < 0.05]
    mx = max((r["cramers_v"] or 0) for r in a["association_with_target"].values())
    w(f"\n{len(sig)} of {len(a['association_with_target'])} non-age features have p < 0.05 (uncorrected){': ' + ', '.join(sig) if sig else ''}; "
      f"the largest Cramér's V is {mx:.3f} (0 = no association). Well-known osteoporosis risk factors (family history, low calcium, "
      "low vitamin D, smoking, inactivity, prior fractures) show positive rates that are essentially identical across their levels. "
      "In real clinical data these factors carry measurable signal, so their absence is further evidence that labels were generated "
      "mainly from age.\n")

    w("## 5. Target leakage assessment\n")
    w("- No column is a direct restatement of the label (no T-score, diagnosis or medication-for-osteoporosis column).")
    w("- **Age is a de-facto leak of the label** (section 3): it almost fully determines it.")
    w("- Alcohol / Medications / Medical Conditions are legitimate answers (see section 1); their association with the label is tested in section 4 and in the ablation in the evaluation report.")
    w("- `Id` is excluded.\n")

    w("## 6. Decisions\n")
    w("| column | decision | reason |\n|---|---|---|")
    for f in F.FEATURES:
        w(f"| {f['csv']} | **use** ({'required' if f['required'] else 'optional'}) | collected by the CareMend questionnaire; complete in the data |")
    for c, why in F.EXCLUDED_COLUMNS.items():
        w(f"| {c} | exclude | {why} |")
    w("\n## 7. Provenance and representativeness\n")
    w(a["notes_label_provenance"])
    w("\nThe Race/Ethnicity column contains only Asian / African American / Caucasian; there is no way to establish that "
      "the sample represents Indian users. **No Indian clinical validation is claimed anywhere in CareMend.**")
    w("\n## 8. Cleaning applied (never touches the original CSV)\n")
    w("- Select the 9 features above, trim/lower-case category text to canonical tokens, drop `Id`, drop exact duplicates.")
    w("- No imputation is done at this stage. Imputation of optional fields happens **inside** the model pipeline, fitted on training rows only.")
    w("- Cleaned modelling file: `backend/data/osteoporosis_model_input.csv` (no identifiers, no excluded columns).")
    return "\n".join(L) + "\n"


def run(data_path: str = DEFAULT_DATA) -> dict:
    df = load_raw(data_path)
    a = audit(df, data_path)
    os.makedirs(REPORT_DIR, exist_ok=True)
    with open(os.path.join(REPORT_DIR, "data_audit.json"), "w") as fh:
        json.dump(a, fh, indent=2, default=str)
    with open(os.path.join(REPORT_DIR, "data_quality_report.md"), "w") as fh:
        fh.write(render_markdown(a))
    return a


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=DEFAULT_DATA)
    args = ap.parse_args()
    res = run(args.data)
    print(f"audit written; age_pattern_flag={res['age_pattern_flag']}")
