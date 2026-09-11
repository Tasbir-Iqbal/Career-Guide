# 🧭 CareerPath AI (CareerGuide)

An intelligent AI-driven career guidance and mentorship web platform. CareerPath AI connects students with personalized AI career recommendations, step-by-step career roadmaps, verified career counselors, 1-on-1 appointment booking, and in-app chat.

---

## 📚 Detailed Documentation

For a comprehensive, beginner-friendly explanation of the architecture, directory tree, database schema, user flows, and backend endpoints, please read:

👉 **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**

---

## ⚡ Quick Start

### 1. Start the Backend (FastAPI + MySQL)
```bash
cd CareerGuideComp/backend

# Create & activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy mysql-connector-python python-jose passlib bcrypt pydantic python-dotenv

# Run the backend API server
uvicorn app.main:app --reload --port 8000
```
- API URL: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend (React + Vite)
```bash
cd CareerGuideComp

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web App: `http://localhost:5173`

---

## 👥 Default Test Logins

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `AdminTest123` |
| **Counselor** | `counselor@example.com` | `CounselorTest123` |
| **Student** | *(Sign up at `/signup`)* | *(Your password)* |