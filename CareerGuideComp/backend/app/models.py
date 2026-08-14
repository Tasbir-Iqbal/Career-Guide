from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    TIMESTAMP,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum("student", "counselor", "admin"),
        nullable=False,
        default="student",
    )
    created_at = Column(TIMESTAMP, server_default=func.now())

    student_profile = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
    )
    counselor_profile = relationship(
        "Counselor",
        back_populates="user",
        uselist=False,
    )

    student_conversations = relationship(
        "Conversation",
        foreign_keys="Conversation.student_id",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    counselor_conversations = relationship(
        "Conversation",
        foreign_keys="Conversation.counselor_id",
        back_populates="counselor",
        cascade="all, delete-orphan",
    )
    sent_messages = relationship(
        "Message",
        back_populates="sender",
        cascade="all, delete-orphan",
    )

    assessment_attempts = relationship(
        "AssessmentAttempt",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    recommendations = relationship(
        "Recommendation",
        back_populates="student",
        cascade="all, delete-orphan",
    )


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    education_level = Column(String(100))
    interests = Column(Text)
    career_goals = Column(Text)

    user = relationship("User", back_populates="student_profile")


class Counselor(Base):
    __tablename__ = "counselors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    specialization = Column(String(150))
    bio = Column(Text)
    availability = Column(String(255))

    user = relationship("User", back_populates="counselor_profile")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100))
    author_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


class SessionBooking(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    counselor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_date = Column(DateTime, nullable=False)
    status = Column(
        Enum("pending", "confirmed", "completed", "cancelled"),
        default="pending",
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    education_level = Column(String(100), nullable=True)
    interests = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    favorite_subjects = Column(Text, nullable=True)
    work_style = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("User", back_populates="assessment_attempts")
    recommendations = relationship(
        "Recommendation",
        back_populates="assessment_attempt",
        cascade="all, delete-orphan",
    )


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessment_attempt_id = Column(
        Integer,
        ForeignKey("assessment_attempts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    item_type = Column(
        Enum("article", "counselor", "career"),
        nullable=False,
        default="career",
    )
    item_id = Column(Integer, nullable=True)
    score = Column(Float, nullable=False)
    career_title = Column(String(150), nullable=True)
    reason = Column(Text, nullable=True)
    is_selected = Column(Boolean, nullable=False, default=False)
    generated_at = Column(TIMESTAMP, server_default=func.now())

    student = relationship("User", back_populates="recommendations")
    assessment_attempt = relationship(
        "AssessmentAttempt",
        back_populates="recommendations",
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    counselor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
    )

    student = relationship(
        "User",
        foreign_keys=[student_id],
        back_populates="student_conversations",
    )
    counselor = relationship(
        "User",
        foreign_keys=[counselor_id],
        back_populates="counselor_conversations",
    )
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")