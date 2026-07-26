# 🚀 Installation, Directory Map & Deployment Guide: YourAiDoctor

This guide lists the complete folder structure of **YourAiDoctor**, identifies exactly **what files to upload**, and provides instructions for deploying to **free hosting** and **Hostinger (production VPS/cPanel)**.

---

## 📂 Complete Project Directory Map
Here is the structural map of the entire workspace. Read the indicators to see what gets uploaded to your live server.

```text
dr.appointmentai/                       [ROOT DIRECTORY]
│
└── 🟡 prescripto_full-stack_doctor_appointment_app/ [MAIN APP WORKSPACE]
    │
    ├── 🟢 backend/                      [UPLOAD TO NODE.JS SERVER ROOT]
    │   ├── 🟢 config/                   # Database connectors (MongoDB, Cloudinary, etc.)
    │   ├── 🟢 controllers/              # Request controllers (Doctor, User, AI diagnostics)
    │   ├── 🟢 data/                     # Data folder containing AI databases [CRITICAL]
    │   │   ├── healthKnowledgeBase.json # First-aid guidelines
    │   │   ├── medical_dataset.json     # Basic diagnostic Q&A cache
    │   │   └── full_medical_dataset.jsonl # Complete 3,100 clinical dialog dialogue database
    │   │
    │   ├── 🟢 middleware/               # Auth systems & upload configurations
    │   ├── 🟢 models/                   # Schema blueprints
    │   ├── 🟢 routes/                   # API entry points (User, AI triage, Doctor)
    │   ├── 🟢 services/                 # AI Diagnostic reasoning engine (aiHealthEngine.js)
    │   ├── 🟢 server.js                 # Primary backend entry-point file
    │   ├── 🟢 package.json              # Dependency declarations (express, node-fetch, etc.)
    │   ├── 🟢 .env                      # [CRITICAL] Core API secrets & DB endpoints
    │   └── 🔴 node_modules/             # Local packages (DO NOT UPLOAD - runs npm install on server)
    │
    ├── 🟡 frontend/                     [BUILD LOCALLY, UPLOAD /dist]
    │   ├── src/                         # Patient UI components & pages (AiAssistant, Vitals)
    │   ├── .env                         # API routing connection variables
    │   └── 🟢 dist/                     # [UPLOAD] Built static web app files (HTML, CSS, JS)
    │
    └── 🟡 admin/                        [BUILD LOCALLY, UPLOAD /dist]
        ├── src/                         # Admin dashboard & Doctor scheduling UI
        ├── .env                         # API routing connection variables
        └── 🟢 dist/                     # [UPLOAD] Built static web app files (HTML, CSS, JS)
```

---

## 📤 Production Upload Checklist
Refer to this table before using Hostinger File Manager or SSH/FTP:

| Path in Workspace | Destination | Action | Status |
| :--- | :--- | :--- | :--- |
| `backend/` | Node.js Server Directory | Upload entire contents (except `node_modules`). Includes the `full_medical_dataset.jsonl` file inside the `data` folder. | 🟢 **UPLOAD** |
| `frontend/dist/` | Main Domain `public_html` | Run `npm run build` locally, then upload files. | 🟡 **BUILD & UPLOAD** |
| `admin/dist/` | Sub-domain `public_html` | Run `npm run build` locally, then upload files. | 🟡 **BUILD & UPLOAD** |
| `backend/node_modules/` | -- | Do not upload. Server will run `npm install`. | 🔴 **EXCLUDE** |

---

## ⚙️ Config Variables Map (`.env`)

You only need to edit **one configuration file** inside your backend to transition your entire database and AI system online.

### 🔌 File 1: [`backend/.env`](file:///c:/Users/kishan%20shinde/Desktop/dr.appointmentai/prescripto_full-stack_doctor_appointment_app/backend/.env)
```env
# Database Settings - MySQL
DB_HOST=localhost            # Hostinger Database Host (usually localhost)
DB_USER=u1234567_doctor      # Hostinger MySQL Database Username
DB_PASSWORD=your_password    # Hostinger MySQL Database Password
DB_NAME=u1234567_youraidoctor# Hostinger MySQL Database Name
DB_PORT=3306

# AI Keys
GEMINI_API_KEY=AIzaSy...     # Google Gemini API key
HF_TOKEN=hf_...              # HuggingFace API key

# Payment Gateway
RAZORPAY_KEY_ID=rzp_test_... # Razorpay API key ID
RAZORPAY_KEY_SECRET=...      # Razorpay Secret Key

# Email Config
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=app_password       # Gmail app passcode
```
*💡 Hint: If you leave `DB_HOST`, `DB_USER`, `DB_PASSWORD` blank, the backend will bypass MySQL automatically and use local JSON file storage!*

---

## 🆓 Option A: Deploying Live Using Free Tools (Render / Vercel / Railway)

You can host the entire system permanently for free or low-cost using these platforms:

### 🌐 Method 1: Railway.app Deployment (Recommended - Easiest Setup)
Railway allows you to deploy **both your Database and Backend Server inside the same dashboard project**.

#### 1. Create a MySQL Database on Railway:
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** > **Provision MySQL**.
3. Railway will instantly spin up a live MySQL server. Under the **Variables** tab, you will find:
   - `MYSQLHOST` (Host)
   - `MYSQLUSER` (Username)
   - `MYSQLPASSWORD` (Password)
   - `MYSQLPORT` (Port: usually 3306)
   - `MYSQLDATABASE` (DB Name)
