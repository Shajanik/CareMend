# CareMend — rule-based osteoporosis risk screening (experimental)

> **CareMend is an experimental student project. It is not a clinically validated tool, not a diagnosis, and must not guide treatment.**
> The Low / Medium / High categories come from a small, transparent rule set that has **not** been clinically reviewed or validated. It is not FRAX.

Frontend: React + Vite + TypeScript (`src/`). Backend: Flask + SQLAlchemy (`backend/`). Deploy: Vercel (frontend), Render/Heroku-style `Procfile`/Docker (backend).

## Why rules, not machine learning

The only dataset available has a binary `Osteoporosis` label with no DXA/T-score provenance. Every record aged ≥ 39 is positive and under-39s are ~22% positive at random, with no link to any other feature (see `backend/ml/reports/model_evaluation_report.md`). A model trained on it can only learn "age ≥ 39", so it labelled healthy 29-year-olds HIGH. Labels must not be invented, so the ML score was **retired from scoring** (the `ml/` code, reports and `models/osteoporosis/` are kept only to document this). Real ML needs DXA-confirmed, representative data and external validation.

## How an assessment works

```
RiskAssessment.tsx ──(utils/assessmentPayload.ts)──▶ POST /api/assessment/submit
        questionnaire                                   │ validate + apply rules (services/risk_screening.py)
                                                        │ store profile + full response (user_profiles, assessment_results)
RiskResult.tsx  ◀───────────── structured JSON ─────────┘
```

## The rules (`backend/services/risk_screening.py`)

**Strong indicators — any one gives HIGH, and nothing else can lower it:** previous fragility fracture; previous DXA result in the osteoporosis range (T-score ≤ −2.5).

**Counted risk factors:** age 65+; post-menopausal; BMI < 18.5; parent with hip fracture; current smoker; higher alcohol use (about 3+ drinks/day); physically inactive; calcium possibly inadequate; vitamin D deficient; long-term corticosteroids (≈3+ months); rheumatoid arthritis; previous DXA in the osteopenia range.

| Result | Rule |
|---|---|
| **LOW** | no strong indicator and no counted factor (preliminary screening, *not* proof of healthy bones) |
| **MEDIUM** | 1–2 counted factors |
| **HIGH** | any strong indicator, or 3+ counted factors (`HIGH_FACTOR_COUNT`) |

The "3+" cut-off is a project design choice that needs clinical review. Questions answered "Not sure" or skipped are **never guessed**: they are not counted and are listed in the response (`explanation.unanswered`), because the result may then under-estimate risk. A DXA result is a diagnostic measurement, used only as an extra indicator.

## Questionnaire ⇄ API fields

| Questionnaire | API field | Values |
|---|---|---|
| Age *(required)* | `age` | integer 18–100 |
| Sex *(required)* | `gender` | female / male |
| Menopause status (females) | `menopause_status` | premenopausal / postmenopausal / unknown |
| Height + weight (optional) | `height_cm`, `weight_kg` | numbers, both or neither → BMI (underweight / normal / overweight / obese) |
| Fragility fracture | `fragility_fracture` | yes / no / unknown |
| Parent hip fracture | `parent_hip_fracture` | yes / no / unknown |
| Smoking | `smoking` | yes / no / unknown |
| Alcohol | `alcohol` | none_low / higher / unknown |
| Physical activity | `physical_activity` | regular / occasional / inactive / unknown |
| Calcium intake | `calcium_intake` | adequate / possibly_inadequate / unknown |
| Vitamin D | `vitamin_d_status` | adequate / deficient / unknown |
| Long-term corticosteroids | `corticosteroids_long_term` | yes / no / unknown |
| Rheumatoid arthritis | `rheumatoid_arthritis` | yes / no / unknown |
| Previous DXA (optional) | `dxa_result` | normal / osteopenia / osteoporosis / unknown |

`GET /api/model/schema` serves the contract.

## API

`POST /api/assessment/submit` (stores the result) · `POST /predict` (stateless) · `GET /api/model/schema`

