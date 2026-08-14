from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    admin,
    articles,
    auth,
    chat,
    counselors,
    recommendations,
    students,
)


app = FastAPI(
    title="CareerGuide API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(students.router)
app.include_router(counselors.router)
app.include_router(admin.router)
app.include_router(articles.router)
app.include_router(recommendations.router)
app.include_router(chat.router)


@app.get("/")
def home():
    return {
        "message": "CareerGuide API is running",
        "database": "MySQL connected",
    }