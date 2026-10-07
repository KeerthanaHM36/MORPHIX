from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import ServiceEvidence, ServiceRequest, User
from app.schemas.assignment import ServiceEvidenceResponse, EvidenceVerification
from app.services.storage_service import StorageService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/evidence", tags=["Evidence"])

def enrich_evidence(e: ServiceEvidence) -> ServiceEvidenceResponse:
    res = ServiceEvidenceResponse.model_validate(e)
    res.uploader_name = e.uploader.name if e.uploader else None
    res.verifier_name = e.verifier.name if e.verifier else None
    return res

@router.get("", response_model=List[ServiceEvidenceResponse])
def list_evidence(
    service_request_id: Optional[UUID] = None,
    assignment_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ServiceEvidence)
    if service_request_id:
        query = query.filter(ServiceEvidence.service_request_id == service_request_id)
    if assignment_id:
        query = query.filter(ServiceEvidence.assignment_id == assignment_id)
    
    items = query.order_by(ServiceEvidence.uploaded_at.desc()).all()
    return [enrich_evidence(e) for e in items]

@router.post("/upload", response_model=ServiceEvidenceResponse, status_code=status.HTTP_201_CREATED)
def upload_evidence(
    service_request_id: UUID = Form(...),
    evidence_type: str = Form(...),
    description: Optional[str] = Form(None),
    assignment_id: Optional[UUID] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_url = None
    if file:
        file_url, _ = StorageService.save_file(file)

    evidence = ServiceEvidence(
        service_request_id=service_request_id,
        assignment_id=assignment_id,
        evidence_type=evidence_type.upper(),
        file_url=file_url,
        description=description,
        uploaded_by=current_user.id,
        uploaded_at=datetime.now(timezone.utc),
        is_verified=False
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    AuditService.log(
        db=db,
        action="UPLOAD_EVIDENCE",
        entity_type="SERVICE_EVIDENCE",
        entity_id=evidence.id,
        user_id=current_user.id,
        new_values={"evidence_type": evidence.evidence_type, "service_request_id": str(service_request_id)}
    )

    NotificationService.notify_role(
        db=db,
        roles=["MANAGER", "ADMIN"],
        notification_type="SERVICE_UPDATE",
        title="Completion Evidence Uploaded",
        message=f"Technician uploaded verification evidence for review ({evidence_type}).",
        service_request_id=service_request_id
    )

    return enrich_evidence(evidence)

@router.post("/{evidence_id}/verify", response_model=ServiceEvidenceResponse)
def verify_evidence(
    evidence_id: UUID,
    payload: EvidenceVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    evidence = db.query(ServiceEvidence).filter(ServiceEvidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    evidence.is_verified = payload.is_verified
    evidence.verified_by = current_user.id
    evidence.verified_at = datetime.now(timezone.utc)

    # If verified, complete the associated service request
    if payload.is_verified and evidence.service_request:
        evidence.service_request.status = "COMPLETED"

    db.commit()
    db.refresh(evidence)

    AuditService.log(
        db=db,
        action="VERIFY_EVIDENCE",
        entity_type="SERVICE_EVIDENCE",
        entity_id=evidence.id,
        user_id=current_user.id,
        new_values={"is_verified": payload.is_verified, "request_completed": payload.is_verified}
    )

    NotificationService.create(
        db=db,
        user_id=evidence.uploaded_by,
        notification_type="SERVICE_UPDATE",
        title="Evidence Verification Decision",
        message=f"Your submitted evidence was {'APPROVED' if payload.is_verified else 'REJECTED'}.",
        service_request_id=evidence.service_request_id
    )

    return enrich_evidence(evidence)
