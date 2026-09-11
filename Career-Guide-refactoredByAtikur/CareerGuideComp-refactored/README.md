# 🧭 CareerPath AI — Active Application Bundle

This directory (`CareerGuideComp/`) contains the complete full-stack **CareerPath AI** application.

---

## 📁 Subdirectory Overview
- **`src/`**: Modern React 18 + Vite frontend with TypeScript, Tailwind CSS, Lucide icons, and Shadcn UI.
- **`backend/`**: FastAPI (Python) backend with SQLAlchemy ORM, MySQL database connection, and JWT authentication.

---

## 📚 Complete Documentation
For full architectural details, database ER diagrams, API route listings, and algorithm breakdowns, see:
👉 **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** in the repository root.

---

## ⚡ Quick Start

### 1. Backend (FastAPI + MySQL)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy mysql-connector-python python-jose passlib bcrypt pydantic python-dotenv
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React + Vite)
```bash
npm install
npm run dev
```
Navigate to: `http://localhost:5173`