# 🩺 AI Healthcare Assistant & Doctor Platform — Detailed Documentation (`detaildoctor.md`)

Welcome to the comprehensive technical and operational documentation for the **AI Healthcare Assistant & Ecosystem**. This document details the platform vision, architecture, user role credentials, complete end-to-end workflows, system process diagrams, monetization model, and data security standards.

---

## 🌐 1. Brand Definition & Core Vision

- **Platform Identity:** A digital healthcare ecosystem where AI acts as a personal doctor, guardian, and emergency response guide.
- **Core Promise:** *“Your health, your family, your lifetime — guided by AI.”*
- **Tone & Personality:** Trustworthy, empathetic, accessible, and highly intelligent.
- **Target Audience:**
  - **Patients & Individuals:** Seeking affordable, 24/7 evidence-based health guidance.
  - **Families:** Wanting centralized, lifetime health management for children, spouses, and elderly parents.
  - **Doctors & Medical Professionals:** Looking for digital reach, patient association, and automated follow-up care management.

---

## 🔐 2. Access Credentials & Service Ports

| Service / Role | Access URL | Email / Username | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `http://localhost:4000` | N/A | N/A | RESTful Express API with WHO integration |
| **Patient Portal** | `http://localhost:5175` | `patient@test.com` | `Patient123` | Patient & Family Health Portal |
| **Doctor Portal** | `http://localhost:5176` | `richard@prescripto.com` | `Doctor@123` | Associated Doctor Portal |
| **Super Admin** | `http://localhost:5176` | `admin@prescripto.com` | `Admin@123` | Super Admin Governance Dashboard |

> **Note:** Admin credentials are set in `backend/.env`. Default doctor can be seeded via `node createDoctor.js` in the `backend/` directory.

---

## 🏗️ 3. Platform Architecture & Data Flow

The platform uses a modular architecture combining Node.js Express endpoints, a dual persistence layer (MySQL with auto JSON file fallback), React/Vite frontends, and an integrated **AI Health Engine** linked to the **World Health Organization (WHO)** public data API and verified clinical knowledge base.

```mermaid
graph TD
    User([User / Patient]) -->|1. Register / Login| Auth[Authentication Middleware]
    Auth -->|2. Check Onboarding| OnboardCheck{Completed Intake?}
    
    OnboardCheck -->|No| AIJourney[AI Health Companion Intake Journey]
    OnboardCheck -->|Yes| MainPortal[Patient & Family Dashboard]
    
    AIJourney -->|Store Responses| LifetimeMemory[(Lifetime Health Memory DB)]
    MainPortal -->|Access| HealthFeatures[AI Chat, Symptom Checker, Reminders, Emergency]
    
    HealthFeatures -->|Query WHO & Clinical DB| AIEngine[AI Health Engine]
    AIEngine -->|Fetch Indicators| WHOApi[WHO Global Health Observatory API]
    AIEngine -->|Local Fallback| HealthKB[(healthKnowledgeBase.json)]
```

---

## 🔄 4. Process & Workflow Diagrams

### 4.1 Post-Login AI Health Journey & Onboarding Flow
Upon registration or login, the platform verifies whether the user has completed their AI intake. If incomplete, it automatically routes them to the dedicated **6-Step Onboarding Journey (`/onboarding`)**:

1. **Step 1 — Language & Script Mix Selection:** Select preferred language (English, Hinglish [Hindi+English], Marathiglish [Marathi+English], Hindi, Marathi, Spanish, French, German).
2. **Step 2 — Personal Details:** Age & Gender intake.
3. **Step 3 — Health History:** Lifetime medical history, past illnesses, and chronic conditions.
4. **Step 4 — Medications & Allergies:** Daily prescription drugs & known food/medicine allergies.
5. **Step 5 — Family Dashboard Setup:** Add family members (spouse, children, parents) step-by-step.
6. **Step 6 — Lifestyle & Goals:** Activity levels, sleep quality, and personal health goals.

Upon completing all steps, the system sets `hasCompletedOnboarding = true` and seamlessly transitions to the **AI Doctor Companion Chat interface (`/ai-assistant`)**.

### 🤖 Human-Like Conversational Intelligence Engine
- **Empathetic Doctor Friend Persona:** Replaces robotic disclaimers with warm, caring human conversation (e.g. *"Sunilijiye [Name], tension mat lijiye... Bilkul mat ghabraiye, main aapke saath hu!"*).
- **Code-Mixed Multilingual Understanding:** Automatically detects and responds in **Hinglish** (Hindi in English script), **Marathiglish** (Marathi in English script), native scripts, or English depending on how the user speaks.

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant App as Frontend (React)
    participant API as Express API
    participant AI as AI Health Engine
    participant DB as User Database

    Patient->>App: Submits Login / Register
    App->>API: POST /api/user/login
    API-->>App: JWT Token + User Data (hasCompletedOnboarding)
    alt Onboarding Incomplete
        App->>Patient: Redirects to /onboarding
        Patient->>App: Completes 6-Step Intake (Language, Age, History, Meds, Family, Goals)
        App->>API: POST /api/ai/onboard
        API->>AI: Process Intake & Save Language Preference
        AI->>DB: Save Health Profile & Set hasCompletedOnboarding = true
        API-->>App: Return Health Memory Summary
        App->>Patient: Seamless Transition to /ai-assistant with Warm Personal Greeting
    else Onboarding Complete
        App->>Patient: Direct Access to /ai-assistant Chat Interface
    end
