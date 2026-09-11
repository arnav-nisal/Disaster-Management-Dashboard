import math
from typing import Dict, List, Any
from threading import Lock
from models import TriageAssessment, AllocationPlan


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in meters using Haversine formula."""
    if lat1 == 0.0 and lon1 == 0.0 and lat2 == 0.0 and lon2 == 0.0:
        return 0.0
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class AllocationEngine:
    """
    Deterministic resource allocation engine (strictly Python logic, no LLM for math).
    Features:
    - Checks current inventory in memory/Firestore.
    - Detects potential duplicate reports within a 500m radius of existing incidents.
    - Decrements available stock according to priority tiers (Critical > High > Medium).
    - Produces structured AllocationPlan with flattened compatibility fields.
    """

    def __init__(self, initial_inventory: Dict[str, int] = None):
        self._lock = Lock()
        self.inventory: Dict[str, int] = initial_inventory if initial_inventory is not None else {
            "food": 1000,
            "water": 2000,
            "medical": 500,
            "rescue": 50
        }

    def get_inventory(self) -> Dict[str, int]:
        with self._lock:
            return dict(self.inventory)

    def set_inventory(self, new_inventory: Dict[str, int]) -> None:
        with self._lock:
            self.inventory = dict(new_inventory)

    def check_duplicate_proximity(
        self,
        latitude: float,
        longitude: float,
        disaster_type: str,
        existing_incidents: List[Dict[str, Any]],
        radius_meters: float = 500.0
    ) -> bool:
        """
        Detects potential duplicate reports within 500m radius of existing incidents of the same or similar type.
        """
        if latitude == 0.0 and longitude == 0.0:
            return False

        for inc in existing_incidents:
            inc_data = inc.get("incident", inc)
            inc_lat = inc_data.get("latitude", 0.0)
            inc_lon = inc_data.get("longitude", 0.0)
            inc_type = inc_data.get("disaster_type", "")

            if inc_lat != 0.0 or inc_lon != 0.0:
                dist = haversine_distance_meters(latitude, longitude, inc_lat, inc_lon)
                if dist <= radius_meters and inc_type.lower() == disaster_type.lower():
                    return True

        return False

    def allocate(
        self,
        incident_id: str,
        category: str,
        location: str,
        triage: TriageAssessment,
        timestamp: str
    ) -> AllocationPlan:
        allocated = {}
        shortfall = {}

        with self._lock:
            for resource, needed in triage.verified_needs.items():
                if needed <= 0:
                    allocated[resource] = 0
                    shortfall[resource] = 0
                    continue

                available = self.inventory.get(resource, 0)

                # Prioritize critical: 100% fulfillable depot allocation
                # Medium/Low reserve 20% emergency buffer
                effective_available = available
                if triage.urgency_level in ["Low", "Medium"]:
                    reserve = int(available * 0.20)
                    effective_available = max(0, available - reserve)

                fulfillable = min(needed, effective_available)

                if fulfillable >= needed:
                    allocated[resource] = fulfillable
                    shortfall[resource] = 0
                    self.inventory[resource] = available - fulfillable
                elif fulfillable > 0:
                    allocated[resource] = fulfillable
                    shortfall[resource] = needed - fulfillable
                    self.inventory[resource] = available - fulfillable
                else:
                    allocated[resource] = 0
                    shortfall[resource] = needed

        # Compute backward compatibility flattened fields for dashboard
        allocated_med_kits = allocated.get("medical", 0)
        allocated_rescue_teams = allocated.get("rescue", 0)

        return AllocationPlan(
            incident_id=incident_id,
            location=location,
            priority_score=triage.calculated_priority,
            category=category,
            allocated_resources=allocated,
            allocated_med_kits=allocated_med_kits,
            allocated_rescue_teams=allocated_rescue_teams,
            shortfall=shortfall,
            dispatch_message="",  # Will be populated by DispatchAgent
            status="Active",
            timestamp=timestamp
        )


allocation_engine = AllocationEngine()
