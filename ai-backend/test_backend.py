import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from main import app
from models import IncidentCreate, TriageAssessment
from services.allocation_engine import allocation_engine
from services.firestore_service import firestore_service


@pytest.fixture
def client():
    # Reset in-memory states before each test run
    allocation_engine.set_inventory({
        "food": 1000,
        "water": 2000,
        "medical": 500,
        "rescue": 50
    })
    firestore_service._mock_incidents.clear()
    firestore_service._mock_allocations.clear()
    firestore_service._mock_audit_logs.clear()
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_post_incident_pipeline(client):
    """Verifies standard /api/incidents ingestion with triage, allocation, and dispatch."""
    payload = {
        "disaster_type": "earthquake",
        "description": "Severe earthquake magnitude 7.2. Multiple residential buildings collapsed, people trapped.",
        "severity_scale": 9,
        "latitude": 37.7749,
        "longitude": -122.4194,
        "location": "Downtown San Francisco",
        "affected_count": 120,
        "requested_resources": {
            "food": 200,
            "water": 400,
            "medical": 50,
            "rescue": 20
        }
    }

    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "incident_id" in data
    assert data["incident"]["disaster_type"] == "earthquake"
    assert data["incident"]["location"] == "Downtown San Francisco"

    # Triage checks
    triage = data["triage"]
    assert triage["urgency_level"] == "Critical"
    assert triage["calculated_priority"] >= 80
    assert triage["is_duplicate"] is False

    # Allocation checks
    allocation = data["allocation"]
    assert allocation["allocated_resources"]["rescue"] == 20
    assert allocation["allocated_med_kits"] == 50
    assert allocation["allocated_rescue_teams"] == 20
    assert allocation["status"] == "Active"
    assert len(allocation["dispatch_message"]) > 0