```

---

### 4.2 AI Symptom Checker & WHO Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant UI as AI Companion UI
    participant API as AI Controller
    participant Engine as AI Health Engine
    participant KB as Clinical Knowledge Base

    Patient->>UI: Types query (e.g. "Severe chest pain and sweating")
    UI->>API: POST /api/ai/chat
    API->>Engine: Evaluate message & user age category
    Engine->>KB: Search Symptoms Matrix & First Aid Guides
    KB-->>Engine: Returns Match (Cardiopulmonary / Angina, Emergency rating)
    Engine-->>API: Returns Formatted Guidance + Specialist Rec (Cardiologist)
    API-->>UI: Displays AI Response with Urgency Level & Precaution
    UI->>Patient: Prompts to Book Specialist or Call Emergency SOS
```

---

### 4.3 Emergency Locator & First Aid Response Flow

```mermaid
flowchart TD
    Start([Patient Opens /emergency]) --> Geolocation{Browser GPS Enabled?}
    Geolocation -->|Yes| DetectGPS[Detect Latitude & Longitude]
    Geolocation -->|No / Denied| CityFallback[Use City Center Location]
    
    DetectGPS --> QueryHospitals[Query 24x7 Emergency Medical Units]
    CityFallback --> QueryHospitals
    
    QueryHospitals --> DisplayMap[Display Nearby Emergency Centers & Distances]
    DisplayMap --> Actions{Patient Action}
    
    Actions -->|Route Directions| GoogleMaps[Open Google Maps Navigation]
    Actions -->|Call Hospital| HospitalPhone[Direct Call to Emergency ER]
    Actions -->|One-Touch SOS| Call108[Call SOS Hotline 108 / 112]
    Actions -->|First Aid Steps| ViewGuide[Interactive Steps for CPR, Burns, Choking]
```

---

### 4.4 Family Dashboard & Shared Medical Records

```mermaid
flowchart LR
    PrimaryUser[Primary Account Holder] -->|Add Sub-profile| FamilyManager[Family Dashboard]
    FamilyManager --> Member1[Spouse Record]
    FamilyManager --> Member2[Child Record]
    FamilyManager --> Member3[Elderly Parent Record]
    
    Member1 --> SharedRecords[(Centralized Medical History)]
    Member2 --> SharedRecords
    Member3 --> SharedRecords
    
    SharedRecords --> Reminders[Shared Medication & Follow-up Reminders]
    SharedRecords --> EmergencyCard[One-Click Emergency Share Card]
```

---

## 💰 5. Monetization & Subscription Framework

| Plan Type | Price | Target Audience | Included Features |
| :--- | :--- | :--- | :--- |
| **Patient & Family Pass** | **₹100 / month** *(7-Day Free Trial)* | Individuals & Families | Lifetime AI Companion, Health Memory, Family Sub-accounts, Emergency Locator, First Aid Module, Reminders |
| **Doctor Association** | **₹300 / month** | Healthcare Professionals | Associated Patient Consultation, Digital Prescriptions, Clinical Records, Patient Follow-up Dispatcher |

### Revenue Streams:
1. **Recurring Subscriptions:** Monthly Patient (₹100) & Doctor (₹300) passes.
2. **Insurance Tie-Ins & Analytics:** Anonymized population health analytics & preventive care partnerships.
3. **Emergency Service Partnerships:** Priority ambulance dispatch integration.

---

## 🔐 6. Data Security, Privacy & HIPAA/GDPR Compliance

1. **Encrypted Record Storage:** User medical histories and health profiles are stored with strict data isolation.
2. **Access Control:** Patients maintain total ownership over who can access or view their records.
3. **One-Click Emergency Sharing:** Generates encrypted short-lived sharing tokens (`EMG-XXXXX`) allowing first responders or attending ER doctors to view critical medical flags (blood type, severe allergies, chronic conditions, emergency contacts) instantly during emergencies.

---

## 🚀 7. Phased Expansion Roadmap

- **Phase 0 (MVP - Currently Live):** Subscriptions system, multi-role governance (Super Admin, Doctor, Patient, Family), AI Health Intake Journey, Geolocation Emergency Locator, First Aid module, WHO Knowledge Base.
- **Phase 1 (Expansion):** Enhanced Doctor association workflows, digital consultation notes, automated SMS/WhatsApp reminders.
- **Phase 2 (Advanced AI & Wearables):** Wearable device integration (heart rate, glucose, BP monitors), predictive disease risk analytics, preventive health suggestions.
