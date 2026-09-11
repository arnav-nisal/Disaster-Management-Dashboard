import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from models import (
    IncidentCreate,
    IncidentResponse,
    AllocationPlan,
    AuditLogRecord
)
from services.gemini_service import gemini_service
from services.allocation_engine import allocation_engine
from services.dispatch_agent import dispatch_agent
from services.firestore_service import firestore_service

router = APIRouter(prefix="/api", tags=["Incidents & Resource Allocations"])


def process_incident_pipeline(incident: IncidentCreate) -> IncidentResponse:
    """Core disaster lifecycle pipeline: Triage -> De-duplication -> Allocation -> Dispatch -> Audit."""
    incident_id = f"inc_{uuid.uuid4().hex[:10]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # De-duplication proximity check (500m radius)
    existing = firestore_service.list_incidents()
    is_duplicate = allocation_engine.check_duplicate_proximity(
        latitude=incident.latitude,
        longitude=incident.longitude,
        disaster_type=incident.disaster_type,
        existing_incidents=existing,
        radius_meters=500.0
    )

    # 1. Triage Assessment (Gemini 2.5 Flash with deterministic fallback)
    triage = gemini_service.triage_incident(incident, is_duplicate=is_duplicate)

    # Audit Triage
    firestore_service.add_audit_log(
        event_type="TRIAGE_COMPLETED",
        incident_id=incident_id,
        details={
            "calculated_priority": triage.calculated_priority,
            "urgency_level": triage.urgency_level,
            "verified_needs": triage.verified_needs,
            "is_duplicate": triage.is_duplicate,
            "reasoning": triage.reasoning
        }
    )

    # 2. Deterministic Allocation Engine
    loc = getattr(incident, "location", None) or f"({incident.latitude:.4f}, {incident.longitude:.4f})"
    allocation = allocation_engine.allocate(
        incident_id=incident_id,
        category=incident.disaster_type,
        location=loc,
        triage=triage,
        timestamp=timestamp
    )

    # 3. Dispatch Brief
    dispatch_msg = dispatch_agent.generate_dispatch_message(
        incident=incident,
        triage=triage,
        allocation=allocation
    )
    allocation.dispatch_message = dispatch_msg

    # Audit Allocation & Dispatch
    firestore_service.add_audit_log(
        event_type="ALLOCATION_COMMITTED",
        incident_id=incident_id,
        details={
            "allocated_resources": allocation.allocated_resources,
            "allocated_med_kits": allocation.allocated_med_kits,
            "allocated_rescue_teams": allocation.allocated_rescue_teams,
            "shortfall": allocation.shortfall,
            "dispatch_message": dispatch_msg
        }
    )

    response = IncidentResponse(
        incident_id=incident_id,
        incident=incident,
        triage=triage,
        allocation=allocation,
        timestamp=timestamp
    )

    # Save to Firestore / in-memory repository with flattened keys
    firestore_service.save_incident(incident_id, response.model_dump())
    firestore_service.save_allocation(
        allocation_id=f"alloc_{incident_id}",
        data={
            "incident_id": incident_id,
            "plan": allocation.model_dump(),
            "timestamp": timestamp
        }
    )

    return response


@router.post("/incidents", response_model=IncidentResponse, status_code=200)
def create_incident(incident: IncidentCreate):
    """Primary incident ingestion endpoint."""
    try:
        return process_incident_pipeline(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Incident processing failed: {str(e)}")


@router.post("/report-incident", response_model=IncidentResponse, status_code=200)
def report_incident_alias(incident: IncidentCreate):
    """Legacy route alias for /api/incidents guaranteeing compatibility."""
    try:
        return process_incident_pipeline(incident)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Incident processing failed: {str(e)}")


@router.get("/allocations", response_model=List[Dict[str, Any]], status_code=200)
def list_allocations():
    """Returns active resource allocations with flattened keys for dashboard compatibility."""
    return firestore_service.list_allocations()


@router.get("/audit-logs", response_model=List[Dict[str, Any]], status_code=200)
def list_audit_logs():
    """Returns chronological append-only audit event logs."""
    return firestore_service.list_audit_logs()
