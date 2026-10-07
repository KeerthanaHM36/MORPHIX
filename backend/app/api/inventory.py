from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Inventory, Site, SparePart, User
from app.schemas.entities import InventoryCreate, InventoryUpdate, InventoryResponse

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryResponse])
def list_inventory(
    site_id: Optional[UUID] = None,
    spare_part_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Inventory)
    if site_id:
        query = query.filter(Inventory.site_id == site_id)
    if spare_part_id:
        query = query.filter(Inventory.spare_part_id == spare_part_id)
    
    items = query.all()
    res = []
    for item in items:
        resp = InventoryResponse.model_validate(item)
        resp.part_name = item.spare_part.name if item.spare_part else None
        resp.part_code = item.spare_part.part_code if item.spare_part else None
        resp.site_name = item.site.name if item.site else None
        res.append(resp)
    return res

@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    existing = db.query(Inventory).filter(
        Inventory.site_id == payload.site_id,
        Inventory.spare_part_id == payload.spare_part_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory record already exists for this site and spare part")
    
    inv = Inventory(**payload.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)

    resp = InventoryResponse.model_validate(inv)
    resp.part_name = inv.spare_part.name if inv.spare_part else None
    resp.part_code = inv.spare_part.part_code if inv.spare_part else None
    resp.site_name = inv.site.name if inv.site else None
    return resp

@router.patch("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(
    inventory_id: UUID,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(inv, k, v)
    
    db.commit()
    db.refresh(inv)
    resp = InventoryResponse.model_validate(inv)
    resp.part_name = inv.spare_part.name if inv.spare_part else None
    resp.part_code = inv.spare_part.part_code if inv.spare_part else None
    resp.site_name = inv.site.name if inv.site else None
    return resp
