import os

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field


load_dotenv()


class GeminiCareerRecommendation(BaseModel):
    career_title: str = Field(
        min_length=2,
        max_length=150,
        description="A realistic career title.",
    )
    match_percentage: int = Field(
        ge=40,
        le=95,
        description="Estimated compatibility with the student profile.",
    )
    reason: str = Field(
        min_length=30,
        max_length=600,
        description="A specific, student-friendly reason for the recommendation.",
    )


class GeminiCareerRecommendations(BaseModel):
    recommendations: list[GeminiCareerRecommendation] = Field(
        min_length=3,
        max_length=3,
    )


def generate_career_recommendations(
    *,
    education_level: str,
    interests: str,
    skills: str,
    favorite_subjects: str,
    work_style: str,
) -> list[GeminiCareerRecommendation]:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Add it to backend/.env and restart FastAPI."
        )

    model_name = "gemini-3.6-flash"

    prompt = f"""
You are CareerGuide's career guidance assistant.

Recommend exactly three realistic career paths for this student. Base your
recommendations only on their provided profile. Keep recommendations practical,
educational, supportive, and honest. Do not guarantee admission, employment,
salary, or any outcome.

Student profile:
- Education level: {education_level}
- Interests: {interests}
- Skills: {skills}
- Favorite subjects: {favorite_subjects}
- Preferred work style: {work_style}

For every recommendation:
- Use a distinct and specific career title.
- Give an integer match percentage from 40 to 95.
- Write a 2–4 sentence reason that connects the student's stated interests,
  skills, subjects, and work style to the career.
- Include at least one concrete skill or next step to explore.
"""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=GeminiCareerRecommendations.model_json_schema(),
            temperature=0.4,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    result = GeminiCareerRecommendations.model_validate_json(response.text)

    unique_titles: set[str] = set()
    recommendations: list[GeminiCareerRecommendation] = []

    for item in result.recommendations:
        normalized_title = item.career_title.strip().lower()

        if normalized_title in unique_titles:
            continue

        unique_titles.add(normalized_title)

        recommendations.append(
            GeminiCareerRecommendation(
                career_title=item.career_title.strip(),
                match_percentage=item.match_percentage,
                reason=item.reason.strip(),
            )
        )

    if len(recommendations) != 3:
        raise RuntimeError(
            "Gemini did not return three distinct career recommendations."
        )

    return recommendations