from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import Notification, User

class NotificationService:
    @staticmethod
    def create(
        db: Session,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        service_request_id: Optional[UUID] = None,
        exception_id: Optional[UUID] = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            service_request_id=service_request_id,
            exception_id=exception_id,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def notify_role(
        db: Session,
        roles: List[str],
        notification_type: str,
        title: str,
        message: str,
        service_request_id: Optional[UUID] = None,
        exception_id: Optional[UUID] = None
    ) -> List[Notification]:
        users = db.query(User).filter(User.role.in_(roles), User.is_active == True).all()
        created = []
        for u in users:
            notif = Notification(
                user_id=u.id,
                notification_type=notification_type,
                title=title,
                message=message,
                service_request_id=service_request_id,
                exception_id=exception_id,
                is_read=False
            )
            db.add(notif)
            created.append(notif)
        db.commit()
        return created
