# CareMend — Model Training & Evaluation Report

_Model version `0.1.0-demo` · trained 2026-10-19T06:45:54+00:00 · scikit-learn 1.8.0 · seed 42_

> **Status: experimental technical demonstration — NOT a clinically meaningful risk estimator.** See sections 5–6.

## 1. Setup

- Data: `data/osteoporosis.csv` (SHA-256 `8ccd5b3f6de51d05…`), 1958 rows → 1954 after cleaning; positive rate 50.0%.
- Split: one stratified 1563/391 split (seed 42). Test rows are scored once, after model and threshold are fixed.
- Model comparison: 20× repeated stratified 5-fold CV on the **train split only**; metrics from pooled out-of-fold predictions, reported as mean ± sd over repeats (threshold 0.5).
- Preprocessing inside the Pipeline (fitted on training folds only): median-impute + standardise age; most-frequent-impute + one-hot categoricals.
- Hyper-parameters fixed a priori (LR: C=1, balanced class weights; RF: 300 trees, min_leaf=2, balanced) — no tuning on 1563 rows would be meaningful.
- XGBoost: included (v3.4.1).

## 2. Scenario × model comparison (train-split repeated CV)

| scenario | n (pos) | model | accuracy | sensitivity | specificity | precision | F1 | ROC-AUC | perm. p (AUC>chance) |
|---|---|---|---|---|---|---|---|---|---|
| Age only | 1563 (783) | logreg | 0.81 ± 0.01 | 0.79 ± 0.00 | 0.83 ± 0.01 | 0.83 ± 0.01 | 0.81 ± 0.00 | 0.91 ± 0.00 | 0.005 |
| Age only | 1563 (783) | random_forest | 0.92 ± 0.00 | 0.84 ± 0.00 | 1.00 ± 0.00 | 1.00 ± 0.00 | 0.91 ± 0.00 | 0.93 ± 0.00 | — |
| Age only | 1563 (783) | xgboost | 0.92 ± 0.00 | 0.84 ± 0.00 | 1.00 ± 0.00 | 1.00 ± 0.00 | 0.91 ± 0.00 | 0.93 ± 0.00 | — |
| All 9 features (incl. age) | 1563 (783) | logreg | 0.83 ± 0.00 | 0.79 ± 0.00 | 0.87 ± 0.00 | 0.86 ± 0.00 | 0.82 ± 0.00 | 0.91 ± 0.00 | 0.005 |
| All 9 features (incl. age) | 1563 (783) | random_forest | 0.86 ± 0.00 | 0.76 ± 0.00 | 0.97 ± 0.00 | 0.96 ± 0.00 | 0.85 ± 0.00 | 0.91 ± 0.00 | — |
| All 9 features (incl. age) | 1563 (783) | xgboost | 0.91 ± 0.00 | 0.84 ± 0.00 | 0.98 ± 0.00 | 0.98 ± 0.00 | 0.91 ± 0.00 | 0.93 ± 0.00 | — |
| Age EXCLUDED (8 features) | 1563 (783) | logreg | 0.50 ± 0.01 | 0.49 ± 0.01 | 0.50 ± 0.01 | 0.50 ± 0.01 | 0.50 ± 0.01 | 0.49 ± 0.01 | 0.726 |
| Age EXCLUDED (8 features) | 1563 (783) | random_forest | 0.50 ± 0.01 | 0.50 ± 0.02 | 0.50 ± 0.01 | 0.50 ± 0.01 | 0.50 ± 0.01 | 0.50 ± 0.01 | — |
| Age EXCLUDED (8 features) | 1563 (783) | xgboost | 0.48 ± 0.01 | 0.48 ± 0.01 | 0.47 ± 0.01 | 0.48 ± 0.01 | 0.48 ± 0.01 | 0.47 ± 0.01 | — |
| Age excluded, rows with age < 39 only | 994 (214) | logreg | 0.51 ± 0.01 | 0.49 ± 0.02 | 0.52 ± 0.01 | 0.22 ± 0.01 | 0.30 ± 0.01 | 0.50 ± 0.01 | 0.438 |
| Age excluded, rows with age < 39 only | 994 (214) | random_forest | 0.61 ± 0.01 | 0.27 ± 0.02 | 0.71 ± 0.01 | 0.20 ± 0.01 | 0.23 ± 0.01 | 0.49 ± 0.01 | — |
| Age excluded, rows with age < 39 only | 994 (214) | xgboost | 0.78 ± 0.00 | 0.00 ± 0.01 | 0.99 ± 0.00 | 0.12 ± 0.13 | 0.02 ± 0.01 | 0.44 ± 0.02 | — |
| ABLATION: age excluded + 5 non-deployed columns | 1563 (783) | logreg | 0.48 ± 0.01 | 0.48 ± 0.01 | 0.48 ± 0.01 | 0.49 ± 0.01 | 0.48 ± 0.01 | 0.47 ± 0.01 | 0.881 |
| ABLATION: age excluded + 5 non-deployed columns | 1563 (783) | random_forest | 0.49 ± 0.01 | 0.50 ± 0.01 | 0.49 ± 0.02 | 0.50 ± 0.01 | 0.50 ± 0.01 | 0.50 ± 0.01 | — |
| ABLATION: age excluded + 5 non-deployed columns | 1563 (783) | xgboost | 0.49 ± 0.01 | 0.49 ± 0.01 | 0.48 ± 0.01 | 0.49 ± 0.01 | 0.49 ± 0.01 | 0.49 ± 0.01 | — |
| ABLATION: all 9 + 5 non-deployed columns | 1563 (783) | logreg | 0.83 ± 0.00 | 0.79 ± 0.00 | 0.87 ± 0.01 | 0.86 ± 0.00 | 0.82 ± 0.00 | 0.91 ± 0.00 | 0.005 |
| ABLATION: all 9 + 5 non-deployed columns | 1563 (783) | random_forest | 0.86 ± 0.00 | 0.75 ± 0.00 | 0.98 ± 0.00 | 0.97 ± 0.00 | 0.84 ± 0.00 | 0.90 ± 0.00 | — |
| ABLATION: all 9 + 5 non-deployed columns | 1563 (783) | xgboost | 0.91 ± 0.00 | 0.85 ± 0.00 | 0.98 ± 0.00 | 0.98 ± 0.00 | 0.91 ± 0.00 | 0.93 ± 0.00 | — |

