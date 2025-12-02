# FarmIQ Farmer - Complete Tech Stack

## Overview

FarmIQ Farmer is a comprehensive agricultural technology platform built with modern web technologies, featuring AI-powered crop disease detection, weather forecasting, market price tracking, IoT sensor integration, and multi-role authentication.

---

## Frontend Technologies

### Core Framework & Language
- **React** `^18.3.1` - UI library
- **TypeScript** `^5.8.3` - Type-safe JavaScript
- **React DOM** `^18.3.1` - React rendering

### Build Tools & Bundler
- **Vite** `^5.4.19` - Fast build tool and dev server
- **@vitejs/plugin-react-swc** `^3.11.0` - React plugin with SWC compiler for faster builds
- **PostCSS** `^8.5.6` - CSS processing
- **Autoprefixer** `^10.4.21` - CSS vendor prefixing

### Routing & State Management
- **React Router DOM** `^6.30.1` - Client-side routing
- **TanStack React Query** `^5.83.0` - Server state management and data fetching
- **React Context API** - Global state management (AuthContext)

### UI Framework & Styling
- **Tailwind CSS** `^3.4.17` - Utility-first CSS framework
- **Tailwind CSS Animate** `^1.0.7` - Animation utilities
- **@tailwindcss/typography** `^0.5.16` - Typography plugin
- **shadcn/ui** - Component library built on Radix UI
- **CSS Variables** - Custom theming system with HSL color variables

### UI Component Libraries
- **Radix UI** - Headless, accessible component primitives:
  - `@radix-ui/react-accordion` `^1.2.11`
  - `@radix-ui/react-alert-dialog` `^1.1.14`
  - `@radix-ui/react-aspect-ratio` `^1.1.7`
  - `@radix-ui/react-avatar` `^1.1.10`
  - `@radix-ui/react-checkbox` `^1.3.2`
  - `@radix-ui/react-collapsible` `^1.1.11`
  - `@radix-ui/react-context-menu` `^2.2.15`
  - `@radix-ui/react-dialog` `^1.1.14`
  - `@radix-ui/react-dropdown-menu` `^2.1.15`
  - `@radix-ui/react-hover-card` `^1.1.14`
  - `@radix-ui/react-label` `^2.1.7`
  - `@radix-ui/react-menubar` `^1.1.15`
  - `@radix-ui/react-navigation-menu` `^1.2.13`
  - `@radix-ui/react-popover` `^1.1.14`
  - `@radix-ui/react-progress` `^1.1.7`
  - `@radix-ui/react-radio-group` `^1.3.7`
  - `@radix-ui/react-scroll-area` `^1.2.9`
  - `@radix-ui/react-select` `^2.2.5`
  - `@radix-ui/react-separator` `^1.1.7`
  - `@radix-ui/react-slider` `^1.3.5`
  - `@radix-ui/react-slot` `^1.2.3`
  - `@radix-ui/react-switch` `^1.2.5`
  - `@radix-ui/react-tabs` `^1.1.12`
  - `@radix-ui/react-toast` `^1.2.14`
  - `@radix-ui/react-toggle` `^1.1.9`
  - `@radix-ui/react-toggle-group` `^1.1.10`
  - `@radix-ui/react-tooltip` `^1.2.7`

### Form Management & Validation
- **React Hook Form** `^7.61.1` - Form state management
- **@hookform/resolvers** `^3.10.0` - Validation resolvers
- **Zod** `^3.25.76` - Schema validation

### Data Visualization
- **Recharts** `^2.15.4` - Charting library for React

### Utilities & Helpers
- **clsx** `^2.1.1` - Conditional class names
- **tailwind-merge** `^2.6.0` - Merge Tailwind classes
- **class-variance-authority** `^0.7.1` - Component variant management
- **date-fns** `^3.6.0` - Date utility library
- **lucide-react** `^0.462.0` - Icon library
- **cmdk** `^1.1.1` - Command menu component
- **input-otp** `^1.4.2` - OTP input component
- **sonner** `^1.7.4` - Toast notifications
- **vaul** `^0.9.9` - Drawer component
- **react-day-picker** `^8.10.1` - Date picker
- **react-resizable-panels** `^2.1.9` - Resizable panel layouts
- **embla-carousel-react** `^8.6.0` - Carousel component
- **next-themes** `^0.3.0` - Theme management

### Development Tools
- **Lovable Tagger** `^1.1.9` - Component tagging for development

---

## Backend Technologies

