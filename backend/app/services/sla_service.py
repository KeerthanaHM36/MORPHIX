from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from app.models import ServiceRequest

class SLAService:
    PRIORITY_DEFAULT_HOURS = {
        "CRITICAL": 4,
        "HIGH": 12,
        "MEDIUM": 24,
        "LOW": 48
    }

    # Fraction of total time remaining below which SLA is considered AT_RISK (e.g. 25% or under 2 hours)
    AT_RISK_THRESHOLD_MINUTES = {
        "CRITICAL": 60,
        "HIGH": 180,
        "MEDIUM": 360,
        "LOW": 720
    }

    @classmethod
    def calculate_default_deadline(cls, priority: str, start_time: Optional[datetime] = None) -> datetime:
        base_time = start_time or datetime.now(timezone.utc)
        hours = cls.PRIORITY_DEFAULT_HOURS.get(priority.upper(), 24)
        return base_time + timedelta(hours=hours)

    @classmethod
    def assess_sla(cls, request: ServiceRequest) -> Tuple[str, Optional[int], float]:
        """
        Returns:
            status: "SAFE", "AT_RISK", "BREACHED"
            remaining_minutes: int (can be negative if breached)
            risk_score: float (0.0 to 100.0)
        """
        if request.status in ["COMPLETED", "CANCELLED"]:
            return "SAFE", None, 0.0

        if not request.sla_deadline:
            return "SAFE", None, 0.0

        now = datetime.now(timezone.utc)
        deadline = request.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        diff = deadline - now
        remaining_minutes = int(diff.total_seconds() / 60)

        if remaining_minutes <= 0:
            return "BREACHED", remaining_minutes, 100.0

        at_risk_threshold = cls.AT_RISK_THRESHOLD_MINUTES.get(request.priority.upper(), 180)

        if remaining_minutes <= at_risk_threshold:
            # Scale risk from 50 to 99%
            risk_score = 50.0 + 49.0 * (1.0 - (remaining_minutes / max(at_risk_threshold, 1)))
            return "AT_RISK", remaining_minutes, round(risk_score, 2)
        else:
            # Safe risk score 0 to 49%
            risk_score = max(0.0, 49.0 * (1.0 - (remaining_minutes / (at_risk_threshold * 3))))
            return "SAFE", remaining_minutes, round(risk_score, 2)