def test_legacy_report_incident_route(client):
    """Verifies backward compatibility route /api/report-incident."""
    payload = {
        "disaster_type": "wildfire",
        "description": "Rapid wildfire approaching hills.",
        "severity_scale": 7,
        "latitude": 34.0522,
        "longitude": -118.2437,
        "location": "Malibu Hills",
        "affected_count": 50,
        "requested_resources": {"food": 100, "water": 200, "medical": 15, "rescue": 5}
    }
    response = client.post("/api/report-incident", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["incident"]["disaster_type"] == "wildfire"
    assert data["allocation"]["priority_score"] >= 60


def test_proximity_deduplication(client):
    """Verifies that an incident reported within 500m of an existing one is flagged as duplicate."""
    # First report
    inc1 = {
        "disaster_type": "flood",
        "description": "River overflowing at Main Bridge",
        "severity_scale": 8,
        "latitude": 29.7604,
        "longitude": -95.3698,
        "location": "Main Bridge",
        "affected_count": 40,
        "requested_resources": {"rescue": 5}
    }
    res1 = client.post("/api/incidents", json=inc1)
    assert res1.status_code == 200
    assert res1.json()["triage"]["is_duplicate"] is False

    # Second report ~100m away (lat delta ~0.0009 deg)
    inc2 = {
        "disaster_type": "flood",
        "description": "Water rising rapidly near bridge pier",
        "severity_scale": 8,
        "latitude": 29.7610,
        "longitude": -95.3698,
        "location": "Bridge Pier",
        "affected_count": 30,
        "requested_resources": {"rescue": 5}
    }
    res2 = client.post("/api/incidents", json=inc2)
    assert res2.status_code == 200
    assert res2.json()["triage"]["is_duplicate"] is True


def test_sms_webhook_ingestion(client):
    """Verifies offline SMS fallback webhook endpoint /api/sms/webhook."""
    sms_payload = {
        "body": "flood, 8, 29.7604, -95.3698, food:150 water:300 medical:25 rescue:8, North Levee Sector 4",
        "sender": "+15550198234"
    }
    response = client.post("/api/sms/webhook", json=sms_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["incident"]["disaster_type"] == "flood"
    assert data["incident"]["severity_scale"] == 8
    assert data["incident"]["latitude"] == 29.7604
    assert data["incident"]["requested_resources"]["food"] == 150
    assert data["incident"]["requested_resources"]["rescue"] == 8
    assert "North Levee" in data["incident"]["location"]

    # Allocation verified
    assert data["allocation"]["allocated_resources"]["rescue"] == 8
    assert data["allocation"]["allocated_rescue_teams"] == 8
    assert data["allocation"]["allocated_med_kits"] == 25
    assert len(data["allocation"]["dispatch_message"]) > 0


def test_allocation_shortfall_and_stock_limits(client):
    """Verifies deterministic math engine does not allocate beyond available inventory."""
    allocation_engine.set_inventory({
        "food": 20,
        "water": 40,
        "medical": 10,
        "rescue": 2
    })

    payload = {
        "disaster_type": "hurricane",
        "description": "Severe storm damage across city center.",
        "severity_scale": 9,
        "latitude": 25.7617,
        "longitude": -80.1918,
        "location": "City Center",
        "affected_count": 200,
        "requested_resources": {
            "food": 100,
            "water": 200,
            "medical": 50,
            "rescue": 10
        }
    }

    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 200
    alloc = response.json()["allocation"]

    # Capacity limits enforced
    assert alloc["allocated_resources"]["food"] == 20
    assert alloc["shortfall"]["food"] == 80
    assert alloc["allocated_resources"]["rescue"] == 2
    assert alloc["shortfall"]["rescue"] == 8
    assert alloc["allocated_med_kits"] == 10
    assert alloc["allocated_rescue_teams"] == 2


def test_get_allocations_flattened_dashboard_keys(client):
    """Verifies /api/allocations returns flattened keys needed by React/Flutter dashboard."""
    payload = {
        "disaster_type": "landslide",
        "description": "Mountain road buried.",
        "severity_scale": 6,
        "latitude": 45.5152,
        "longitude": -122.6784,
        "location": "Route 9 Pass",
        "affected_count": 15,
        "requested_resources": {"medical": 5, "rescue": 2}
    }
    client.post("/api/incidents", json=payload)

    get_res = client.get("/api/allocations")
    assert get_res.status_code == 200
    allocations = get_res.json()
    assert len(allocations) >= 1

    first = allocations[0]
    # Check flattened keys
    assert "priority_score" in first
    assert "allocated_med_kits" in first
    assert "allocated_rescue_teams" in first
    assert "dispatch_message" in first
    assert "location" in first
    assert "category" in first


def test_get_audit_logs_chronological(client):
    """Verifies chronological audit logs retrieval."""
    payload = {
        "disaster_type": "tornado",
        "description": "Funnel cloud touching down.",
        "severity_scale": 7,
        "latitude": 35.4676,
        "longitude": -97.5164,
        "location": "District 3",
        "affected_count": 45,
        "requested_resources": {"medical": 10}
    }
    post_res = client.post("/api/incidents", json=payload)
    assert post_res.status_code == 200
    incident_id = post_res.json()["incident_id"]

    log_res = client.get("/api/audit-logs")
    assert log_res.status_code == 200
    logs = log_res.json()
    assert isinstance(logs, list)
    matching = [l for l in logs if l.get("incident_id") == incident_id]
    assert len(matching) >= 2
    event_types = [l["event_type"] for l in matching]
    assert "TRIAGE_COMPLETED" in event_types
    assert "ALLOCATION_COMMITTED" in event_types


def test_generate_endpoint_groq_success(client):
    """Verifies Attempt 1: Groq produces output and returns provider='groq'."""
    with patch("services.gemini_service.gemini_service.generate_text_fallback", return_value={"provider": "groq", "response": "Test groq response"}):
        res = client.post("/generate", json={"prompt": "Emergency report"})
        assert res.status_code == 200
        data = res.json()
        assert data["provider"] == "groq"
        assert data["response"] == "Test groq response"


def test_generate_endpoint_gemini_fallback(client):
    """Verifies Attempt 2: Gemini fallback is returned when Groq fails."""
    with patch("services.gemini_service.gemini_service.generate_text_fallback", return_value={"provider": "gemini", "response": "Test gemini response"}):
        res = client.post("/generate", json={"prompt": "Emergency report"})
        assert res.status_code == 200
        data = res.json()
        assert data["provider"] == "gemini"
        assert data["response"] == "Test gemini response"


def test_generate_endpoint_all_providers_down(client):
    """Verifies 500 status code when all providers are down."""
    with patch("services.gemini_service.gemini_service.generate_text_fallback", side_effect=RuntimeError("All down")):
        res = client.post("/generate", json={"prompt": "Emergency report"})
        assert res.status_code == 500
        assert "All AI providers are currently down" in res.json()["detail"]


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main(["-v", __file__]))

