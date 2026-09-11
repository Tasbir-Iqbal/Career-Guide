## How to Run the Project (Step-by-Step)
  ### Step 1: Start MySQL and Create the Database
  XAMPP is installed on your system at C:\xampp.
  1. Open XAMPP Control Panel (or launch C:\xampp\xampp-control.exe) and click Start next to MySQL (port 3306).
  2. Open your browser to http://localhost/phpmyadmin or open a terminal and run:
    C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS careerguide CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  ──────
  ### Step 2: Configure the Backend
  1. Navigate to the backend directory:
    cd D:\Atik\Personal\Career-Guide\Career_Guide_Main\BackEnd

  2. Create a .env file in Career_Guide_Main\BackEnd\.env with the following variables:
    DB_USER=root
    DB_PASSWORD=
    DB_HOST=localhost
    DB_PORT=3306
    DB_NAME=careerguide
    JWT_SECRET=super_secret_careerguide_token_key_2026
    GEMINI_API_KEY=your_google_gemini_api_key_here
  (If your MySQL root user has a password in XAMPP, provide it in DB_PASSWORD. If none, leave it empty).
  3. Install missing Python dependencies:
    pip install google-genai
  (Most dependencies like fastapi, uvicorn, sqlalchemy, pydantic, python-jose, passlib, bcrypt, and mysql-connector-python are already installed on your system).
  4. Seed the default test accounts (Admin and Counselor):
    python create_test_admin.py
    python create_test_counselor.py
  This creates:
      • Admin: admin@example.com / AdminTest123
      • Counselor: counselor@example.com / CounselorTest123
  5. Start the FastAPI backend server:
    python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

      • API Root: http://127.0.0.1:8000
      • Interactive API Documentation (Swagger UI): http://127.0.0.1:8000/docs

  ──────
  ### Step 3: Configure and Start the Frontend

  1. Ensure vite.config.ts exists. You can copy the configuration from CareerGuideComp:
    Copy-Item "D:\Atik\Personal\Career-Guide\CareerGuideComp\vite.config.ts" "D:\Atik\Personal\Career-Guide\Career_Guide_Main\vite.config.ts"

  2. Navigate to the frontend directory:
    cd D:\Atik\Personal\Career-Guide\Career_Guide_Main

  3. (Optional) Create a .env file in Career_Guide_Main\.env:
    VITE_API_URL=http://127.0.0.1:8000

  4. Install the frontend dependencies:
    npm install

  5. Start the Vite development server:
    npm run dev

  6. Open your browser and go to http://localhost:5173.
  ──────
  ### Step 4: Verify the Application

  1. Student Workflow:
      • Go to http://localhost:5173/signup and create a student account.
      • Access the Student Dashboard, complete the AI Career Assessment, and review the recommendations.
      • Browse counselors at /counselors and schedule a counseling session.
      • Explore webinars and register for an upcoming session.
  2. Counselor Workflow:
      • Log in with counselor@example.com / CounselorTest123 at /login.
      • Access the Counselor Dashboard at /counselor to view session requests, publish articles, manage webinars, and chat with students.
  3. Admin Workflow:
      • Log in with admin@example.com / AdminTest123 at /login.
      • Access the Admin Dashboard at /admin to view live user stats, approve counselor applications, moderate webinars and feedback, and download the CSV activity report.

  ──────
  ### Step 5: Running Automated Backend Tests

  To run the automated test suite against the backend:

    cd D:\Atik\Personal\Career-Guide\Career_Guide_Main
    $env:PYTHONPATH = "BackEnd"
    python test_admin_portal.py
    python test_career_assessment.py
    python test_counselor_portal.py
    python test_student_portal.py
    python test_webinar.py