# 🚨 Disaster Resource Allocation & AI Multi-Provider Backend

A robust, high-performance FastAPI microservice designed for real-time disaster incident ingestion, multi-model AI triage, deterministic resource allocation, tactical dispatch briefing, and offline emergency SMS parsing.

---

## 🌟 Key Features

1. **Multi-Model AI Cascading Fallback** (`/generate` & Triage):
   - **Attempt 1 (Main Model)**: **Groq** via `llama-3.3-70b-versatile` for ultra-low-latency responses.
   - **Attempt 2 (First Fallback)**: **Google GenAI** via `gemini-2.0-flash` / `gemini-2.5-flash`.
   - **Attempt 3 (Final Fallback)**: **NVIDIA NIM** via `meta/llama-3.1-70b-instruct` (`https://integrate.api.nvidia.com/v1`).
   - **Emergency Fallback**: Deterministic rule-based scoring engine if all external AI services are unreachable.

2. **Deterministic Resource Allocation Engine**:
   - **No LLM math hallucination**: Strict, deterministic Python balancing supply against demand.
   - Priority tier reservations (`Critical` > `High` > `Medium` > `Low`) preserving emergency depot reserves for severe zones.
   - Accurate partial-allocation and shortfall tracking.

3. **500m Proximity De-duplication**:
   - Uses the Haversine distance formula to flag duplicate incident reports of the same disaster type within a **500-meter radius**.

4. **Tactical First-Responder Dispatch Briefs**:
   - Automatically generates concise, 1-sentence tactical action briefs for emergency units and field rescue teams.

5. **Offline SMS Webhook Gateway** (`POST /api/sms/webhook`):
   - Ingests comma-delimited offline SMS strings from SMS relays/Twilio (`DISASTER, SEVERITY, LAT, LONG, NEEDS [, LOCATION]`) when cellular data and Wi-Fi networks fail.

6. **Frontend Dashboard Compatibility (React & Flutter)**:
   - Global CORS support (`allow_origins=["*"]`).
   - Returns flattened top-level keys (`priority_score`, `allocated_med_kits`, `allocated_rescue_teams`, `dispatch_message`, `location`, `category`) inside `/api/allocations`.
   - Graceful in-memory mock repository fallback if `firebase-secret.json` is not provided.

---

## 🏗️ Architecture & Project Structure

```text
ai-backend/
├── main.py                  # FastAPI app, global CORS, /health, /generate
├── models.py                # Pydantic data schemas (Incidents, Triage, Allocations, Logs)
├── routes/
│   ├── incidents.py         # /api/incidents, /api/report-incident, /api/allocations, /api/audit-logs
│   └── sms.py               # /api/sms/webhook (offline SMS gateway parser)
├── services/
│   ├── gemini_service.py    # Multi-AI cascading service (Groq -> Gemini -> NVIDIA NIM -> Rule-based)
│   ├── allocation_engine.py # Deterministic math engine + 500m proximity de-duplication
│   ├── dispatch_agent.py    # 1-sentence tactical dispatch brief generator
│   └── firestore_service.py # Firestore CRUD + flattened keys + in-memory mock fallback
├── test_backend.py          # Automated Pytest suite (11 test cases)
├── requirements.txt         # Project dependencies
├── .env.example             # Template for API credentials
└── .gitignore               # Comprehensive exclusion for venv, secrets, caches
```

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Git

### 2. Environment Setup
```powershell
# Navigate to ai-backend
cd ai-backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file from `.env.example`:
```powershell
cp .env.example .env
```
Fill in your API keys in `.env`:
```ini
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
NVIDIA_API_KEY=nvapi-...
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CREDENTIALS_PATH=firebase-secret.json
```
> **Note**: If API keys or Firebase credentials are not provided, the backend **will not crash**. It will automatically fallback to the local in-memory database and rule-based triage.

---

## 🧪 Running Tests

Run the programmatic test suite:
```powershell
# Direct Python execution
.\venv\Scripts\python.exe test_backend.py

