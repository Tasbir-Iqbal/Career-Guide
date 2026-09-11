from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Authentication ----------

class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: Literal["student"] = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    role: str


# ---------- Student profiles ----------

class StudentProfileUpdate(BaseModel):
    education_level: Optional[str] = Field(default=None, max_length=100)
    interests: Optional[str] = None
    career_goals: Optional[str] = None


class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    education_level: Optional[str] = None
    interests: Optional[str] = None
    career_goals: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Articles ----------

class ArticleCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=10)
    category: Optional[str] = Field(default=None, max_length=100)


class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    category: Optional[str] = None
    author_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Counseling bookings ----------

class SessionCreate(BaseModel):
    counselor_id: int
    session_date: datetime


class SessionResponse(BaseModel):
    id: int
    student_id: int
    counselor_id: int
    session_date: datetime
    status: str

    class Config:
        from_attributes = True


# ---------- Counselors ----------

class CounselorResponse(BaseModel):
    id: int
    user_id: int
    name: str
    specialization: Optional[str] = None
    bio: Optional[str] = None
    availability: Optional[str] = None

    class Config:
        from_attributes = True


class SessionStatusUpdate(BaseModel):
    status: Literal["confirmed", "completed", "cancelled"]


class CounselorSessionResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: EmailStr
    counselor_id: int
    session_date: datetime
    status: str

    class Config:
        from_attributes = True


# ---------- Admin ----------

class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminSessionResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: EmailStr
    counselor_id: int
    counselor_name: str
    counselor_email: EmailStr
    session_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_users: int
    total_students: int
    total_counselors: int
    total_admins: int
    total_sessions: int
    pending_sessions: int
    confirmed_sessions: int
    completed_sessions: int
    cancelled_sessions: int


class AdminCounselorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    specialization: Optional[str] = Field(default=None, max_length=150)
    bio: Optional[str] = None
    availability: Optional[str] = Field(default="Available", max_length=255)


# ---------- Career assessment and recommendations ----------

class AssessmentGenerateRequest(BaseModel):
    education_level: str = Field(min_length=2, max_length=100)
    interests: str = Field(min_length=2, max_length=1000)
    skills: str = Field(min_length=2, max_length=1000)
    favorite_subjects: str = Field(min_length=2, max_length=1000)
    work_style: str = Field(min_length=2, max_length=100)


class AssessmentAttemptResponse(BaseModel):
    id: int
    student_id: int
    education_level: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    favorite_subjects: Optional[str] = None
    work_style: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    id: int
    assessment_attempt_id: Optional[int] = None
    career_title: str
    match_percentage: int = Field(ge=0, le=100)
    reason: str
    is_selected: bool
    generated_at: datetime

    class Config:
        from_attributes = True


class AssessmentGenerateResponse(BaseModel):
    assessment: AssessmentAttemptResponse
    recommendations: list[RecommendationResponse]


class CareerSelectionRequest(BaseModel):
    recommendation_id: int


class CareerSelectionResponse(BaseModel):
    id: int
    career_title: str
    match_percentage: int = Field(ge=0, le=100)
    reason: str
    is_selected: bool
    assessment_attempt_id: Optional[int] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class LatestAssessmentResponse(BaseModel):
    assessment: Optional[AssessmentAttemptResponse] = None
    recommendations: list[RecommendationResponse] = []


# ---------- Counselor chat ----------

class ConversationCreate(BaseModel):
    counselor_id: int


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    counselor_id: int
    counselor_name: str
    created_at: datetime
    updated_at: datetime
    last_message: Optional[MessageResponse] = None

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []