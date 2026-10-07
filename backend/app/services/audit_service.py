from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.models import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        # Convert any UUIDs inside dictionaries to string for clean JSON serialization
        def serialize_dict(d):
            if not d:
                return None
            return {k: str(v) if isinstance(v, UUID) else v for k, v in d.items()}

        log_entry = AuditLog(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_values=serialize_dict(old_values),
            new_values=serialize_dict(new_values),
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
