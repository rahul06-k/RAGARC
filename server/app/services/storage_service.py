import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException, status
from app.config import settings


class StorageService:
    @staticmethod
    def validate_file(file: UploadFile) -> str:
        """Validate file format and size."""
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must have a valid filename."
            )

        ext = os.path.splitext(file.filename)[1].lower().lstrip(".")
        allowed = settings.allowed_extensions_list

        if ext not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '.{ext}' is not supported. Allowed formats: {', '.join(allowed).upper()}."
            )

        return ext

    @staticmethod
    def save_upload_file(file: UploadFile) -> tuple[str, str, int]:
        """
        Saves uploaded file to disk with unique prefix to prevent overwrite.
        Returns (saved_file_path, original_filename, file_size_bytes)
        """
        StorageService.validate_file(file)

        upload_dir = os.path.abspath(settings.UPLOAD_DIR)
        os.makedirs(upload_dir, exist_ok=True)

        unique_name = f"{uuid.uuid4().hex[:10]}_{file.filename}"
        destination_path = os.path.join(upload_dir, unique_name)

        file_size = 0
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

        with open(destination_path, "wb") as buffer:
            while chunk := file.file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > max_bytes:
                    buffer.close()
                    if os.path.exists(destination_path):
                        os.remove(destination_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
                    )
                buffer.write(chunk)

        return destination_path, file.filename, file_size

    @staticmethod
    def delete_file(file_path: str):
        """Safely delete stored file."""
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"[StorageService] Failed to delete file {file_path}: {e}")
