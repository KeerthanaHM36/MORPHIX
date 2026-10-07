from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import ServiceTask, User
from app.schemas.assignment import ServiceTaskCreate, ServiceTaskUpdate, ServiceTaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[ServiceTaskResponse])
def list_tasks(
    service_request_id: Optional[UUID] = None,
    assignment_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ServiceTask)
    if service_request_id:
        query = query.filter(ServiceTask.service_request_id == service_request_id)
    if assignment_id:
        query = query.filter(ServiceTask.assignment_id == assignment_id)
    return query.order_by(ServiceTask.sequence_number).all()

@router.post("", response_model=ServiceTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: ServiceTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = ServiceTask(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/{task_id}", response_model=ServiceTaskResponse)
def update_task(
    task_id: UUID,
    payload: ServiceTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(ServiceTask).filter(ServiceTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("status") == "IN_PROGRESS" and not task.started_at:
        task.started_at = datetime.now(timezone.utc)
    elif update_data.get("status") == "COMPLETED" and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)

    for k, v in update_data.items():
        setattr(task, k, v)

    db.commit()
    db.refresh(task)
    return task