### Node.js Backend (Authentication & Main API)
- **Node.js** - JavaScript runtime
- **Express** `^4.18.2` - Web framework
- **express-session** `^1.17.3` - Session management
- **CORS** `^2.8.5` - Cross-Origin Resource Sharing
- **bcryptjs** `^2.4.3` - Password hashing
- **SQLite3** `^5.1.6` - Database

### Python Backend (ML Inference Server)
- **FastAPI** `^0.115.0` - Modern Python web framework for building APIs
- **Uvicorn** `^0.32.0` - ASGI server for running FastAPI applications
- **python-multipart** `^0.0.12` - Form data parsing

### Machine Learning & AI
- **TensorFlow** `^2.16.1` - Deep learning framework
- **Keras** - High-level neural networks API (included with TensorFlow)
- **NumPy** `^1.26.4` - Numerical computing library
- **PIL (Pillow)** `^10.4.0` - Image processing library

### Python Standard Libraries
- `io` - Input/output operations
- `logging` - Logging framework
- `os` - Operating system interface

### Model Format
- **Keras Model** (`.keras`) - Saved model format for plant disease recognition
  - Model file: `plant_disease_recog_model_pwp.keras`
  - Input size: 160x160 pixels
  - Output: 38 disease classes

---

## Database

### SQLite Database
- **SQLite3** - Lightweight, file-based database
- **Database file**: `server/farmiQ.db`
- **Tables**:
  - `users` - User authentication and profile data
    - Fields: id, role, name, phone, aadhar, username, password_hash, created_at
    - Unique constraint on (role, username)

---

## External Services & APIs

### Translation Services
- **Google Translate API** - Multi-language support (English, Hindi, Punjabi)
  - Integrated via Google Translate Element script
  - Supports dynamic language switching

### Mock Services (Development)
- **Mock TTS API** - Text-to-speech functionality for development
- **Mock Weather Service** - Weather forecast data simulation
- **Mock Market Prices Service** - Agricultural market price data simulation
- **Mock IoT Service** - IoT sensor data simulation

### Browser APIs
- **Geolocation API** - Location-based services
- **LocalStorage API** - Client-side data caching
- **SessionStorage API** - Session-based storage

---

## Development Tools & Configuration

### Linting & Code Quality
- **ESLint** `^9.32.0` - JavaScript/TypeScript linter
- **@eslint/js** `^9.32.0` - ESLint JavaScript configuration
- **typescript-eslint** `^8.38.0` - TypeScript ESLint plugin
- **eslint-plugin-react-hooks** `^5.2.0` - React Hooks linting rules
- **eslint-plugin-react-refresh** `^0.4.20` - React Refresh linting
- **globals** `^15.15.0` - Global variables configuration

### Type Definitions
- **@types/node** `^22.16.5` - Node.js type definitions
- **@types/react** `^18.3.23` - React type definitions
- **@types/react-dom** `^18.3.7` - React DOM type definitions

### Package Management
- **npm** / **package-lock.json** - Node package manager
- **bun** / **bun.lockb** - Alternative package manager (optional)
- **pip** - Python package installer
- **requirements.txt** - Python dependencies

### Python Environment
- **Python Virtual Environment** (`venv/`) - Isolated Python environment

---

## Configuration Files

### Frontend Configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript compiler configuration
- `tsconfig.app.json` - Application-specific TypeScript config
- `tsconfig.node.json` - Node.js TypeScript config
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration
- `components.json` - shadcn/ui component configuration
- `.env` / `env.example` - Environment variables

### Backend Configuration
- `server/server.js` - Express server configuration
- `server/auth.js` - Authentication helpers
- `server/database.js` - Database initialization and helpers
- `server/package.json` - Node.js dependencies
- `inference_server.py` - FastAPI ML inference server
- `requirements.txt` - Python dependencies

---

## Project Structure

