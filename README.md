CareerGuide AI
CareerGuide AI is a full-stack, role-based career guidance platform that helps students explore career paths, receive AI-powered recommendations, connect with approved counselors, book counseling sessions, join career webinars, and submit feedback. It also includes dedicated counselor and administrator portals for managing platform activity.

Features
Student Portal
Create an account and log in securely

Complete an AI Career Match assessment using education level, skills, interests, favorite subjects, and preferred work style

Receive three personalized career recommendations generated with Google Gemini

Select a preferred career path

View saved career paths and a personalized learning roadmap

Browse approved counselors and book counseling sessions

View and cancel eligible session bookings

Chat with counselors

Browse career webinars

Register for webinars and access meeting links only after registration

Submit feedback, suggestions, or complaints and track their review status

Counselor Portal
Register as a counselor and wait for administrator approval

Manage student counseling session requests

Confirm, complete, or cancel sessions

Publish and manage career-guidance articles

Chat with students

Create webinars linked to career categories

View webinar attendees

Cancel future webinars

Submit feedback, suggestions, or complaints and track their status

Admin Portal
View users, counselors, and system statistics

Create approved counselor accounts directly

Review and approve or reject counselor applications

Manage career categories

Oversee all webinars and cancel invalid or inappropriate sessions

Review feedback, suggestions, and complaints

Mark feedback as reviewed or resolved

Download a live CSV activity report containing user, session, webinar, registration, and feedback totals

Technology Stack
Layer	Technologies
Frontend	React, TypeScript, Vite, Tailwind CSS, Lucide React
Backend	Python, FastAPI, SQLAlchemy, Pydantic
Database	MySQL
Authentication	JWT bearer authentication and role-based authorization
AI	Google Gemini API using structured JSON output
Reporting	CSV export through FastAPI StreamingResponse
Roles and Access Control
Role	Main capabilities
Student	Career assessment, counselor sessions, chat, webinars, feedback
Counselor	Sessions, articles, chat, webinars, feedback
Admin	Users, applications, categories, webinar oversight, feedback moderation, reports
The backend enforces role checks for protected endpoints. For example, only approved counselors can create webinars, only students can register for webinars, and only admins can access system reports and moderation features.

Key Workflows
AI Career Match
A student enters education level, interests, skills, favorite subjects, and work style.

The FastAPI backend sends the profile to Google Gemini.

Gemini returns exactly three structured career recommendations.

The backend validates the results and saves the assessment and recommendations in MySQL.

The student can choose one career path for saved paths and roadmap guidance.

Webinar Privacy
An approved counselor creates a webinar with a private meeting link.

Students can browse webinar information but cannot see the meeting link.

A student registers for the webinar.

The registered student can access the private meeting link in My Webinars.

Admins can oversee and cancel webinars but do not receive private meeting links.

Feedback Moderation
Students and counselors submit feedback, suggestions, or complaints.

Submissions are stored with a status of new.

Admins can filter submissions and mark them reviewed or resolved.

The original sender can view the updated status in their portal.

Project Structure
text
CareerGuideComp/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── admin.py
│   │   │   ├── articles.py
│   │   │   ├── auth.py
│   │   │   ├── categories.py
│   │   │   ├── chat.py
│   │   │   ├── counselors.py
│   │   │   ├── feedback.py
│   │   │   ├── recommendations.py
│   │   │   ├── students.py
│   │   │   └── webinars.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── gemini_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── context/
    │   └── pages/
    │       ├── AdminDashboard.tsx
    │       ├── CounselorDashboard.tsx
    │       └── StudentDashboard.tsx
    ├── package.json
    └── vite.config.ts
Local Setup
Prerequisites
Python 3.11 or newer

Node.js 18 or newer

MySQL Server

A Google Gemini API key

1. Clone the repository
bash
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
cd YOUR_REPOSITORY_NAME
2. Set up the backend
bash
cd backend
python -m venv venv
Activate the virtual environment.

Windows PowerShell:

powershell
.\venv\Scripts\Activate.ps1
Install dependencies:

bash
pip install -r requirements.txt
If Gemini dependencies are not already in requirements.txt, install them:

bash
pip install google-genai python-dotenv
3. Configure environment variables
Create backend/.env using backend/.env.example as a template.

text
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@localhost:3306/DATABASE_NAME
SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
Never commit the real .env file or API keys to GitHub.

4. Create the database
Create an empty MySQL database, then set its name and credentials in DATABASE_URL.

The application uses SQLAlchemy models and Base.metadata.create_all(...) to create missing tables when the backend starts.

5. Start the backend
From the backend folder:

powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
Backend API:

text
http://127.0.0.1:8000
Interactive API documentation:

text
http://127.0.0.1:8000/docs
6. Set up the frontend
Open another terminal:

bash
cd frontend
npm install
Create frontend/.env if needed:

text
VITE_API_URL=http://127.0.0.1:8000
Start the frontend:

bash
npm run dev
Frontend development server:

text
http://localhost:5173
API Highlights
Area	Example endpoints
Authentication	POST /auth/signup, POST /auth/login
Recommendations	POST /recommendations/generate, GET /recommendations/me
Sessions	POST /students/sessions, GET /counselors/me/sessions
Chat	GET /chat/conversations, POST /chat/conversations/{id}/messages
Categories	GET /categories, POST /categories
Webinars	GET /webinars, POST /webinars, POST /webinars/{id}/register
Feedback	POST /feedback, GET /feedback/mine, GET /feedback/admin/all
Reports	GET /admin/reports/activity.csv
Use the built-in Swagger interface at /docs to inspect and test all routes.

Security Notes
Passwords are stored as password hashes, not plaintext passwords.

JWT bearer tokens protect authenticated routes.

Role-based authorization protects student, counselor, and administrator actions.

Meeting links are not included in public webinar responses.

Only registered students and the webinar owner can access webinar meeting links.

Gemini API keys and database credentials must remain in backend environment variables.

Add .env, virtual environments, and Python cache files to .gitignore before pushing the project to GitHub.

Example backend .gitignore:

text
.env
venv/
__pycache__/
*.pyc
Future Improvements
Add database migrations with Alembic instead of relying only on create_all.

Add request rate limiting, especially for login and Gemini recommendation endpoints.

Add email notifications for counselor approval, bookings, webinar registration, and feedback updates.

Add pagination, search, and date filters for large admin datasets.

Add automated tests for API authorization, webinar privacy, and role boundaries.

Add production deployment configuration with HTTPS and restricted CORS origins.

Add PDF report export alongside CSV download.

License
This project is intended for educational and portfolio purposes. Add a license file if you plan to distribute or reuse it publicly.
