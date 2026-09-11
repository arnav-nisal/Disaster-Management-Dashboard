import re
from typing import Dict, Optional, Any, Literal, List
from pydantic import BaseModel, Field, ConfigDict, model_validator


UrgencyLevel = Literal["Critical", "High", "Medium", "Low"]


class IncidentCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    reporter_name: str = Field(..., description="Name of the person reporting the incident")
    disaster_type: str = Field(..., description="Type of disaster, e.g., earthquake, flood, wildfire")
    severity_level: int = Field(..., ge=1, le=10, description="Severity rating from 1 to 10")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude of the incident")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude of the incident")
    description: str = Field(..., description="Raw incident description or dispatch report")
    resources_needed: List[str] = Field(
        ...,
        description="List of resources needed (e.g. ['food', 'water', 'medical', 'rescue'])"
    )

    @model_validator(mode="before")
    @classmethod
    def map_legacy_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            # Map legacy severity_scale -> severity_level
            if "severity_level" not in data and "severity_scale" in data:
                data["severity_level"] = data["severity_scale"]
            # Map legacy requested_resources -> resources_needed
            if "resources_needed" not in data:
                if "requested_resources" in data:
                    req = data["requested_resources"]
                    if isinstance(req, dict):
                        data["resources_needed"] = [f"{k}:{v}" for k, v in req.items()]
                    elif isinstance(req, list):
                        data["resources_needed"] = req
                else:
                    data["resources_needed"] = []
            # Fallback for reporter_name if legacy sender or anonymous
            if "reporter_name" not in data:
                data["reporter_name"] = data.get("sender") or "Anonymous"
            if "description" not in data:
                data["description"] = ""
        return data

    @property
    def location(self) -> str:
        return f"({self.latitude:.4f}, {self.longitude:.4f})"

    @property
    def severity_scale(self) -> int:
        return self.severity_level

    @property
    def affected_count(self) -> int:
        return 0

    @property
    def requested_resources(self) -> Dict[str, int]:
        res: Dict[str, int] = {}
        for item in self.resources_needed:
            if not isinstance(item, str):
                continue
            item_clean = item.strip()
            match = re.match(r"^([a-zA-Z_]+)\s*[:=]\s*(\d+)$", item_clean)
            if match:
                res[match.group(1).lower()] = int(match.group(2))
            elif item_clean:
                res[item_clean.lower()] = 10
        return res


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
