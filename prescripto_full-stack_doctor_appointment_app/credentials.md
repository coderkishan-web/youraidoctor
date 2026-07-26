# 🔐 Prescripto — Credentials & Account Management

## Quick Start Logins

### 👑 Admin Panel
| Field    | Value                    |
|----------|--------------------------|
| URL      | http://localhost:5176    |
| Email    | `admin@prescripto.com`   |
| Password | `Admin@123`              |

> The admin account is **not stored in the database** — it is defined directly in `backend/.env`:
> ```
> ADMIN_EMAIL=admin@prescripto.com
> ADMIN_PASSWORD=Admin@123
> ```
> To change the admin credentials, edit those two lines in `.env` and restart the server.

---

### 🩺 Default Doctor (created via script)
| Field       | Value                       |
|-------------|-----------------------------|
| URL         | http://localhost:5176       |
| Email       | `richard@prescripto.com`    |
| Password    | `Doctor@123`                |
| Speciality  | General Physician           |
| Fee         | $50                         |

> Run `node createDoctor.js` from the `backend/` folder to seed this doctor.  
> See [How to Add a Doctor](#-how-to-add-a-doctor) below.

---

### 🧑 Test Patient (registered via frontend)
| Field    | Value                  |
|----------|------------------------|
| URL      | http://localhost:5175  |
| Email    | `patient@test.com`     |
| Password | `Patient123`           |

---

## 🌐 Application URLs

| Service        | URL                      |
|----------------|--------------------------|
| Backend API    | http://localhost:4000    |
| Frontend App   | http://localhost:5175    |
| Admin Panel    | http://localhost:5176    |

---

## ➕ How to Add a Doctor

### Method 1 — Admin Panel (Recommended)
1. Open the Admin Panel at **http://localhost:5176**
2. Log in with `admin@prescripto.com` / `Admin@123`
3. Click **"Add Doctor"** in the left sidebar
4. Fill in all the fields and upload a photo
5. Click **Add Doctor** — the doctor can now log in immediately

### Method 2 — Command Line Script
1. Open `backend/createDoctor.js` in your editor
2. Edit the `doctorData` block with the doctor's details:
   ```js
   const doctorData = {
       name:       "Dr. Jane Smith",
       email:      "jane@prescripto.com",
       password:   "Doctor@123",      // will be bcrypt-hashed automatically
       image:      "https://...",     // URL or leave placeholder
       speciality: "Cardiologist",
       degree:     "MD, MBBS",
       experience: "8 Years",
       about:      "Brief bio here.",
       fees:       80,
       address:    { line1: "123 Main St", line2: "New York" },
       available:  true,
       date:       Date.now()
   };
   ```
3. Run the script from the `backend/` folder:
   ```bash
   node createDoctor.js
   ```
4. You'll see a confirmation in the terminal:
   ```
   ✅ Doctor created successfully!
      Name:  Dr. Jane Smith
      Email: jane@prescripto.com
   ```

---

## ✏️ How to Change the Admin Password

The admin is **not a database account** — it uses environment variables.

1. Open `backend/.env`
2. Update these two lines:
   ```env
   ADMIN_EMAIL=admin@prescripto.com
   ADMIN_PASSWORD=YourNewPassword
   ```
3. Restart the backend server:
   ```bash
   node server.js
   ```

---

## 🔄 How to Reset a Doctor's Password

### Via Command Line
1. Open `backend/createDoctor.js`
2. Set the `email` to the doctor's existing email and set a new `password`
3. Run `node createDoctor.js` — it detects the existing account and **updates the password only**

### Via Admin Panel
*(Not currently supported in the UI — use the CLI method above)*

---

## 🗄️ Database Storage

| Mode           | When Active                            | Data Location                    |
|----------------|----------------------------------------|----------------------------------|
| **MySQL**      | When `MYSQL_HOST` is set in `.env` and MySQL server is running | Your MySQL `prescripto` database |
| **JSON Files** | When MySQL is unavailable (auto fallback) | `backend/data/*.json`          |

### JSON fallback files:
- `backend/data/users.json` — registered patients
- `backend/data/doctors.json` — doctor accounts
- `backend/data/appointments.json` — all bookings

---

## 🚀 Start All Servers

Open **3 separate terminals** and run:

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend (Patient Portal)
cd frontend
npm run dev

# Terminal 3 — Admin Panel
cd admin
npm run dev
```
