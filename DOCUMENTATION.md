# YourAiDoctor Enterprise Platform Documentation

Welcome to the enterprise platform documentation for **YourAiDoctor** - a production-ready AI Medical Companion and clinical triage platform.

---

## 1. System Architecture Overview

YourAiDoctor features a decoupled, modular architecture designed for high availability, zero-latency caching, prompt safety, and structured clinical intelligence.

```text
[ React 18 Frontend ] ──(HTTPS/REST)──► [ Security & Rate Guard ]
                                                  │
                                                  ▼
                                       [ Express API v1 Router ]
                                                  │
                                                  ▼
                                     [ Conversation Director ]
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
       [ Intent Engine ]              [ Context & Memory Engine ]        [ Safety & Red Flag Guard ]
                │                                 │                                 │
                └─────────────────────────────────┼─────────────────────────────────┘
                                                  ▼
                                     [ Clinical Intelligence ]
                             (Normalization -> Entity Extraction -> RAG
                             -> Symptom Synergy -> Differential Reasoning
                                     -> 5-Tier Urgency Triage)
                                                  │
                                                  ▼
                                     [ Gemini API / LLM Engine ]
                                                  │
                                                  ▼
                                     [ Response Quality Engine ]
                                                  │
                                                  ▼
                                      [ Observability & Telemetry ]
```

---

## 2. Directory Structure

```text
prescripto_full-stack_doctor_appointment_app/
├── backend/
│   ├── config/              # DB & Cloudinary Configuration
│   ├── controllers/         # Express API controllers
│   ├── middleware/          # Security, Auth, and Rate guards
│   │   ├── authUser.js
│   │   └── securityMiddleware.js  # Prompt Injection & XSS Defense
│   ├── models/              # User, Doctor, Appointment schemas
│   ├── routes/              # Express API routers
│   │   ├── aiRoute.js       # Legacy AI endpoints
│   │   └── v1Router.js      # Enterprise API v1 endpoints
│   ├── services/
│   │   └── ai/              # AI Core Engine Subsystems
│   │       ├── CacheService.js
│   │       ├── ClinicalCorrelationEngine.js
│   │       ├── ContextEngine.js
│   │       ├── ConversationDirector.js
│   │       ├── DatasetRetrieval.js
│   │       ├── DifferentialReasoningEngine.js
│   │       ├── EntityExtractionEngine.js
│   │       ├── ExplanationEngine.js
│   │       ├── FeedbackEngine.js
│   │       ├── GeminiService.js
│   │       ├── IntentEngine.js
│   │       ├── Logger.js
│   │       ├── MedicalReasoning.js
│   │       ├── MedicationIntelligenceEngine.js
│   │       ├── MemoryEngine.js
│   │       ├── NormalizationEngine.js
│   │       ├── Observability.js
│   │       ├── PromptBuilder.js
│   │       ├── QualityEngine.js
│   │       ├── QuestionPlanner.js
│   │       ├── ReportGenerator.js
│   │       ├── SafetyEngine.js
│   │       ├── SessionManager.js
│   │       └── ValidationEngine.js
│   ├── Dockerfile
│   └── server.js
├── frontend/                # React Vite Frontend SPA
└── docker-compose.yml       # Production Container Orchestration
```

---

## 3. Environment Variables Configuration

Place `.env` file in `backend/`:

```env
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/youraidoctor
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
HF_TOKEN=optional_huggingface_backup_token
LOG_LEVEL=INFO
```

---

## 4. API Reference

### Health & Telemetry
- `GET /api/v1/health`
  - Returns system uptime, database status, Gemini API health, cache hit rates, and latency averages.
- `GET /api/v1/metrics`
  - Returns telemetry metrics snapshot.

### AI Companion & Chat
- `POST /api/v1/chat`
  - Headers: `token: <JWT_TOKEN>`
  - Body: `{ "message": "I have a headache", "language": "English", "sessionId": "session-default" }`
  - Response: `{ "success": true, "response": { "reply": "...", "riskBadge": "🟢 Low Risk" }, "chatHistory": [...] }`

### Medical Assessment Reports
- `POST /api/v1/generate-report`
  - Headers: `token: <JWT_TOKEN>`
  - Response: Structured medical report generated directly from Structured Health Memory.

### User Feedback & Rating
- `POST /api/v1/feedback`
  - Headers: `token: <JWT_TOKEN>`
  - Body: `{ "messageId": "msg-123", "rating": "Helpful", "comments": "Very clear guidance" }`

---

## 5. Deployment & Containerization Guide

### Run with Docker Compose
```bash
docker-compose up --build -d
```

### Manual Deployment
```bash
cd prescripto_full-stack_doctor_appointment_app/backend
npm install
npm start
```

---

## 6. Future Expansion Interfaces

Designed with clean dependency injection interfaces for future capabilities:
- **Voice AI Conversations**: Pluggable WebRTC/Speech-to-Text streaming handlers.
- **Medical Image Analysis**: Pre-configured hooks for diagnostic skin/lab report scanning via Gemini Vision.
- **Wearable Integration**: Sync interfaces for Apple HealthKit, Google Fit, Fitbit, and Garmin.
- **Multi-Device & MFA**: Auth middleware ready for TOTP multi-factor authentication.
