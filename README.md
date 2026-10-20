# CareMend — Comprehensive Bone Health Management Platform

> **CareMend is an experimental student project.** It is not a clinically validated tool, not a diagnosis, and must not guide treatment. The risk categories come from a transparent rule set that has **not** been clinically reviewed or validated.

A full-stack web application for osteoporosis risk assessment with personalized health recommendations, CareConnect AI guidance, and community support.

## 📁 Project Structure

```
hml-main/
├── frontend/                    # React TypeScript frontend (Vite)
│   ├── src/
│   │   ├── pages/              # Full page views (assessment, dashboard, etc)
│   │   ├── components/         # Reusable UI components
│   │   ├── services/           # API integration
│   │   ├── utils/              # Utility functions
│   │   ├── config/             # Configuration
│   │   └── types/              # TypeScript types
│   └── README.md               # Frontend guide
│
├── backend/                     # Flask Python backend
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic & screening engine
│   ├── models_db/              # SQLAlchemy ORM models
│   ├── ml/                     # ML models (legacy, retired from scoring)
│   └── README.md               # Backend guide
│
├── PROJECT_STRUCTURE.md         # 📖 Detailed folder structure & architecture
├── RENDER_DEPLOYMENT.md         # 🚀 Production deployment guide
└── README.md                    # This file
```

**→ See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for complete folder structure**

## 🎯 Features

- **Rule-Based Risk Screening** - Transparent, auditable risk assessment (not ML)
- **Personalized Plans** - Nutrition and exercise recommendations
- **CareConnect AI** - Healthcare guidance powered by Groq API
- **Doctor Connect** - Book appointments with healthcare providers
- **Community Forum** - Connect with other users
- **Health Tracking** - Monitor activity and nutrition
- **Dashboard** - Centralized health overview

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- React Router + Firebase
- Lucide icons

### Backend
- Flask 2.3 + SQLAlchemy 2
- PostgreSQL (prod) / SQLite (dev)
- Groq AI API integration
- PyJWT authentication

### Deployment
- Vite (frontend dev server with proxy)
- Gunicorn (production server)
- Render (hosting)
- Vercel (frontend alternative)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ with npm
- Python 3.11+
- PostgreSQL (production) or SQLite (development)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
✅ Backend running on http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend running on http://localhost:3000

### Test the App
1. Open http://localhost:3000
2. Click "Start Assessment"
3. Complete 3-step questionnaire
4. View your risk result
5. Explore dashboard recommendations

## 📋 Assessment Flow

```
RiskAssessment.tsx
  ↓ (utils/assessmentPayload.ts - field mapping)
POST /api/assessment/submit
  ↓ (backend/services/risk_screening.py - rule application)
  ├─ Validate inputs
  ├─ Apply screening rules
  └─ Store in database (UserProfile + AssessmentResult)
  ↓
RiskResult.tsx (displays prediction)
  ↓
Dashboard.tsx (personalized recommendations)
```

## 🧠 Risk Screening Rules

### Strong Indicators (Auto-HIGH)
- Previous fragility fracture
- Previous DXA result ≤ -2.5 (osteoporosis range)

### Counted Risk Factors
Age 65+, postmenopausal, BMI <18.5, parent hip fracture, smoking, higher alcohol, inactive, low calcium, vitamin D deficiency, corticosteroids, rheumatoid arthritis, DXA osteopenia

| Result | Criteria |
|--------|----------|
| **LOW** | No strong indicator + <1 factor |
| **MEDIUM** | 1-2 factors |
| **HIGH** | Any strong indicator OR ≥3 factors |

> The "3+ factors" cutoff is a project design choice that needs clinical validation.

## 📡 API Endpoints

### Assessment
```
POST   /api/assessment/submit          # Submit assessment and get prediction
GET    /api/model/schema                # Get model input schema
GET    /api/profile/<user_id>          # Get user profile and history
```

### Health Check
```
GET    /health                          # Server health
GET    /                                # Root endpoint
```

### Response Structure
```json
{
  "prediction": {
    "category": "LOW|MEDIUM|HIGH",
    "meaning": "...",
    "method": "rule_based",
    "clinically_validated": false
  },
  "explanation": {
    "reasoning": "...",
    "risk_factors": [...],
    "strong_indicators": [...],
    "factor_count": 2
  },
  "bmi": { "value": 22.5, "category": "normal" },
  "limitations": [...],
  "disclaimer": "..."
}
```

## 🔐 Environment Variables

### Frontend (optional)
```bash
VITE_API_URL=http://localhost:5000  # Backend URL (auto-detected if not set)
```

