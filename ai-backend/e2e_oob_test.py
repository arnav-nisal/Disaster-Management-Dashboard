import time
import requests
from fastapi.testclient import TestClient
from main import app
from services.allocation_engine import allocation_engine
from services.firestore_service import firestore_service
from services.oob_sms_service import idempotency_store, deserialize_oob_message

def run_comprehensive_e2e_test():
    print("=" * 80)
    print("STARTING FULL END-TO-END VERIFICATION: OUT-OF-BAND (OOB) SMS FALLBACK")
    print("=" * 80)

    # 1. Reset state
    allocation_engine.set_inventory({"food": 500, "water": 1000, "medical": 200, "rescue": 50})
    firestore_service._mock_incidents.clear()
    firestore_service._mock_allocations.clear()
    firestore_service._mock_audit_logs.clear()
    idempotency_store.clear()

    client = TestClient(app)

    # -------------------------------------------------------------
    # STEP 1: MOBILE CLIENT COMPRESSION SIMULATION
    # -------------------------------------------------------------
    print("\n[STEP 1] Mobile Payload Serialization & Compression Simulation")
    entity_id = "inc_demo_98765"
    action = "update_status"
    status = "completed"

    # Emulate the mobile compressActionPayload logic
    epoch_hex = hex(int(time.time()))[2:].upper()
    nonce_hex = "F1A4"
    compressed_sms = f"OOB:UST:{entity_id}:CMP:{epoch_hex}:{nonce_hex}"
    print(f"  -> Original Action JSON: {{'action': '{action}', 'entityId': '{entity_id}', 'status': '{status}'}}")
    print(f"  -> Compressed GSM SMS:   '{compressed_sms}'")
    print(f"  -> Total Character Count: {len(compressed_sms)} chars (Limit is 160). Safe: {len(compressed_sms) <= 160}")
    assert len(compressed_sms) <= 160

    # -------------------------------------------------------------
    # STEP 2: CREATE INITIAL INCIDENT IN BACKEND
    # -------------------------------------------------------------
    print("\n[STEP 2] Create an Active Incident & Allocation on Backend")
    incident_payload = {
        "disaster_type": "flood",
        "description": "Critical flooding in residential sector 5, rescue underway",
        "severity_scale": 8,
        "latitude": 29.7604,
        "longitude": -95.3698,
        "location": "Downtown Sector 5",
        "affected_count": 60,
        "requested_resources": {"rescue": 6, "medical": 15}
    }
    create_res = client.post("/api/incidents", json=incident_payload)
    assert create_res.status_code == 200, f"Failed to create incident: {create_res.text}"
    created_incident = create_res.json()
    actual_incident_id = created_incident["incident_id"]
    print(f"  -> Incident Created: {actual_incident_id}")
    print(f"  -> Initial Status:    {created_incident['allocation']['status']}")
    assert created_incident["allocation"]["status"] == "Active"

    # -------------------------------------------------------------
    # STEP 3: TEXTBEE WEBHOOK INGESTION (SIMULATED SMS FROM SPARE PHONE)
    # -------------------------------------------------------------
    print("\n[STEP 3] Simulate Spare Phone Textbee Gateway Forwarding SMS via Webhook")
    sms_epoch_hex = hex(int(time.time()))[2:].upper()
    valid_sms = f"OOB:UST:{actual_incident_id}:CMP:{sms_epoch_hex}:8B3C"
    
    textbee_payload = {
        "smsId": "textbee_sms_msg_001",
        "sender": "+15559876543",
        "message": valid_sms,
        "webhookEvent": "MESSAGE_RECEIVED"
    }
    webhook_res = client.post("/api/oob/textbee-webhook", json=textbee_payload)
    assert webhook_res.status_code == 200, f"Webhook failed: {webhook_res.text}"
    wb_data = webhook_res.json()
    print(f"  -> Webhook Response Status: {wb_data['status']}")
    print(f"  -> Unpacked Action:         {wb_data['action']}")
    print(f"  -> Target Entity ID:        {wb_data['entity_id']}")
    print(f"  -> New Status:              {wb_data['new_status']}")
    print(f"  -> Idempotency Key:         {wb_data['idempotency_key']}")
    assert wb_data["status"] == "PROCESSED"
    assert wb_data["new_status"] == "completed"

    # Verify Incident and Allocation were mutated in store
    inc_record = firestore_service.get_incident(actual_incident_id)
    assert inc_record["status"] == "Completed"
    alloc_records = firestore_service.list_allocations()
    matching_alloc = [a for a in alloc_records if a.get("incident_id") == actual_incident_id][0]
    assert matching_alloc["status"] == "Completed"
    print(f"  -> Verified Incident In-Memory Status:   {inc_record['status']}")
    print(f"  -> Verified Allocation In-Memory Status: {matching_alloc['status']}")

    # -------------------------------------------------------------
    # STEP 4: IDEMPOTENCY & REPLAY ATTACK PREVENTION
    # -------------------------------------------------------------
    print("\n[STEP 4] Verify Idempotency Protection (Simulate Duplicate SMS Re-delivery)")
    dup_res = client.post("/api/oob/textbee-webhook", json=textbee_payload)
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    print(f"  -> Duplicate Response Status: {dup_data['status']}")
    print(f"  -> Rejection Message:        {dup_data['message']}")
    assert dup_data["status"] == "DUPLICATE_IGNORED"

    # -------------------------------------------------------------
    # STEP 5: GATEWAY EVENT & PROTOCOL FILTERING
    # -------------------------------------------------------------
    print("\n[STEP 5] Filter Non-OOB SMS & Gateway Lifecycle Events")
    # A. Non-MESSAGE_RECEIVED event (e.g. gateway battery notification or SMS_SENT)
    res_event_filter = client.post("/api/oob/textbee-webhook", json={
        "smsId": "textbee_sms_msg_002",
        "sender": "+15559876543",
        "message": valid_sms,
        "webhookEvent": "DEVICE_CONNECTED"
    })
    print(f"  -> Non-MESSAGE_RECEIVED handled: {res_event_filter.json()['status']}")
    assert res_event_filter.json()["status"] == "IGNORED"

    # B. Ordinary text message sent to gateway SIM
    res_msg_filter = client.post("/api/oob/textbee-webhook", json={
        "smsId": "textbee_sms_msg_003",
        "sender": "+15551230000",
        "message": "Hey, what time is the team standup today?",
        "webhookEvent": "MESSAGE_RECEIVED"
    })
    print(f"  -> Non-OOB SMS chatter handled:   {res_msg_filter.json()['status']}")
    assert res_msg_filter.json()["status"] == "IGNORED"

    # -------------------------------------------------------------
    # STEP 6: VERIFY AUDIT TRAIL LOGGING
    # -------------------------------------------------------------
    print("\n[STEP 6] Audit Trail Verification")
    audit_res = client.get("/api/audit-logs")
    logs = audit_res.json()
    oob_audit_records = [l for l in logs if l.get("event_type") == "OOB_SMS_STATE_UPDATE"]
    print(f"  -> Found {len(oob_audit_records)} OOB audit log record(s):")
    for r in oob_audit_records:
        print(f"     [Audit ID: {r['log_id']}] Timestamp: {r['timestamp']} | Details: {r['details']}")
    assert len(oob_audit_records) >= 1
    assert oob_audit_records[0]["details"]["sender"] == "+15559876543"

    print("\n" + "=" * 80)
    print("ALL 6 PHASES PASSED WITH 100% SUCCESS!")
    print("=" * 80)

if __name__ == "__main__":
    run_comprehensive_e2e_test()