```
FarmIQ-login/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── farmiq/         # FarmIQ-specific components
│   │   ├── weather/        # Weather-related components
│   │   ├── iot/            # IoT sensor components
│   │   └── market/         # Market price components
│   ├── pages/              # Route pages
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── FarmIQ.tsx      # Farmer dashboard
│   │   ├── CropDiseaseDetection.tsx
│   │   ├── Weather.tsx
│   │   ├── MarketPrices.tsx
│   │   ├── IoTSensor.tsx
│   │   └── ...
│   ├── services/           # API service layers
│   │   ├── authService.ts
│   │   ├── predictionService.ts
│   │   ├── weatherService.ts
│   │   ├── marketPricesService.ts
│   │   └── iotService.ts
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── use-toast.ts
│   │   └── useLanguage.ts
│   ├── lib/               # Utility libraries
│   │   ├── utils.ts
│   │   ├── googleTranslate.ts
│   │   └── translations.ts
│   ├── types/             # TypeScript type definitions
│   │   └── weather.ts
│   └── utils/             # Helper utilities
│       ├── predictionUtils.ts
│       └── mockTTSApi.ts
├── server/                # Node.js backend
│   ├── server.js         # Express server
│   ├── auth.js           # Authentication logic
│   ├── database.js       # SQLite database
│   ├── farmiQ.db        # Database file
│   └── package.json
├── public/               # Static assets
├── inference_server.py   # FastAPI ML inference server
├── plant_disease_recog_model_pwp.keras  # ML model
├── requirements.txt      # Python dependencies
└── package.json         # Frontend dependencies
```

---

## Features & Capabilities

### Core Features
1. **Multi-Role Authentication** - Farmer, Vendor, Admin roles with session-based auth
2. **Crop Disease Detection** - AI-powered image classification using TensorFlow/Keras
3. **Weather Forecasting** - Daily and hourly weather predictions with alerts
4. **Market Price Tracking** - Agricultural commodity price monitoring with filtering
5. **Soil Analysis** - Soil health assessment tools
6. **Yield Prediction** - Crop yield forecasting
7. **IoT Sensor Integration** - Real-time sensor data monitoring and technician allocation
8. **NGO Schemes** - Government scheme information
9. **Teaching Resources** - Educational content for farmers
10. **QR Code Generation** - QR code creation for farm products
11. **Multi-language Support** - English, Hindi, Punjabi translation
12. **Profile Management** - User profile viewing and editing

### UI/UX Features
- Responsive design with mobile support
- Dark mode support (via next-themes)
- Toast notifications (Sonner)
- Dialog modals and alerts
- Form validation with React Hook Form + Zod
- Data tables with sorting and pagination
- Charts and data visualization (Recharts)
- Carousel components
- Command palette (cmdk)
- Sidebar navigation
- Tooltips and hover cards
- Text-to-speech accessibility features
- Error boundaries for error handling

---

## Development Scripts

### Frontend (npm)
```json
{
  "dev": "vite",                    // Start development server (port 5173)
  "build": "vite build",            // Production build
  "build:dev": "vite build --mode development",  // Development build
  "lint": "eslint .",               // Run linter
  "preview": "vite preview",        // Preview production build
  "start": "vite preview --port 3000 --host"  // Start preview server
}
```

### Backend (Node.js)
```json
{
  "start": "node server.js",       // Start Express server
  "dev": "nodemon server.js"       // Start with auto-reload
}
```

### Backend (Python)
```bash
# Start ML inference server
uvicorn inference_server:app --host 0.0.0.0 --port 8000 --reload
```

---

## Server Configuration

### Frontend Development Server
- **Port**: `5173` (Vite default) or `8080` (custom)
- **Host**: `localhost`
- **Hot Module Replacement**: Enabled

### Node.js Backend Server
- **Port**: `3001` (default) or `process.env.PORT`
- **Host**: `0.0.0.0` (all interfaces)
- **CORS**: Enabled for:
  - `http://localhost:5173` (Vite default)
  - `http://localhost:8080` (custom port)
  - `http://localhost:3000` (alternative)
- **Session**: Express-session with 24-hour expiry
- **Database**: SQLite (`server/farmiQ.db`)

### Python ML Inference Server
- **Port**: `8000`
- **Host**: `0.0.0.0` (all interfaces)
- **CORS**: Enabled for:
  - `http://localhost:5173`
  - `http://localhost:3000`
  - `http://localhost:8080`
- **Model**: `plant_disease_recog_model_pwp.keras`
- **Input Size**: 160x160 pixels
- **Output**: 38 disease classes

---

## API Endpoints

### Node.js Backend (`http://localhost:3001/api`)

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user/:id` - Get user details

#### Health & Testing
- `GET /api/health` - Health check
- `GET /api/test` - Test endpoint

#### IoT Sensor Management
- `GET /api/iot/status` - Get installation status
- `POST /api/iot/request` - Create installation request
- `POST /api/iot/reschedule` - Reschedule appointment
- `POST /api/iot/cancel` - Cancel request
- `GET /api/iot/readings` - Get sensor readings
- `GET /api/iot/alerts` - Get farm alerts

### Python ML Inference Server (`http://localhost:8000`)

