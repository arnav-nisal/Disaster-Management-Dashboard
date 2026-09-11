import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from threading import Lock
from dotenv import load_dotenv

from models import AuditLogRecord

load_dotenv()
logger = logging.getLogger(__name__)

FIREBASE_AVAILABLE = False
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    pass


class FirestoreService:
    """
    Handles CRUD operations for Firestore collections:
    'incidents', 'allocations', and 'audit_logs'.
    Guarantees backward compatibility with React/Flutter dashboards by saving
    flattened keys inside 'allocations':
      - priority_score
      - allocated_med_kits
      - allocated_rescue_teams
      - dispatch_message
      - location
      - category
    Seamless fallback to in-memory repository if firebase credentials are not found.
    """

    def __init__(self):
        self._lock = Lock()
        self.use_mock = True
        self.db = None

        self._mock_incidents: Dict[str, Dict[str, Any]] = {}
        self._mock_allocations: Dict[str, Dict[str, Any]] = {}
        self._mock_audit_logs: List[Dict[str, Any]] = []

        self._init_firestore()

    def _init_firestore(self):
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-secret.json")

        if (
            FIREBASE_AVAILABLE
            and cred_path
            and os.path.exists(cred_path)
            and cred_path not in ["path/to/serviceAccountKey.json", "firebase-secret.json"]
        ):
            try:
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {"projectId": project_id})
                self.db = firestore.client()
                self.use_mock = False
                logger.info("Connected to Firestore using credentials.")
                return
            except Exception as e:
                logger.warning(f"Firestore initialization failed: {e}. Defaulting to in-memory mock.")

        logger.info("Running FirestoreService in thread-safe in-memory mock mode.")
        self.use_mock = True

    # --- Incidents ---
    def save_incident(self, incident_id: str, data: Dict[str, Any]) -> None:
        with self._lock:
            self._mock_incidents[incident_id] = data

        if not self.use_mock and self.db:
            try:
                self.db.collection("incidents").document(incident_id).set(data)
            except Exception as e:
                logger.error(f"Firestore save_incident error: {e}")

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        if not self.use_mock and self.db:
            try:
                doc = self.db.collection("incidents").document(incident_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Firestore get_incident error: {e}")

        with self._lock:
            return self._mock_incidents.get(incident_id)

    def list_incidents(self) -> List[Dict[str, Any]]:
        if not self.use_mock and self.db:
            try:
                docs = self.db.collection("incidents").stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Firestore list_incidents error: {e}")

        with self._lock:
            return list(self._mock_incidents.values())

    # --- Allocations ---
    def save_allocation(self, allocation_id: str, data: Dict[str, Any]) -> None:
        """
        Stores allocation records ensuring backward-compatible flattened keys.
        """
        flattened_data = dict(data)
        # Guarantee flattened keys exist at top level
        plan = data.get("plan", {})
        if isinstance(plan, dict):
            for k in [
                "priority_score",
                "allocated_med_kits",
                "allocated_rescue_teams",
                "dispatch_message",
                "location",
                "category",
                "status",
                "allocated_resources",
                "shortfall",
            ]:
                if k in plan and k not in flattened_data:
                    flattened_data[k] = plan[k]

        with self._lock:
            self._mock_allocations[allocation_id] = flattened_data

        if not self.use_mock and self.db:
            try:
                self.db.collection("allocations").document(allocation_id).set(flattened_data)
            except Exception as e:
                logger.error(f"Firestore save_allocation error: {e}")

    def list_allocations(self) -> List[Dict[str, Any]]:
        if not self.use_mock and self.db:
            try:
                docs = self.db.collection("allocations").stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Firestore list_allocations error: {e}")

        with self._lock:
            return list(self._mock_allocations.values())

    # --- Audit Logs ---
    def add_audit_log(self, event_type: str, incident_id: str, details: Dict[str, Any]) -> AuditLogRecord:
        record = AuditLogRecord(
            log_id=f"log_{uuid.uuid4().hex[:12]}",
            timestamp=datetime.now(timezone.utc).isoformat(),
            event_type=event_type,
            incident_id=incident_id,
            details=details
        )
        data = record.model_dump()

        with self._lock:
            self._mock_audit_logs.append(data)

        if not self.use_mock and self.db:
            try:
                self.db.collection("audit_logs").document(record.log_id).set(data)
            except Exception as e:
                logger.error(f"Firestore add_audit_log error: {e}")

        return record

    def list_audit_logs(self) -> List[Dict[str, Any]]:
        if not self.use_mock and self.db:
            try:
                docs = self.db.collection("audit_logs").order_by("timestamp").stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Firestore list_audit_logs error: {e}")

        with self._lock:
            return sorted(self._mock_audit_logs, key=lambda x: x.get("timestamp", ""))


firestore_service = FirestoreService()
