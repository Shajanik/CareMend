# CareMend Frontend

A React + TypeScript + Vite frontend for the CareMend osteoporosis risk assessment platform.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/               # Full page components (views)
│   │   ├── RiskAssessment.tsx
│   │   ├── Dashboard.tsx
│   │   ├── HomePage.tsx
│   │   └── ...
│   │
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Generic UI components
│   │   │   ├── CustomInput.tsx
│   │   │   ├── CustomDropdown.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── assessment/      # Assessment-specific components
│   │   │   └── RiskGauge.tsx
│   │   ├── dashboard/       # Dashboard-specific components
│   │   │   └── RecommendationEngine.tsx
│   │   └── forms/           # Form components
│   │       └── FormLayout.tsx
│   │
│   ├── services/            # API services and external integrations
│   │   └── api.ts           # API configuration and helpers
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useAssessment.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── assessmentPayload.ts
│   │   └── userSessionManager.ts
│   │
│   ├── config/              # Configuration files
│   │   ├── api.ts
│   │   └── authService.ts
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── styles/              # Global styles
│   │   └── globals.css
│   │
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
│
├── public/                  # Static assets
│   └── favicon.ico
│
├── index.html               # HTML template
├── index.css                # Global styles
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Output will be in `dist/` folder, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## 🏗️ Component Organization

### Pages (Full Screen Views)
Located in `src/pages/`:
- `RiskAssessment.tsx` - Multi-step assessment form
- `Dashboard.tsx` - User health dashboard
- `HomePage.tsx` - Landing page
- etc.

### Common Components
Located in `src/components/common/`:
- Reusable UI components used across the app
- Examples: Input, Dropdown, Button, ErrorBoundary

### Assessment Components
Located in `src/components/assessment/`:
- Components specific to the assessment flow
- Example: RiskGauge.tsx

### Dashboard Components
Located in `src/components/dashboard/`:
- Components specific to the dashboard
- Example: RecommendationEngine.tsx

### Form Components
Located in `src/components/forms/`:
- Form-related components
- Example: FormLayout.tsx

## 🔌 API Integration

### API Configuration
File: `src/config/api.ts`

Configures:
- Base URL for backend
- Automatic detection of dev vs production
- Request timeout and retry logic
- Helper methods for GET, POST, PUT, DELETE

### Usage Example
```typescript
import { API_CONFIG, ApiService } from '../config/api';

// Using ApiService helper
const response = await ApiService.post('/api/assessment/submit', payload);

// Or direct fetch
const response = await fetch(`/api/assessment/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

## 🎨 Styling

### Tailwind CSS
This project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

### Global Styles
Global CSS is in `src/styles/globals.css` and `index.css`.

### Component Styles
Components use inline Tailwind classes and occasional `style={{}}` props.

## 📦 Dependencies

### Core
- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Routing
- `typescript` - Type safety

### UI & Animation
- `tailwindcss` - Utility-first CSS
- `framer-motion` - Animation library
- `lucide-react` - Icon library

### API & Data
- `firebase` - Cloud services
- `@google/generative-ai` - Gemini AI integration

### Build Tools
- `vite` - Fast build tool
- `@vitejs/plugin-react` - React plugin

## 🔐 Authentication

### Local Storage
- `caremend_user` - Current user object
- `caremend_token` - Auth token
- `assessmentData` - Cached assessment results

### Service
Located in `src/config/authService.ts`:
- User management
- Token handling
- Session persistence

## 📋 Types

TypeScript types are defined in `src/types/index.ts`:
- `HealthData` - Assessment data structure
- `AssessmentResult` - Backend prediction result
- `Doctor` - Healthcare provider
- etc.

## 🧪 Testing

Currently no test setup. To add:
1. `npm install --save-dev vitest @testing-library/react`
2. Create `tests/` folder with test files
3. Update `vite.config.ts` with test configuration

## 🚢 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variable: `VITE_API_URL`

### Other Platforms
Any static site hosting works (Netlify, GitHub Pages, etc.)

## 📱 Responsive Design

The app is fully responsive:
- Mobile: 320px and up
- Tablet: 768px and up
- Desktop: 1024px and up

Uses Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

## 🔗 Related Documentation

- **Backend:** See `../backend/README.md`
- **Deployment:** See `../RENDER_DEPLOYMENT.md`
- **API Docs:** See `../backend/routes/`

## 📚 Useful Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint

# Format code (if prettier configured)
npm run format
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/name`
5. Create Pull Request

## 📝 License

MIT

## 💬 Support

For issues or questions:
1. Check existing GitHub issues
2. Create new issue with details
3. Contact development team

---

**Current Version:** 1.0.0
**Last Updated:** October 2026