#### Prediction
- `POST /predict` - Crop disease prediction from image
  - Request: `multipart/form-data` with `file` field
  - Response: `{"class_name": "...", "confidence": 0.0}`

#### Health
- `GET /health` - Server health and model information
  - Response: Model status, input/output shapes, class count

---

## Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
VITE_PREDICTION_API_URL=http://localhost:8000
```

### Backend (Node.js)
```env
PORT=3001
NODE_ENV=development
```

### Backend (Python)
No environment variables required (uses defaults)

---

## Browser Support
- Modern browsers with ES6+ support
- Geolocation API support for location features
- LocalStorage support for caching
- Fetch API support for HTTP requests

---

## Model Information

### Plant Disease Recognition Model
- **Model Type**: Keras/TensorFlow
- **File**: `plant_disease_recog_model_pwp.keras`
- **Input Size**: 160x160 pixels (RGB)
- **Input Shape**: `(None, 160, 160, 3)`
- **Output Shape**: `(None, 38)`
- **Classes**: 38 plant disease categories
- **Preprocessing**:
  - Resize to 160x160
  - Convert to RGB
  - Normalize to [0, 1] range (divide by 255.0)
- **Prediction**: Returns class name and confidence score

### Supported Disease Classes
- Apple diseases (scab, black rot, cedar apple rust, healthy)
- Corn diseases (gray leaf spot, common rust, northern leaf blight, healthy)
- Grape diseases (black rot, esca, leaf blight, healthy)
- Tomato diseases (bacterial spot, early blight, late blight, leaf mold, septoria, spider mites, target spot, yellow leaf curl virus, mosaic virus, healthy)
- And more (38 total classes)

---

## Security & Performance

### Security Features
- Password hashing with bcryptjs (10 salt rounds)
- Session-based authentication
- CORS middleware for API security
- Role-based access control (RBAC)
- Input validation with Zod schemas
- SQL injection protection (parameterized queries)
- XSS protection (React's built-in escaping)
- Image validation on upload
- File size limits (5MB for images)

### Performance Optimizations
- Vite for fast builds and HMR
- Code splitting and lazy loading
- Client-side caching (LocalStorage)
- React Query for efficient data fetching
- Optimized image preprocessing
- Model prediction with verbose=0 for faster inference
- Error boundaries for graceful error handling

---

## Deployment

### Frontend
- Build: `npm run build`
- Output: `dist/` directory
- Static hosting compatible (Vercel, Netlify, etc.)

### Node.js Backend
- Process manager: PM2 or similar
- Database: SQLite file (ensure write permissions)
- Environment: Set `NODE_ENV=production`

### Python ML Inference Server
- Production: Use Gunicorn with Uvicorn workers
- Command: `gunicorn inference_server:app -w 4 -k uvicorn.workers.UvicornWorker`
- Memory: Minimum 2GB RAM (model is ~200MB)
- Consider: Model quantization for production

---

## Testing

### Manual Testing
- Health checks: `curl http://localhost:3001/api/health`
- Prediction test: `curl -F "file=@image.jpg" http://localhost:8000/predict`
- Model test: `python test_model_directly.py`

### Test Scripts
- `check_backend.js` - Verify Node.js server is running
- `test_model_directly.py` - Test ML model directly
- `test_inference.sh` / `test_inference.bat` - Test inference API

---

## Future Integrations (Planned)
- Real weather API integration (OpenWeatherMap, WeatherAPI)
- Real market prices API integration (Government APIs)
- Real IoT sensor data integration (MQTT, WebSocket)
- PostgreSQL/MySQL for production database
- Redis for session storage and caching
- Docker containerization
- CI/CD pipeline
- Payment gateway integration
- SMS/Email notifications
- Push notifications
- Real-time chat support

---

## Documentation Files
- `README.md` - Main project documentation
- `TECH_STACK.md` - This file (complete tech stack)
- `INFERENCE_SERVER_README.md` - ML inference server setup
- `IMPLEMENTATION_CHECKLIST.md` - Implementation and testing checklist
- `TROUBLESHOOTING_LOGIN.md` - Login issues troubleshooting
- `AUTH_README.md` - Authentication flow documentation
- `deployment-guide.md` - Deployment instructions

---

*Last Updated: Based on current codebase analysis*
*Project Version: 0.0.0*
*Maintained by: FarmIQ Development Team*

