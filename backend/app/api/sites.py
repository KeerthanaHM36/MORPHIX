from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Site, Organization, User
from app.schemas.entities import SiteCreate, SiteUpdate, SiteResponse

router = APIRouter(prefix="/sites", tags=["Sites"])

@router.get("", response_model=List[SiteResponse])
def list_sites(
    organization_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Site)
    if organization_id:
        query = query.filter(Site.organization_id == organization_id)
    return query.order_by(Site.name).all()

@router.post("", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    org = db.query(Organization).filter(Organization.id == payload.organization_id).first()
    if not org:
        raise HTTPException(status_code=400, detail="Invalid organization_id")
    
    existing = db.query(Site).filter(
        Site.organization_id == payload.organization_id,
        Site.code == payload.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Site code already exists in this organization")

    site = Site(**payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site

@router.get("/{site_id}", response_model=SiteResponse)
def get_site(site_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site
