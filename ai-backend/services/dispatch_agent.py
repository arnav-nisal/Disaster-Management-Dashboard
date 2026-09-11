from models import IncidentCreate, TriageAssessment, AllocationPlan
from services.gemini_service import gemini_service


class DispatchAgent:
    """
    Uses Gemini 2.5 Flash (or deterministic fallback template)
    to generate concise, 1-sentence tactical dispatch briefs for rescue crews
    based on the AllocationPlan output.
    """

    def generate_dispatch_message(
        self,
        incident: IncidentCreate,
        triage: TriageAssessment,
        allocation: AllocationPlan
    ) -> str:
        loc = getattr(incident, "location", None) or f"({incident.latitude:.4f}, {incident.longitude:.4f})"
        brief = gemini_service.generate_dispatch_brief(
            category=incident.disaster_type,
            location=loc,
            allocated=allocation.allocated_resources,
            shortfall=allocation.shortfall,
            priority=triage.calculated_priority
        )
        return brief


dispatch_agent = DispatchAgent()