```jsonc
// 200 (abridged)
{"success": true, "profileId": 41, "riskLevel": "MEDIUM",
 "prediction": {"category": "MEDIUM", "meaning": "...", "method": "rule_based",
                "ruleset_version": "rules-0.2.0", "clinically_validated": false},
 "explanation": {"reasoning": "MEDIUM because 2 risk factors were found.",
                 "strong_indicators": [], "risk_factors": [{"key": "smoking", "label": "Current smoker", "detail": "..."}],
                 "factor_count": 2, "high_factor_threshold": 3,
                 "unanswered": [{"field": "alcohol", "label": "Alcohol use"}], "answers_complete": false},
 "bmi": {"value": 22.7, "category": "normal"}, "input_warnings": [], "inputs_used": {...},
 "model": {"version": "rules-0.2.0", "type": "rule_based_screening", "status": "experimental"},
 "limitations": ["..."], "disclaimer": "..."}
```
Errors: `400 {"error":"Validation failed","details":[{"field","message"}]}` · `500` screening failure. There is no score, probability or percentage; `risk_percentage` is stored as `NULL` and `assessment_results.score` holds the number of risk factors found.

## Legacy ML demo (retired)

### Data pipeline & training

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt -r backend/ml/requirements_ml.txt
python backend/ml/train_osteoporosis_model.py          # audit → clean → compare → evaluate → save (≈15 min on 1,958 rows)
#   --deploy-model auto|logreg|random_forest|xgboost   (default logreg, see report)
#   --refit-full                                      refit the deployed pipeline on all rows (evaluation stays train/test)
```
Inputs: `backend/data/osteoporosis.csv` (never modified; SHA-256 recorded in metadata). Outputs:
`backend/models/osteoporosis/{model.joblib, model_metadata.json}`, `backend/data/osteoporosis_model_input.csv` (cleaned, 9 features + label, no identifiers) and `backend/ml/reports/` (`data_quality_report.md`, `model_evaluation_report.md`, `confusion_matrix.png`, `feature_importance.png`, `metrics.json`, `data_audit.json`).

Key preprocessing decisions (details in the data-quality report): read with `keep_default_na=False` because the literal text `None` in Alcohol/Medications/Medical Conditions is a real answer that pandas would turn into NaN; `Id`, Hormonal Changes (males labelled postmenopausal), Race/Ethnicity (no Indian category) excluded; imputer/encoder/scaler fitted on training folds only; stratified 80/20 split, seed 42; repeated stratified CV on the train split only for comparison; test set scored once.

### Honest evaluation summary

See `backend/ml/reports/model_evaluation_report.md` for the numbers. In short: every record aged ≥ 39 is labelled positive (and none of the other features shows any association with the label), so apparent performance comes from age alone; with age removed every model is at chance (AUC ≈ 0.5). The labels are therefore consistent with synthetic/rule-generated data, their provenance is undocumented, and Indian representativeness is unknown. **This model cannot establish clinically meaningful osteoporosis risk, which is why it no longer scores anyone.** To make real claims you need DEXA-confirmed, representative, adequately sized data and external validation.

## Tests

```bash
npm install                                        # needed once for the frontend contract tests
pip install -r backend/requirements.txt -r backend/ml/requirements_ml.txt
cd backend && python -m pytest tests -q            # rules + API + frontend-contract + e2e + regression (+ legacy ML demo tests)
npm run build                                      # frontend production build
```

## Run locally

```bash
cd backend && python app.py                        # API on :5000
VITE_API_URL=http://localhost:5000 npm run dev     # frontend
```

## Deployment

* Backend `Procfile`/Dockerfile unchanged. The rule set needs no model artifact; scikit-learn is only needed for the legacy demo.
* `GET /api/system/health` reports the screening module (key `ml_model` kept for compatibility, now `type: rule_based_screening`).
* Env vars: `DATABASE_URL`, `JWT_SECRET_KEY`, `GROQ_API_KEY` (existing), `VITE_API_URL` (frontend).
* The table `assessment_results` is created automatically by `db.create_all()`; no migration of `user_profiles` is needed. Unanswered questions are stored as `"unknown"`; older rows made by the ML demo still load.