Precision/F1 `nan` can occur when a repeat predicts no positives.

## 3. Hold-out test results (reporting only; nothing was selected on these rows)

| scenario | model | n_test | accuracy | sensitivity | specificity | precision | F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|---|
| Age only | logreg | 391 | 0.77 | 0.74 | 0.81 | 0.80 | 0.77 | 0.87 |
| Age only | random_forest | 391 | 0.88 | 0.77 | 1.00 | 1.00 | 0.87 | 0.89 |
| Age only | xgboost | 391 | 0.88 | 0.77 | 1.00 | 1.00 | 0.87 | 0.89 |
| All 9 features (incl. age) | logreg | 391 | 0.80 | 0.73 | 0.86 | 0.84 | 0.78 | 0.87 |
| All 9 features (incl. age) | random_forest | 391 | 0.83 | 0.72 | 0.95 | 0.93 | 0.81 | 0.88 |
| All 9 features (incl. age) | xgboost | 391 | 0.88 | 0.77 | 0.99 | 0.99 | 0.87 | 0.89 |
| Age EXCLUDED (8 features) | logreg | 391 | 0.47 | 0.51 | 0.44 | 0.47 | 0.49 | 0.47 |
| Age EXCLUDED (8 features) | random_forest | 391 | 0.48 | 0.53 | 0.43 | 0.48 | 0.50 | 0.47 |
| Age EXCLUDED (8 features) | xgboost | 391 | 0.52 | 0.54 | 0.49 | 0.52 | 0.53 | 0.51 |
| Age excluded, rows with age < 39 only | logreg | 258 | 0.48 | 0.52 | 0.46 | 0.24 | 0.33 | 0.48 |
| Age excluded, rows with age < 39 only | random_forest | 258 | 0.55 | 0.33 | 0.62 | 0.22 | 0.26 | 0.49 |
| Age excluded, rows with age < 39 only | xgboost | 258 | 0.76 | 0.00 | 1.00 | nan | nan | 0.52 |
| ABLATION: age excluded + 5 non-deployed columns | logreg | 391 | 0.51 | 0.54 | 0.48 | 0.51 | 0.52 | 0.49 |
| ABLATION: age excluded + 5 non-deployed columns | random_forest | 391 | 0.52 | 0.54 | 0.50 | 0.52 | 0.53 | 0.54 |
| ABLATION: age excluded + 5 non-deployed columns | xgboost | 391 | 0.50 | 0.48 | 0.51 | 0.50 | 0.49 | 0.51 |
| ABLATION: all 9 + 5 non-deployed columns | logreg | 391 | 0.80 | 0.73 | 0.87 | 0.85 | 0.79 | 0.88 |
| ABLATION: all 9 + 5 non-deployed columns | random_forest | 391 | 0.84 | 0.71 | 0.98 | 0.97 | 0.82 | 0.88 |
| ABLATION: all 9 + 5 non-deployed columns | xgboost | 391 | 0.88 | 0.78 | 0.98 | 0.97 | 0.86 | 0.88 |
| Rule: age ≥ 39 ⇒ positive (learnt on train) | — | 391 | 0.84 | 0.68 | 1.00 | 1.00 | 0.81 | — |