### Backend (required for production)
```bash
DATABASE_URL=postgresql://user:pass@host/db    # PostgreSQL connection
JWT_SECRET_KEY=<32-character-secret>           # Token signing key
GROQ_API_KEY=gsk_xxxxx                        # AI service (optional)
FLASK_DEBUG=False                              # Debug mode
```

See [backend/.env.example](./backend/.env.example) for complete reference.

## 🚀 Production Deployment

### Deploy to Render (Recommended)

1. **Create PostgreSQL Database**
   - Render Dashboard → New → PostgreSQL
   - Copy CONNECTION_URL

2. **Deploy Backend**
   - Create Web Service from GitHub repo
   - Build: `pip install -r backend/requirements.txt`
   - Start: `gunicorn app:app`

3. **Add Environment Variables**
   ```
   DATABASE_URL        (from PostgreSQL step)
   JWT_SECRET_KEY      (generate new one)
   GROQ_API_KEY        (optional, from https://console.groq.com/keys)
   FLASK_DEBUG         False
   ```

4. **Deploy Frontend to Vercel**
   - Connect GitHub repo
   - Root directory: `frontend`
   - Build: `npm run build`
   - Output: `dist`

**→ See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed step-by-step instructions**

## 💾 Database

### Development
- SQLite automatically created at `backend/database/db.sqlite3`
- No setup required, just run the app

### Production
- PostgreSQL (set DATABASE_URL)
- Tables auto-created via SQLAlchemy on startup
- No migration scripts needed for initial deployment

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Complete file/folder organization |
| [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) | Production deployment checklist |
| [frontend/README.md](./frontend/README.md) | Frontend development guide |
| [backend/README.md](./backend/README.md) | Backend development guide |
| [backend/.env.example](./backend/.env.example) | Environment variables reference |

## 🔧 Development

### Adding a New Feature
1. Define types in `frontend/src/types/`
2. Create backend route in `backend/routes/`
3. Implement service logic in `backend/services/`
4. Build frontend component in `frontend/src/pages/` or `components/`
5. Wire navigation in `frontend/src/App.tsx`

### Running Tests
```bash
# Frontend type check
cd frontend && npm run lint

# Backend tests (if available)
cd backend && python -m pytest tests/
```

### Building for Production
```bash
# Frontend
cd frontend && npm run build        # Output: dist/

# Backend uses Procfile
# Gunicorn reads from backend/
```

## 🌐 API Development

### Adding New Endpoint
1. Create route file in `backend/routes/`
2. Register blueprint in `backend/app.py`
3. Add types in `frontend/src/types/`
4. Create service call in `frontend/src/services/`

### Field Mapping
Frontend form fields → Backend API fields via `frontend/src/utils/assessmentPayload.ts`

Ensure consistency:
- Frontend HealthData type
- assessmentPayload.ts mapping
- Backend risk_screening.py FEATURES

## 🧪 Type Safety

Both frontend and backend maintain type consistency:
- **Frontend**: TypeScript types in `src/types/`
- **Payload Mapping**: `src/utils/assessmentPayload.ts` 
- **Backend**: Validation in `services/risk_screening.py`

## 🔍 Key Files

### Frontend
| File | Purpose |
|------|---------|
| `src/pages/RiskAssessment.tsx` | Assessment form (3 steps) |
| `src/pages/RiskResult.tsx` | Result display & navigation |
| `src/pages/Dashboard.tsx` | Personalized recommendations |
| `src/utils/assessmentPayload.ts` | Field mapping to backend |
| `src/config/api.ts` | API configuration |
| `src/types/index.ts` | TypeScript types |

### Backend
| File | Purpose |
|------|---------|
| `app.py` | Flask entry point |
| `config.py` | Configuration & env vars |
| `routes/assessment_routes.py` | Assessment endpoints |
| `services/risk_screening.py` | Screening engine & rules |
| `services/assessment_store.py` | Database operations |
| `models_db/user_model.py` | SQLAlchemy models |

## 🐛 Troubleshooting

### "Could not reach the server"
```bash
# Check backend is running
curl http://localhost:5000/health

# If not, restart backend
cd backend && python app.py
```

### Database connection error
```bash
# For development (SQLite)
# Just restart the app, database auto-creates

# For production, verify DATABASE_URL is set:
echo $DATABASE_URL
```

### Port already in use
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :3000
kill -9 <PID>
```

## 📜 License

MIT License

## 🎓 Important Notes

- **Not clinically validated** - This is an experimental screening tool
- **Not a diagnosis** - Results must be reviewed by healthcare professionals
- **Transparent rules** - All logic is auditable, no opaque ML
- **Student project** - Built for educational purposes

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: October 2026

For detailed information, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
