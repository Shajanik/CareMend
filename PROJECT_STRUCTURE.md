# CareMend Project Structure

Complete guide to the CareMend project organization.

## 📁 Root Level Structure

```
hml-main/
├── frontend/                    # React TypeScript frontend
├── backend/                     # Flask Python backend
├── .git/                        # Git repository
├── .gitignore                   # Git ignore rules
├── package.json                 # Root package file (if monorepo)
├── README.md                    # Main project README
├── RENDER_DEPLOYMENT.md         # Deployment guide
├── PROJECT_STRUCTURE.md         # This file
└── Procfile                     # Heroku/Render process file
```

## 🎨 Frontend Structure

```
frontend/
├── src/
│   ├── pages/                   # Full page components (routing views)
│   │   ├── RiskAssessment.tsx
│   │   ├── RiskResult.tsx
│   │   ├── Dashboard.tsx
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── CareConnect.tsx
│   │   ├── CommunityForum.tsx
│   │   ├── NutritionPlanView.tsx
│   │   ├── PersonalizedExerciseCoach.tsx
│   │   ├── MeditationView.tsx
│   │   └── ...more pages
│   │
│   ├── components/              # Reusable UI components
│   │   ├── common/              # Generic UI components
│   │   │   ├── CustomInput.tsx
│   │   │   ├── CustomDropdown.tsx
│   │   │   ├── CustomButton.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── CaremendLogo.tsx
│   │   │   └── FormStep.tsx
│   │   │
│   │   ├── assessment/          # Assessment-specific
│   │   │   └── RiskGauge.tsx    # Visual risk indicator
│   │   │
│   │   ├── dashboard/           # Dashboard-specific
│   │   │   ├── RecommendationEngine.tsx
│   │   │   └── NutritionAssistant.tsx
│   │   │
│   │   └── forms/               # Form utilities
│   │       ├── FormLayout.tsx
│   │       └── FormField.tsx
│   │
│   ├── services/                # API & external services
│   │   └── api.ts               # API configuration & helpers
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAssessment.ts
│   │   ├── useUser.ts
│   │   └── useFetch.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── assessmentPayload.ts # Frontend->Backend field mapping
│   │   ├── userSessionManager.ts
│   │   └── validators.ts
│   │
│   ├── config/                  # Configuration
│   │   ├── api.ts               # API base URL & helpers
│   │   ├── authService.ts       # Auth config
│   │   └── constants.ts         # App constants
│   │
│   ├── types/                   # TypeScript definitions
│   │   ├── index.ts             # Main types file
│   │   ├── api.ts
│   │   ├── assessment.ts
│   │   └── user.ts
│   │
│   ├── styles/                  # Global styles
│   │   └── globals.css
│   │
│   ├── App.tsx                  # Root component (routing)
│   └── main.tsx                 # React entry point
│
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── fonts/
│
├── index.html                   # HTML template
├── index.css                    # Global CSS
├── package.json                 # Dependencies
├── package-lock.json
├── vite.config.ts               # Vite bundler config (with proxy)
├── tsconfig.json                # TypeScript config
├── vite-env.d.ts                # Vite type definitions
├── .gitignore
├── README.md                    # Frontend README
└── .env.example                 # Environment variables template
```

## 🐍 Backend Structure

