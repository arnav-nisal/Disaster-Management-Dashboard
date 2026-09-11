# schemas.py
from pydantic import BaseModel
from typing import List

# What the Flutter app sends
class IncidentReport(BaseModel):
    disaster_type: str
    severity_level: int
    location: str
    requested_resources: List[str]

# What the AI agent outputs
class AllocationDecision(BaseModel):
    incident_id: str
    priority_score: int
    dispatched_resources: dict
    status: str