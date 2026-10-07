import os
import uuid
import shutil
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".mp4"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

class StorageService:
    @staticmethod
    def save_file(file: UploadFile) -> Tuple[str, str]:
        filename = file.filename or "upload"
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{ext}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        unique_name = f"{uuid.uuid4().hex}{ext}"
        destination = settings.UPLOAD_DIR / unique_name

        try:
            with open(destination, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )

        file_url = f"/uploads/{unique_name}"
        return file_url, unique_name
