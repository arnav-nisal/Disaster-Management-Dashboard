# 🚨 Disaster Resource Allocation & AI Multi-Provider Backend

A robust, production-ready FastAPI microservice designed for real-time disaster incident ingestion, multi-model AI triage, deterministic resource allocation, tactical first-responder dispatch briefing, append-only audit logging, and offline emergency SMS parsing.

---

## 🌟 Key Features & Architectural Highlights

### 1. Multi-Model AI Cascading Fallback (`/generate` & Incident Triage)
Ensures zero-downtime AI triage and tactical briefing with a cascading multi-tier failover:
- **Attempt 1 (Primary / Ultra Low Latency)**: **Groq** (supporting `openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, and `qwen/qwen3.8-27b`).
- **Attempt 2 (First Fallback)**: **Google GenAI** (supporting `gemini-3.6-flash`, `gemini-flash-latest`, and `gemini-2.5-flash`).
- **Attempt 3 (Second Fallback)**: **NVIDIA NIM** via `meta/llama-3.1-70b-instruct` (hosted on `https://integrate.api.nvidia.com/v1`).
- **Emergency Final Fallback**: Deterministic rule-based scoring engine that computes priority, urgency, and resource requirements even during complete network or API provider outages.

### 2. Strict Frontend Data Schema with Backward Compatibility
- Strictly matches the exact payload sent by the frontend:
  `{reporter_name: str, disaster_type: str, severity_level: int, latitude: float, longitude: float, description: str, resources_needed: list[str]}`.
- Includes a Pydantic `model_validator` that seamlessly accepts legacy payload formats (e.g., `severity_scale`, `requested_resources`) and maps them automatically, preventing breakages across different dashboard versions or offline relays.

### 3. Deterministic Resource Allocation Engine
- **No LLM Math Hallucination**: Pure Python integer arithmetic tracks inventory, allocations, and shortfalls.
- **Priority Tier Stock Protection**:
  - `Critical`: 100% available stock can be committed.
  - `High` / `Medium` / `Low`: Automatically protects a 20% emergency buffer in depot reserves for critical escalations.
- **Dynamic Shortfall Computation**: Accurately tracks unmet demand when requested supplies exceed remaining depot inventory.

### 4. 500m Proximity Incident De-duplication
- Implements the great-circle **Haversine distance formula** (`6371000m` Earth radius).
- Flags incidents of the same disaster category reported within a **500-meter radius** as duplicates to prevent double-allocation of emergency personnel.

### 5. Tactical First-Responder Dispatch Briefs
- The `DispatchAgent` synthesizes incident category, coordinates/location, allocated assets, and shortfall into a concise, actionable 1-sentence tactical dispatch brief for emergency responders.

### 6. Offline SMS Webhook Gateway (`POST /api/sms/webhook`)
- Parses comma-delimited raw SMS messages (`DISASTER_TYPE, SEVERITY, LAT, LONG, NEEDS [, LOCATION]`) received via SMS gateways or satellite relays when cellular internet or Wi-Fi infrastructure collapses.

### 7. Dual-Mode Storage (Firestore & Thread-Safe In-Memory Mock)
- Connects to Google Cloud Firestore when `firebase-secret.json` is supplied.
- Automatically falls back to a thread-safe, lock-protected in-memory mock repository if credentials are not configured, enabling zero-configuration local development and deterministic CI testing.
- Formats `/api/allocations` with flattened top-level keys for instant React and Flutter dashboard consumption.

---

## 🏗️ Architecture & Project Structure

```text
ai-backend/
├── main.py                  # FastAPI application entrypoint, CORS, /health, /generate
├── models.py                # Pydantic schemas (IncidentCreate, TriageAssessment, AllocationPlan, AuditLogRecord)
├── routes/
│   ├── incidents.py         # Primary pipeline: /api/incidents, /api/report-incident, /api/allocations, /api/audit-logs
│   └── sms.py               # Offline gateway: /api/sms/webhook
├── services/
│   ├── gemini_service.py    # Multi-provider AI cascade (Groq -> Gemini -> NVIDIA NIM -> Rule-based)
│   ├── allocation_engine.py # Deterministic resource math, inventory tracking & Haversine proximity check
│   ├── dispatch_agent.py    # 1-sentence tactical first-responder dispatch brief generator
│   └── firestore_service.py # Firestore CRUD + flattened dashboard keys + thread-safe in-memory fallback
├── test_backend.py          # Automated Pytest suite (12 test cases covering full functionality)
├── requirements.txt         # Pinned Python dependencies
├── .env.example             # Template for API credentials and Firebase paths
└── README.md                # System documentation
```

---

## 🔄 End-to-End Incident Lifecycle Pipeline

When an incident report arrives via `POST /api/incidents`:
```
┌─────────────────────────┐
│ Frontend / Client POST  │  --> {reporter_name, disaster_type, severity_level, latitude, longitude, description, resources_needed}
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 1. Pydantic Validation  │  --> Validates exact types and ranges (severity 1-10, lat/long, resources_needed)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Proximity Dedup      │  --> Haversine calculation against existing incidents within 500m radius
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Multi-AI Triage      │  --> Groq (Llama-3.3) -> Gemini 2.0 Flash -> NVIDIA NIM -> Deterministic Rule-Based
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Audit Log Triage     │  --> Appends immutable TRIAGE_COMPLETED record with priority score & verified needs
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Resource Allocation  │  --> Deterministic Python inventory math, stock decrements, tier reserves, shortfall tracking
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 6. Dispatch Briefing    │  --> Tactical 1-sentence brief synthesized for first-responder deployment
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 7. Audit Log Dispatch   │  --> Appends immutable ALLOCATION_COMMITTED record
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 8. Response & Storage   │  --> Persisted to Firestore / In-Memory Mock; returns structured IncidentResponse
└─────────────────────────┘
```

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- **Python 3.10+** (tested on Python 3.12 & 3.14)
- **Git**

### 2. Environment Setup
```powershell
# Navigate to ai-backend directory
cd ai-backend

# Create virtual environment
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

Configure your credentials in `.env`:
```ini
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
NVIDIA_API_KEY=nvapi-your_nvidia_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CREDENTIALS_PATH=firebase-secret.json
```

> **Resilience Guarantee**: If any or all API keys or Firebase credentials are not provided, the service **gracefully falls back** to the local thread-safe mock repository and deterministic rule-based triage without throwing unhandled exceptions.

---

## 🧪 Running the Test Suite

Run the full automated test suite using `pytest`:
```powershell
# From the ai-backend folder with venv:
.\venv\Scripts\python.exe -m pytest -v test_backend.py
```

### Verified Test Cases (12 / 12 Passing)
| Test Case | Description |
|---|---|
| `test_health_endpoint` | Verifies `/health` returns status `ok` and service name |
| `test_post_incident_pipeline` | Validates full ingestion, triage scoring, inventory deduction, and dispatch |
| `test_legacy_report_incident_route` | Confirms `/api/report-incident` backward compatibility alias route |
| `test_proximity_deduplication` | Confirms incidents within 500m are flagged as duplicate |
| `test_sms_webhook_ingestion` | Verifies offline comma-delimited SMS parsing and emergency allocation |
| `test_allocation_shortfall_and_stock_limits` | Tests inventory boundaries and verifies shortfall math |
| `test_get_allocations_flattened_dashboard_keys` | Ensures dashboard compatibility keys exist at root level |
| `test_get_audit_logs_chronological` | Verifies chronological, immutable audit logging |
| `test_generate_endpoint_groq_success` | Tests primary Groq provider for `/generate` |
| `test_generate_endpoint_gemini_fallback` | Tests automatic failover to Gemini when Groq fails |
| `test_generate_endpoint_all_providers_down` | Tests clean 500 status when all external providers fail |
| `test_exact_frontend_schema_ingestion` | Validates exact JSON schema matching `{reporter_name, disaster_type, severity_level, latitude, longitude, description, resources_needed}` |

---

## 🖥️ Running the API Server

Start the local server with Uvicorn:
```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
- **Interactive ReDoc UI**: `http://127.0.0.1:8000/redoc`
- **Health Check**: `http://127.0.0.1:8000/health`

---

## 📡 API Reference & Schema Documentation

### 1. Ingest Incident Report
`POST /api/incidents` *(or alias `POST /api/report-incident`)*

**Request Payload**:
```json
{
  "reporter_name": "Jane Doe",
  "disaster_type": "flood",
  "severity_level": 8,
  "latitude": 29.7604,
  "longitude": -95.3698,
  "description": "Flash flooding in residential district, people trapped on rooftops.",
  "resources_needed": ["food", "water", "rescue"]
}
```

> **Note on `resources_needed`**: Supports both simple resource names (`["food", "water", "medical", "rescue"]`) and quantity-annotated items (`["food: 100", "water: 200", "medical: 25", "rescue: 8"]`).

**Response Payload (HTTP 200)**:
```json
{
  "incident_id": "inc_3a8b9c0d1e",
  "incident": {
    "reporter_name": "Jane Doe",
    "disaster_type": "flood",
    "severity_level": 8,
    "latitude": 29.7604,
    "longitude": -95.3698,
    "description": "Flash flooding in residential district, people trapped on rooftops.",
    "resources_needed": ["food", "water", "rescue"]
  },
  "triage": {
    "calculated_priority": 86,
    "urgency_level": "Critical",
    "verified_needs": {
      "food": 160,
      "water": 320,
      "medical": 0,
      "rescue": 16
    },
    "is_duplicate": false,
    "reasoning": "Rule-based triage applied: Severity 8/10, Reporter: Jane Doe, Priority: 86/100."
  },
  "allocation": {
    "incident_id": "inc_3a8b9c0d1e",
    "location": "(29.7604, -95.3698)",
    "priority_score": 86,
    "category": "flood",
    "allocated_resources": {
      "food": 160,
      "water": 320,
      "medical": 0,
      "rescue": 16
    },
    "allocated_med_kits": 0,
    "allocated_rescue_teams": 16,
    "shortfall": {
      "food": 0,
      "water": 0,
      "medical": 0,
      "rescue": 0
    },
    "dispatch_message": "Deploy emergency units immediately to (29.7604, -95.3698) for flood response with committed assets (food: 160, water: 320, rescue: 16) under Priority 86 protocol.",
    "status": "Active",
    "timestamp": "2026-09-12T03:40:00.000000+00:00"
  },
  "timestamp": "2026-09-12T03:40:00.000000+00:00"
}
```

---

### 2. Offline SMS Ingestion Gateway
`POST /api/sms/webhook`

Ingests offline SMS text reports when internet connectivity is down.

**Request Payload**:
```json
{
  "body": "flood, 8, 29.7604, -95.3698, food:150 water:300 medical:25 rescue:8, North Levee Sector 4",
  "sender": "+15550198234"
}
```

**Format**: `DISASTER_TYPE, SEVERITY, LATITUDE, LONGITUDE, NEEDS [, LOCATION/NOTES]`

---

### 3. Retrieve Active Allocations (Dashboard-Ready)
`GET /api/allocations`

Returns all active resource allocations with flattened top-level attributes for immediate rendering by React and Flutter UI components:

**Response Payload (HTTP 200)**:
```json
[
  {
    "incident_id": "inc_3a8b9c0d1e",
    "priority_score": 86,
    "category": "flood",
    "location": "(29.7604, -95.3698)",
    "status": "Active",
    "allocated_med_kits": 0,
    "allocated_rescue_teams": 16,
    "allocated_resources": { "food": 160, "water": 320, "medical": 0, "rescue": 16 },
    "shortfall": { "food": 0, "water": 0, "medical": 0, "rescue": 0 },
    "dispatch_message": "Deploy emergency units immediately to (29.7604, -95.3698)...",
    "timestamp": "2026-09-12T03:40:00.000000+00:00"
  }
]
```

---

### 4. Append-Only Audit Trail
`GET /api/audit-logs`

Retrieves chronological event logs documenting all critical lifecycle actions:
- `TRIAGE_COMPLETED`: Initial risk calculation, urgency assignment, and verified demand.
- `ALLOCATION_COMMITTED`: Committed resources, shortfalls, and generated dispatch instructions.
- `SMS_TRIAGE_COMPLETED` / `SMS_DISPATCH_COMMITTED`: Offline SMS ingestion trail.

---

### 5. Multi-Provider AI Text Generation
`POST /generate`

Direct access to the multi-provider text generation cascade:

**Request Payload**:
```json
{
  "prompt": "Summarize standard evacuation protocol for an urban flood."
}
```

**Response Payload (HTTP 200)**:
```json
{
  "provider": "groq",
  "response": "1. Move immediately to higher ground...\n2. Avoid walking or driving through flood waters...\n3. Disconnect electrical appliances..."
}
```

---

## 🔒 Security & Concurrency Design
- **Zero Secrets in Code**: All API keys, credentials, and project identifiers are loaded via `.env`.
- **Concurrency Safety**: Thread-safe mutexes (`threading.Lock`) guard the in-memory inventory depot, allocation tables, and audit logs against race conditions.
- **Git Hygiene**: `.gitignore` strictly blocks environment files, credential JSONs, virtual environments, and build artifacts from ever being committed.