# Or via pytest directly
.\venv\Scripts\pytest.exe -v test_backend.py
```

All 11 tests execute in `< 0.2s` with mock network isolation:
- `test_health_endpoint`
- `test_post_incident_pipeline`
- `test_legacy_report_incident_route`
- `test_proximity_deduplication` (500m radius check)
- `test_sms_webhook_ingestion`
- `test_allocation_shortfall_and_stock_limits`
- `test_get_allocations_flattened_dashboard_keys`
- `test_get_audit_logs_chronological`
- `test_generate_endpoint_groq_success`
- `test_generate_endpoint_gemini_fallback`
- `test_generate_endpoint_all_providers_down`

---

## 🖥️ Running the API Server

Start the local development server:
```powershell
.\venv\Scripts\uvicorn.exe main:app --reload --port 8000
```
- **Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 📡 API Reference & Examples

### 1. Ingest Incident Report
`POST /api/incidents` *(or legacy alias `POST /api/report-incident`)*

**Request Body**:
```json
{
  "disaster_type": "flood",
  "description": "Flash flooding in residential district, 50 people trapped on roofs.",
  "severity_scale": 8,
  "latitude": 29.7604,
  "longitude": -95.3698,
  "location": "River Bridge Sector 4",
  "affected_count": 50,
  "requested_resources": {
    "food": 100,
    "water": 200,
    "rescue": 10
  }
}
```

**Response (HTTP 200)**:
```json
{
  "incident_id": "inc_a1b2c3d4e5",
  "incident": { ... },
  "triage": {
    "calculated_priority": 89,
    "urgency_level": "Critical",
    "verified_needs": { "food": 100, "water": 200, "rescue": 10 },
    "is_duplicate": false,
    "reasoning": "Severe flooding with trapped individuals; immediate water rescue required."
  },
  "allocation": {
    "incident_id": "inc_a1b2c3d4e5",
    "location": "River Bridge Sector 4",
    "priority_score": 89,
    "category": "flood",
    "allocated_resources": { "food": 100, "water": 200, "rescue": 10 },
    "allocated_med_kits": 0,
    "allocated_rescue_teams": 10,
    "shortfall": { "food": 0, "water": 0, "rescue": 0 },
    "dispatch_message": "Deploy water rescue units immediately to River Bridge Sector 4 under Priority 89 protocol.",
    "status": "Active",
    "timestamp": "2026-09-12T01:30:00Z"
  },
  "timestamp": "2026-09-12T01:30:00Z"
}
```

---

### 2. Offline SMS Ingestion
`POST /api/sms/webhook`

**Request Body**:
```json
{
  "body": "earthquake, 9, 37.7749, -122.4194, medical:25 rescue:10, Downtown Zone A",
  "sender": "+15550198234"
}
```
*Parses offline format and feeds into the primary triage & allocation pipeline.*

---

### 3. List Active Allocations (Dashboard-Ready)
`GET /api/allocations`

**Response (HTTP 200)**:
```json
[
  {
    "incident_id": "inc_a1b2c3d4e5",
    "priority_score": 89,
    "category": "flood",
    "location": "River Bridge Sector 4",
    "allocated_med_kits": 0,
    "allocated_rescue_teams": 10,
    "dispatch_message": "Deploy water rescue units immediately...",
    "status": "Active",
    "allocated_resources": { "food": 100, "water": 200, "rescue": 10 },
    "shortfall": { "food": 0, "water": 0, "rescue": 0 }
  }
]
```

---

### 4. Multi-AI Text Generation
`POST /generate`

**Request Body**:
```json
{
  "prompt": "What are the priority safety precautions during a chemical spill?"
}
```

**Response (HTTP 200)**:
```json
{
  "provider": "groq",
  "response": "1. Evacuate immediately upwind and uphill...\n2. Avoid skin contact..."
}
```
*(If Groq is down, seamlessly fails over to Gemini, then NVIDIA NIM).*

---

### 5. Append-Only Audit Logs
`GET /api/audit-logs`

Returns chronological, immutable event logs (`TRIAGE_COMPLETED`, `ALLOCATION_COMMITTED`, `SMS_DISPATCH_COMMITTED`, etc.).

---

## 🔒 Security & Best Practices
- `.gitignore` explicitly prevents committing `.env`, virtual environment folders (`venv/`), API credentials, and bytecode caches.
- No sensitive keys are hardcoded in the codebase.
- Thread-safe locks protect in-memory depots and log buffers during concurrent requests.