(threshold 0.5 in this table.)

## 4. Selected model

- Rule: take the model with the highest mean out-of-fold balanced accuracy on `all_features`, but keep the simpler, interpretable Logistic Regression unless the winner beats it by more than sampling noise (95% paired-bootstrap CI of the balanced-accuracy difference must exclude 0). Raw accuracy alone is not used.
- Candidates (mean OOF balanced accuracy): logreg 0.830, random_forest 0.865, xgboost 0.914; best by raw score: **xgboost**.
- Paired bootstrap, xgboost − logreg: +0.087, 95% CI [+0.070, +0.105] → CI excludes 0: the complex model is credibly better.
- Rule's statistical choice: **xgboost**.
- ⚠️ **Deployment override → logreg.** The statistical winner's advantage comes from fitting the step-like age pattern in the labels (an age-only model of the same type scores about the same as the all-feature model, and every model is at chance without age). That makes it a better reproducer of a suspect labelling artifact, not a better clinical predictor. The winner also gives no per-answer explanation and adds a heavy runtime dependency. The simpler, explainable Logistic Regression is deployed; use --deploy-model auto to deploy the rule's choice. (age-only xgboost balanced accuracy: 0.921.)
- **Deployed: logreg**.
- _Disclosure:_ the uncertainty check was added after a first run on the 50-row sample in which raw balanced accuracy alone would have selected the Random Forest by a margin well inside the noise. It was added because the brief forbids choosing on accuracy alone, not to obtain a particular answer.
- Decision threshold **0.199** — highest specificity with train out-of-fold sensitivity >= 90%.
- Hold-out at that threshold (n=391): sensitivity 0.86, specificity 0.62, precision 0.70, F1 0.77, accuracy 0.74, ROC-AUC 0.87; confusion matrix TN=121 FP=74 FN=27 TP=169 → `confusion_matrix.png`.
- **Price of the sensitivity-first threshold:** specificity on the hold-out is 0.62 (74 false positive(s) among 195 negatives), so many people will be scored HIGH. For a screening prompt ("consider seeing a doctor") that trade-off is deliberate.
- Deployed artifact fitted on 1563 rows (`--refit-full` not used), i.e. exactly the model that was evaluated.
- Top terms (`feature_importance.png`): age (+3.36), smoking_yes (-0.24), physical_activity_sedentary (+0.19), body_weight_underweight (+0.15), prior_fractures_yes (+0.12), calcium_intake_low (-0.08).
- Calibration: **not performed** (not justified by this data); the score is not a probability.

## 5. Effect of age — what the numbers say

- Age alone (LR): balanced accuracy 0.81 ± 0.01, AUC 0.91 ± 0.00.  All features (LR): balanced accuracy 0.83 ± 0.00, AUC 0.91 ± 0.00. If the full model is not clearly better than age alone, the other eight features add nothing reliable beyond age.
- Age **excluded** (LR): balanced accuracy 0.50 ± 0.01, AUC 0.49 ± 0.01, permutation p = 0.726. This is statistically indistinguishable from chance → the apparent performance of the full model comes from age.
- Restricting to rows below the age at which labels become uniformly positive (n=994), excluding age: LR AUC 0.50 ± 0.01, permutation p = 0.438. This is the only region where labels vary, and it is the fairest test of whether lifestyle features predict anything.
- Age was **not** removed from the deployed model merely to change metrics: it is a genuine clinical risk factor and CareMend collects it. It is analysed separately to show how much of the performance depends on it.

## 6. Honest interpretation

- **Data problems dominate.** Labels are a step function of age (see data-quality report), the file is tiny, label provenance is unknown, and representativeness for Indian users is unknown. Under these conditions a high test score cannot be read as clinically meaningful prediction.
- **False negatives** (a person with osteoporosis scored LOW) are the costly error in screening: they may delay a DEXA scan and treatment. **False positives** cost an unnecessary scan and anxiety. The threshold was therefore chosen for high sensitivity — but with so few rows its true sensitivity is highly uncertain, and a LOW result must never be read as reassurance.
- The deployed model therefore functions as a **technical demonstration of an integrated ML pipeline**, not a screening tool. To make real claims CareMend needs appropriately labelled (DEXA-confirmed), representative, adequately sized data, followed by external validation.

## 7. Reproduce

```bash
pip install -r backend/ml/requirements_ml.txt
python backend/ml/train_osteoporosis_model.py            # audit + train + reports + artifacts
python backend/ml/train_osteoporosis_model.py --data /path/to/full/osteoporosis.csv --refit-full
```
