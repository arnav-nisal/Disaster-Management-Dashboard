from typing import Dict, Optional, Any, Literal
from pydantic import BaseModel, Field


UrgencyLevel = Literal["Critical", "High", "Medium", "Low"]


class IncidentCreate(BaseModel):
    disaster_type: str = Field(..., description="Type of disaster, e.g., earthquake, flood, wildfire")
    description: str = Field(default="", description="Raw incident description or dispatch report")
    severity_scale: int = Field(..., ge=1, le=10, description="Severity rating from 1 to 10")
    latitude: float = Field(default=0.0, ge=-90.0, le=90.0, description="Latitude of the incident")
    longitude: float = Field(default=0.0, ge=-180.0, le=180.0, description="Longitude of the incident")
    location: str = Field(default="", description="Human-readable location or address")
    affected_count: int = Field(default=0, ge=0, description="Estimated number of affected individuals")
    requested_resources: Dict[str, int] = Field(
        default_factory=dict,
        description="Dictionary of requested resources (e.g. food, water, medical, rescue)"
    )


class TriageAssessment(BaseModel):
    calculated_priority: int = Field(..., ge=1, le=100, description="Priority score from 1 to 100")
    urgency_level: UrgencyLevel = Field(..., description="Urgency classification: Critical, High, Medium, Low")
    verified_needs: Dict[str, int] = Field(
        default_factory=dict,
        description="Verified resource quantities required after triage analysis"
    )
    is_duplicate: bool = Field(default=False, description="Flag indicating if this report is a duplicate")
    reasoning: str = Field(..., description="Justification and explanation from triage agent")


class AllocationPlan(BaseModel):
    incident_id: str = Field(..., description="Associated incident ID")
    location: str = Field(default="", description="Location name or coordinates summary")
    priority_score: int = Field(..., ge=1, le=100, description="Calculated priority score")
    category: str = Field(..., description="Disaster category/type")
    allocated_resources: Dict[str, int] = Field(
        default_factory=dict,
        description="Resources successfully allocated and committed"
    )
    allocated_med_kits: int = Field(default=0, ge=0, description="Number of medical kits allocated")
    allocated_rescue_teams: int = Field(default=0, ge=0, description="Number of rescue teams allocated")
    shortfall: Dict[str, int] = Field(
        default_factory=dict,
        description="Unmet resource demand due to supply constraints"
    )
    dispatch_message: str = Field(default="", description="Tactical dispatch brief for rescue crews")
    status: str = Field(default="Active", description="Operational status: Active, Dispatched, Resolved")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class AuditLogRecord(BaseModel):
    log_id: str = Field(..., description="Unique log identifier")
    timestamp: str = Field(..., description="ISO 8601 formatted event timestamp")
    event_type: str = Field(..., description="Event action or category, e.g., TRIAGE_COMPLETED")
    incident_id: str = Field(..., description="Associated incident ID")
    details: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary metadata and context payload")


class SMSWebhookPayload(BaseModel):
    body: str = Field(..., description="Raw SMS text formatted as: DISASTER_TYPE, SEVERITY, LAT, LONG, NEEDS (optional location/description)")
    sender: Optional[str] = Field(default=None, description="Sender phone number or ID")


class IncidentResponse(BaseModel):
    incident_id: str
    incident: IncidentCreate
    triage: TriageAssessment
    allocation: AllocationPlan
    timestamp: str
