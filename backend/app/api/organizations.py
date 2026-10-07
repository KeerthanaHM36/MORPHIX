from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Organization, User
from app.schemas.entities import OrganizationCreate, OrganizationUpdate, OrganizationResponse

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("", response_model=List[OrganizationResponse])
def list_organizations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Organization).order_by(Organization.name).all()

@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    existing = db.query(Organization).filter(Organization.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization code already exists")
    org = Organization(**payload.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(org_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org
