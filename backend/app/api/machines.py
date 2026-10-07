from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Machine, Site, User
from app.schemas.entities import MachineCreate, MachineUpdate, MachineResponse

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("", response_model=List[MachineResponse])
def list_machines(
    site_id: Optional[UUID] = None,
    status: Optional[str] = None,
    criticality: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Machine)
    if site_id:
        query = query.filter(Machine.site_id == site_id)
    if status:
        query = query.filter(Machine.status == status)
    if criticality:
        query = query.filter(Machine.criticality == criticality)

    machines = query.order_by(Machine.name).all()
    res = []
    for m in machines:
        item = MachineResponse.model_validate(m)
        item.site_name = m.site.name if m.site else None
        res.append(item)
    return res

@router.post("", response_model=MachineResponse, status_code=status.HTTP_201_CREATED)
def create_machine(
    payload: MachineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    site = db.query(Site).filter(Site.id == payload.site_id).first()
    if not site:
        raise HTTPException(status_code=400, detail="Invalid site_id")

    existing = db.query(Machine).filter(
        Machine.site_id == payload.site_id,
        Machine.machine_code == payload.machine_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Machine code already exists at this site")

    machine = Machine(**payload.model_dump())
    db.add(machine)
    db.commit()
    db.refresh(machine)

    res = MachineResponse.model_validate(machine)
    res.site_name = site.name
    return res

@router.get("/{machine_id}", response_model=MachineResponse)
def get_machine(machine_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    res = MachineResponse.model_validate(m)
    res.site_name = m.site.name if m.site else None
    return res

@router.patch("/{machine_id}", response_model=MachineResponse)
def update_machine(
    machine_id: UUID,
    payload: MachineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(m, k, v)
    
    db.commit()
    db.refresh(m)
    res = MachineResponse.model_validate(m)
    res.site_name = m.site.name if m.site else None
    return res