```
backend/
├── app.py                       # Flask application entry point
├── config.py                    # Configuration & environment vars
├── extensions.py                # Flask extensions (db, etc)
├── gunicorn_config.py           # Gunicorn server config
│
├── routes/                      # API endpoint blueprints
│   ├── __init__.py
│   ├── assessment_routes.py     # /api/assessment/*
│   ├── predict_routes.py        # /api/predict/*
│   ├── auth_routes.py           # /auth/*
│   ├── user_routes.py           # /user/*
│   ├── nutrition_routes.py      # /nutrition/*
│   ├── nutrition_plan_routes.py
│   ├── exercise_routes.py
│   ├── exercise_plan_routes.py
│   ├── careconnect_routes.py
│   ├── forum_routes.py
│   ├── history_routes.py
│   └── system_routes.py
│
├── services/                    # Business logic & external APIs
│   ├── risk_screening.py        # Rule-based screening engine
│   ├── assessment_store.py      # Assessment persistence
│   ├── groq_service.py          # Groq AI integration
│   ├── ml_service.py            # ML model service
│   ├── nutrition_service.py
│   ├── hybrid_engine.py
│   ├── personalized_plan_service.py
│   ├── risk_service.py
│   ├── firebase_client.py       # Firebase (deprecated)
│   ├── gemini_bridge.js         # Node.js Gemini bridge
│   └── geminiService.js
│
├── models_db/                   # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── user_model.py            # User & UserProfile
│   ├── auth_model.py            # Authentication
│   ├── nutrition_model.py
│   ├── exercise_model.py
│   ├── forum_model.py
│   └── careconnect_model.py
│
├── ml/                          # Machine learning (legacy)
│   ├── train_osteoporosis_model.py
│   ├── train_hybrid_model.py
│   ├── features.py
│   ├── predict_osteoporosis_risk.py
│   ├── data_audit.py
│   ├── requirements_ml.txt
│   └── reports/                 # Model evaluation reports
│       ├── confusion_matrix.png
│       ├── feature_importance.png
│       ├── data_audit.json
│       ├── metrics.json
│       ├── data_quality_report.md
│       └── model_evaluation_report.md
│
├── models/                      # Trained model artifacts
│   ├── osteoporosis/
│   │   ├── model.joblib
│   │   └── model_metadata.json
│   ├── hybrid_model.pkl
│   ├── hybrid_scaler.pkl
│   └── hybrid_feature_cols.pkl
│
├── data/                        # Training/seed data
│   ├── osteoporosis.csv
│   └── osteoporosis_model_input.csv
│
├── database/                    # SQLite (dev only)
│   └── db.sqlite3               # Local database file
│
├── utils/                       # Utility modules
│   ├── logger.py                # Application logging
│   └── validators.py            # Input validation
│
├── requirements.txt             # Python dependencies
├── requirements_ml.txt          # ML-specific dependencies
├── runtime.txt                  # Python version (Heroku/Render)
├── Procfile                     # Process definition
├── docker-compose.yml           # Docker compose config
├── Dockerfile                   # Docker image config
├── gunicorn_config.py           # Gunicorn configuration
├── .gitignore
├── .env.example                 # Environment variables template
└── README.md                    # Backend README
```

## 🔄 Key File Relationships

### Frontend → Backend
```
frontend/src/pages/RiskAssessment.tsx
  └─ calls buildAssessmentPayload() [src/utils/assessmentPayload.ts]
    └─ creates payload with field mapping
      └─ sends to POST /api/assessment/submit
        └─ backend/routes/assessment_routes.py
          └─ calls om.predict() [services/risk_screening.py]
            └─ returns AssessmentResult
          └─ saves to database [services/assessment_store.py]
            └─ returns JSON with prediction
```

### Type Consistency
```
frontend/src/types/index.ts (TypeScript interfaces)
  ├─ HealthData - Frontend form data
  ├─ AssessmentResult - Backend response
  └─ Maps to assessmentPayload.ts field names
    └─ matches backend/services/risk_screening.py FEATURES
```

### Configuration Flow
```
Frontend:
  src/config/api.ts
    ├─ Checks VITE_API_URL env var
    ├─ Falls back to import.meta.env.DEV detection
    └─ Points to localhost:5000 (dev) or production URL
  vite.config.ts
    └─ Proxies /api/* requests to backend

Backend:
  config.py
    ├─ Loads DATABASE_URL from environment
    ├─ Loads GROQ_API_KEY from environment
    ├─ Loads JWT_SECRET_KEY from environment
    └─ Defaults to SQLite if no DATABASE_URL
  app.py
    ├─ Initializes db
    ├─ Registers blueprints
    └─ Runs on PORT environment variable
```

