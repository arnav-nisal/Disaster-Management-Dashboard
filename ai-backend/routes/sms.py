import uuid
import re
from datetime import datetime, timezone
from typing import Dict
from fastapi import APIRouter, HTTPException

from models import SMSWebhookPayload, IncidentCreate, IncidentResponse
from services.gemini_service import gemini_service
from services.allocation_engine import allocation_engine
from services.dispatch_agent import dispatch_agent
from services.firestore_service import firestore_service

router = APIRouter(prefix="/api/sms", tags=["SMS Gateway"])


def parse_sms_body_to_incident(body: str) -> IncidentCreate:
    """
    Parses offline SMS string formatted as:
    DISASTER_TYPE, SEVERITY, LAT, LONG, NEEDS [, LOCATION/NOTES]
    Examples:
      'flood, 8, 29.7604, -95.3698, food:100 water:200 medical:20'
      'fire, 9, 34.05, -118.25, rescue:10, Downtown Zone A'
    """
    parts = [p.strip() for p in body.split(",") if p.strip()]
    if len(parts) < 2:
        raise ValueError("SMS body must contain at least disaster type and severity rating")

    disaster_type = parts[0]

    # Parse severity
    try:
        severity_match = re.search(r"\d+", parts[1])
        severity_scale = int(severity_match.group()) if severity_match else 5
        severity_scale = max(1, min(10, severity_scale))
    except Exception:
        severity_scale = 5

    latitude = 0.0
    longitude = 0.0
    if len(parts) >= 4:
        try:
            latitude = float(parts[2])
            longitude = float(parts[3])
        except ValueError:
            latitude = 0.0
            longitude = 0.0

    needs_raw = parts[4] if len(parts) >= 5 else ""
    requested_resources: Dict[str, int] = {}
    if needs_raw:
        # Match tokens like food:100 or food=100 or 100 food
        tokens = re.findall(r"([a-zA-Z]+)\s*[:=]\s*(\d+)", needs_raw)
        for key, val in tokens:
            requested_resources[key.lower()] = int(val)

    location_or_notes = ", ".join(parts[5:]) if len(parts) >= 6 else ""

    return IncidentCreate(
        disaster_type=disaster_type,
        description=f"SMS report: {body}",
        severity_scale=severity_scale,
        latitude=latitude,
        longitude=longitude,
        location=location_or_notes or f"{latitude:.2f}, {longitude:.2f}" if (latitude or longitude) else "",
        affected_count=requested_resources.get("food", 10),
        requested_resources=requested_resources
    )


@router.post("/webhook", response_model=IncidentResponse, status_code=200)
def sms_webhook(payload: SMSWebhookPayload):
    """
    Offline fallback endpoint: ingests raw SMS text, parses it into an IncidentCreate,
    and runs the core triage -> allocation -> dispatch pipeline.
    """
    try:
        incident = parse_sms_body_to_incident(payload.body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse SMS message format: {str(e)}")

    incident_id = f"sms_{uuid.uuid4().hex[:10]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # Proximity check
    existing_incidents = firestore_service.list_incidents()
    is_duplicate = allocation_engine.check_duplicate_proximity(
        latitude=incident.latitude,
        longitude=incident.longitude,
        disaster_type=incident.disaster_type,
        existing_incidents=existing_incidents
    )

    # Triage
    triage = gemini_service.triage_incident(incident, is_duplicate=is_duplicate)
    firestore_service.add_audit_log(
        event_type="SMS_TRIAGE_COMPLETED",
        incident_id=incident_id,
        details={"priority": triage.calculated_priority, "urgency": triage.urgency_level}
    )

    # Allocation
    allocation = allocation_engine.allocate(
        incident_id=incident_id,
        category=incident.disaster_type,
        location=incident.location or f"({incident.latitude:.4f}, {incident.longitude:.4f})",
        triage=triage,
        timestamp=timestamp
    )

    # Dispatch Brief
    dispatch_brief = dispatch_agent.generate_dispatch_message(
        incident=incident,
        triage=triage,
        allocation=allocation
    )
    allocation.dispatch_message = dispatch_brief

    # Audit & Store
    firestore_service.add_audit_log(
        event_type="SMS_DISPATCH_COMMITTED",
        incident_id=incident_id,
        details={"dispatch_message": dispatch_brief, "sender": payload.sender}
    )

    response = IncidentResponse(
        incident_id=incident_id,
        incident=incident,
        triage=triage,
        allocation=allocation,
        timestamp=timestamp
    )

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
