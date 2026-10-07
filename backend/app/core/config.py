import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env file
load_dotenv(dotenv_path=BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "MORPHIX — Industrial Resilience OS")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://postgres:12345678910@localhost:5432/MORPHIX"
    )
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "morphix-super-secure-jwt-secret-key-production-ready-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")

settings = Settings()
# Ensure upload dir exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
