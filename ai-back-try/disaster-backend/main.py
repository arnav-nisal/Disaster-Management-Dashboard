# main.py
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, BackgroundTasks
from contextlib import asynccontextmanager
from schemas import IncidentReport

# 1. Initialize Firebase Admin SDK
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# 2. Define the background AI processing logic
def process_new_incident(incident_id: str, incident_data: dict):
    print(f"AI Agents processing incident: {incident_id}")
    
    # Eshan's CrewAI logic goes here. 
    # For now, we simulate the AI's output:
    mock_ai_decision = {
        "priority_score": 85,
        "dispatched_resources": {"medical_kits": 50, "rescue_teams": 2},
        "status": "Dispatched"
    }
    
    # Write the AI decision to the allocations collection for the React dashboard
    db.collection('allocations').document(incident_id).set(mock_ai_decision)
    print(f"Allocation complete for {incident_id}")

# 3. Define the Firebase Real-Time Listener
def on_incident_snapshot(doc_snapshot, changes, read_time):
    for change in changes:
        if change.type.name == 'ADDED':
            # Triggered whenever a new report is added from Flutter
            incident_id = change.document.id
            incident_data = change.document.to_dict()
            process_new_incident(incident_id, incident_data)

# 4. Attach listener to FastAPI lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start listening to the 'incidents' collection on startup
    incidents_ref = db.collection('incidents')
    watch = incidents_ref.on_snapshot(on_incident_snapshot)
    yield
    # Stop listening on shutdown
    watch.unsubscribe()

# 5. Initialize App
app = FastAPI(lifespan=lifespan)

# 6. Manual trigger endpoint (Optional, for testing without Flutter)
@app.post("/test-incident/")
async def create_test_incident(incident: IncidentReport):
    # This pushes to Firebase, which will immediately trigger the listener above
    doc_ref = db.collection('incidents').document()
    doc_ref.set(incident.model_dump())
    return {"message": "Test incident added to Firestore", "id": doc_ref.id}