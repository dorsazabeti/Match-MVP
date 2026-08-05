import uuid
from pathlib import Path

from fastapi import UploadFile

from backend.app.core.config import get_settings


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _matches_image_signature(content_type: str, content: bytes) -> bool:
    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")
    if content_type == "image/webp":
        return (
            len(content) >= 12
            and content[:4] == b"RIFF"
            and content[8:12] == b"WEBP"
        )
    return False


def get_upload_root() -> Path:
    settings = get_settings()
    root = Path(settings.upload_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


async def save_offer_image(upload: UploadFile) -> str:
    settings = get_settings()
    extension = ALLOWED_IMAGE_TYPES.get(upload.content_type or "")
    if extension is None:
        raise ValueError("Only JPG, PNG, and WebP images are supported")

    content = await upload.read(settings.max_offer_image_bytes + 1)
    if not content:
        raise ValueError("The selected image is empty")
    if len(content) > settings.max_offer_image_bytes:
        raise ValueError("Offer image must be 10 MB or smaller")
    if not _matches_image_signature(upload.content_type or "", content):
        raise ValueError("The uploaded file content is not a valid image")

    relative_path = Path("offers") / f"{uuid.uuid4().hex}{extension}"
    destination = get_upload_root() / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    return relative_path.as_posix()


def remove_uploaded_file(storage_path: str) -> None:
    target = (get_upload_root() / storage_path).resolve()
    root = get_upload_root()
    if root not in target.parents:
        return
    target.unlink(missing_ok=True)