## 📊 Data Flow

### Assessment Submission
```
1. User fills form in RiskAssessment.tsx
2. Submit calls buildAssessmentPayload()
3. Payload sent to /api/assessment/submit
4. Backend validates with risk_screening.validate_input()
5. Screening applied with risk_screening.predict()
6. Result saved to UserProfile + AssessmentResult tables
7. Response includes prediction + explanation
8. Frontend renders RiskResult.tsx
9. User navigates to Dashboard
```

### API Response Structure
```
{
  "prediction": { category, meaning, method, version },
  "explanation": { reasoning, risk_factors, strong_indicators },
  "bmi": { value, category },
  "inputs_used": { ...echo of submitted data },
  "limitations": [...disclaimers],
  "disclaimer": "...legal disclaimer"
}
```

## 🔐 Environment Variables

### Frontend (src/config/api.ts)
```
VITE_API_URL      - Optional: Override backend URL
```

### Backend (config.py)
```
DATABASE_URL      - PostgreSQL connection (production)
JWT_SECRET_KEY    - Token signing key (required)
GROQ_API_KEY      - AI service key (optional)
PORT              - Server port (default: 5000)
HOST              - Server host (default: 0.0.0.0)
FLASK_DEBUG       - Debug mode (never True in prod)
```

## 🚀 Deployment Architecture

### Local Development
```
Frontend (localhost:3000)
  ├─ Vite dev server
  └─ Proxies /api/* to localhost:5000

Backend (localhost:5000)
  └─ Flask dev server
    └─ Uses SQLite database
```

### Production (Render)
```
Frontend (Vercel/Netlify)
  ├─ Static site
  └─ API calls to backend URL

Backend (Render Web Service)
  ├─ Gunicorn server
  ├─ PostgreSQL database
  └─ Environment variables for secrets
```

## 📦 Dependencies

### Frontend (package.json)
- React 19
- TypeScript 5.8
- Vite 6
- Tailwind CSS 4
- Framer Motion (animations)
- React Router 7
- Firebase (auth)
- Lucide React (icons)

### Backend (requirements.txt)
- Flask 2.3
- Flask-CORS
- Flask-SQLAlchemy
- SQLAlchemy 2+
- Pandas 2+
- Scikit-learn 1.8
- Groq (AI)
- PyJWT (tokens)
- Python-dotenv

## 🔗 Important Files to Edit

### Adding New API Endpoint
1. Create route in `backend/routes/your_routes.py`
2. Register blueprint in `backend/app.py`
3. Create matching TypeScript types in `frontend/src/types/`
4. Create API call in `frontend/src/services/`

### Adding New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Link in navigation component

### Updating Assessment Fields
1. Update backend: `backend/services/risk_screening.py` FEATURES
2. Update frontend types: `frontend/src/types/index.ts` HealthData
3. Update payload mapping: `frontend/src/utils/assessmentPayload.ts`
4. Update form: `frontend/src/pages/RiskAssessment.tsx`

## 📋 Git Workflow

```
Main branch → Production code
├─ Protected, requires PR review
├─ Deployed to Render/Vercel

Develop branch → Integration
└─ Feature branches → Pull Requests → Develop → Main
```

## 🔍 Common Tasks

### Finding Code
```
Assessment validation    → backend/services/risk_screening.py
Form component          → frontend/src/pages/RiskAssessment.tsx
API endpoints           → backend/routes/*.py
Type definitions        → frontend/src/types/index.ts
Styling                 → Component style props or index.css
```

### Adding Features
1. Define types in frontend/src/types/
2. Create backend route in backend/routes/
3. Implement business logic in backend/services/
4. Create frontend component in frontend/src/pages/ or components/
5. Wire up navigation in frontend/src/App.tsx
6. Test locally, commit, push to feature branch
7. Create PR to develop branch

---

**Last Updated:** October 2026
**Version:** 1.0.0
