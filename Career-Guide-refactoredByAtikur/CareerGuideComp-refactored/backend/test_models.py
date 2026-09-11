from sqlalchemy import inspect

from app.database import engine, init_db
import app.models  # Loads the model definitions

# Ensure the database and tables are created before inspecting
init_db()

inspector = inspect(engine)

expected_tables = {
    "users",
    "student_profiles",
    "counselors",
    "articles",
    "sessions",
    "assessment_attempts",
    "recommendations",
    "conversations",
    "messages",
}

actual_tables = set(inspector.get_table_names())

print("\nTables found in MySQL database:")
for table in sorted(actual_tables):
    print(f"  * {table}")

missing_tables = expected_tables - actual_tables

if missing_tables:
    print(f"\nMissing tables: {', '.join(sorted(missing_tables))}")
else:
    print(f"\nSuccess: all {len(expected_tables)} CareerGuide tables match the Python models and exist in MySQL.")