4. Copy these values and paste them into your [`backend/.env`](file:///c:/Users/kishan%20shinde/Desktop/dr.appointmentai/prescripto_full-stack_doctor_appointment_app/backend/.env) file.

#### 2. Deploy your Node.js Backend Server on Railway:
1. Commit your codebase to a **GitHub repository**.
2. Inside your Railway project dashboard, click **+ New** > **GitHub Repo**.
3. Import your repository.
4. Click on the newly added service card and go to **Settings**:
   - **Root Directory**: Set to `prescripto_full-stack_doctor_appointment_app/backend`
   - **Build Command**: Set to `npm install`
   - **Start Command**: Set to `node server.js`
5. Go to the **Variables** tab, click **Raw Editor**, and paste the contents of your `backend/.env` file.
6. Railway will automatically build and deploy. Under **Settings > Domains**, click **Generate Domain** to get a live backend API URL (e.g. `https://youraidoctor-api.up.railway.app`).

#### 3. Deploy Frontend on Vercel:
1. Open [`frontend/.env`](file:///c:/Users/kishan%20shinde/Desktop/dr.appointmentai/prescripto_full-stack_doctor_appointment_app/frontend/.env) and [`admin/.env`](file:///c:/Users/kishan%20shinde/Desktop/dr.appointmentai/prescripto_full-stack_doctor_appointment_app/admin/.env).
2. Set `VITE_BACKEND_URL` to your Railway API URL:
   `VITE_BACKEND_URL="https://youraidoctor-api.up.railway.app"`
3. Deploy on Vercel using the steps listed below.

---

### 🌐 Method 2: Render & Aiven Deployment (Alternative)

#### Step 1: Deploy Database (Aiven MySQL)
1. Sign up on [Aiven.io](https://aiven.io/).
2. Create a free MySQL database service.
3. Once active, copy the Service URI variables: Host, Port, User, Password, DB Name.
4. Input these details into your [`backend/.env`](file:///c:/Users/kishan%20shinde/Desktop/dr.appointmentai/prescripto_full-stack_doctor_appointment_app/backend/.env).

#### Step 2: Deploy Backend Node.js API (Render)
1. Commit your codebase to a **GitHub repository**.
2. Create a free account on [Render.com](https://render.com/).
3. Connect your GitHub account and create a **Web Service**.
4. Set the configurations:
   - **Root Directory**: `prescripto_full-stack_doctor_appointment_app/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add the keys and values from your `backend/.env`.
6. Copy the Render API URL (e.g. `https://youraidoctor-api.onrender.com`).

---

### 📦 Step 3: Connect and Deploy Frontend Web Apps (Vercel)
1. Log in to [Vercel.com](https://vercel.com/) and link your repository.
2. Deploy the Patient portal:
   - **Root Directory**: `prescripto_full-stack_doctor_appointment_app/frontend`
   - Framework: **Vite**
   - Click **Deploy**.
3. Deploy the Admin dashboard:
   - **Root Directory**: `prescripto_full-stack_doctor_appointment_app/admin`
   - Framework: **Vite**
   - Click **Deploy**.

---

## 💼 Option B: Deploying Live on Hostinger (cPanel / VPS)

### Step 1: Create the Database
1. Log in to **Hostinger hPanel**.
2. Navigate to **Databases > MySQL Databases**.
3. Create a database name, user, and password. Record them and enter them into your `backend/.env`.

### Step 2: Set Up Node.js Application
1. Go to **Advanced > Node.js** in Hostinger hPanel.
2. Click **Create Application**.
3. Set Application Directory (e.g., `/youraidoctor-api`).
4. Set Startup File to `/backend/server.js`.
5. Upload the `backend` files and the `full_dataset` folder using Hostinger File Manager or FTP.
6. Install dependencies by running **npm install** using hPanel console terminal.
7. Click **Start App**.

### Step 3: Build & Upload Client Sites
1. Run static builds on your local computer terminal:
   ```bash
   # Build Patient Client
   cd frontend
   npm run build

   # Build Admin Dashboard
   cd ../admin
   npm run build
   ```
2. Upload the files inside `frontend/dist/` into your domain's `public_html` directory via File Manager.
3. Upload the files inside `admin/dist/` into your subdomain's directory.
4. Verify both pages reload cleanly!

---

## 🐙 Step-by-Step GitHub Upload Guide

Follow these terminal commands inside the root workspace folder (`dr.appointmentai/`) to commit and push your project to GitHub:

### Step 1: Initialize Git & Stage Files
*(A `.gitignore` file has already been created in your root directory to automatically exclude large node modules and secret `.env` credentials).*
```bash
# 1. Initialize local Git repository (Already completed!)
git init

# 2. Stage all project files (ignoring heavy node_modules)
git add .

# 3. Create your initial commit
git commit -m "First Commit: Upgraded YourAiDoctor Fullstack App"
```

### Step 2: Push to GitHub
1. Go to your web browser and log in to [GitHub.com](https://github.com/).
2. Click **New** repository.
3. Name your repository (e.g. `youraidoctor`) and click **Create Repository** (do NOT check "Add a README").
4. Copy the two terminal commands shown under *"…or push an existing repository from the command line"*:
```bash
# 4. Rename primary branch to main
git branch -M main

# 5. Link local repository to your remote GitHub URL
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/youraidoctor.git

# 6. Push local commits up to GitHub
git push -u origin main
```
5. Your repository is now fully uploaded! You can link this repository directly to Vercel and Render for free hosting deployment.

