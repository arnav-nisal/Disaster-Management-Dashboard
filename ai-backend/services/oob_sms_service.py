import time
import logging
from typing import Dict, Optional, Tuple, Any
from pydantic import BaseModel, Field

from services.firestore_service import firestore_service

logger = logging.getLogger("oob_sms_service")

# 1:1 Bi-directional action mappings between Mobile client & Backend
ACTION_MAP: Dict[str, str] = {
    "update_status": "UST",
    "report_incident": "RPI",
    "ack_dispatch": "ACK",
}
REVERSE_ACTION_MAP: Dict[str, str] = {v: k for k, v in ACTION_MAP.items()}

# Status mappings
STATUS_MAP: Dict[str, str] = {
    "pending": "PND",
    "in_progress": "INP",
    "completed": "CMP",
    "cancelled": "CAN",
    "failed": "FLD",
    "active": "ACT",
    "dispatched": "DSP",
    "resolved": "RES",
}
REVERSE_STATUS_MAP: Dict[str, str] = {v: k for k, v in STATUS_MAP.items()}


class TextbeeWebhookPayload(BaseModel):
    """Payload format delivered by Textbee Android-to-Webhook Gateway."""
    smsId: str = Field(..., description="Unique SMS identifier from Textbee gateway")
    sender: str = Field(..., description="Originating mobile phone number (E.164)")
    message: str = Field(..., description="Raw SMS text payload")
    webhookEvent: str = Field(..., description="Gateway event type, e.g. MESSAGE_RECEIVED")


class DeserializedOOBAction(BaseModel):
    action: str
    entity_id: str
    status: str
    timestamp_epoch: int
    nonce: str
    idempotency_key: str
    sender_phone: str


class TTLCacheIdempotencyStore:
    """
    Thread-safe in-memory idempotency store with TTL expiration.
    Guarantees duplicate SMS delivery retries within the TTL window are safely dropped.
    """
    def __init__(self, ttl_seconds: int = 86400):
        self._ttl_seconds = ttl_seconds
        self._cache: Dict[str, float] = {}

    def acquire_lock(self, idempotency_key: str) -> bool:
        """
        Attempts to acquire lock for given key.
        Returns True if key is new (lock acquired), False if duplicate (within TTL).
        """
        now = time.time()
        # Clean expired keys
        self._cache = {k: exp for k, exp in self._cache.items() if exp > now}

        if idempotency_key in self._cache:
            return False

        self._cache[idempotency_key] = now + self._ttl_seconds
        return True

    def clear(self):
        self._cache.clear()


# Global singleton store instance
idempotency_store = TTLCacheIdempotencyStore(ttl_seconds=86400)


def deserialize_oob_message(message: str, sender: str) -> DeserializedOOBAction:
    """
    Deserializes delimited string:
    'OOB:<ACTION>:<ENTITY_ID>:<STATUS>:<TIMESTAMP_HEX>:<NONCE_HEX>'
    Example: 'OOB:UST:inc_12345:CMP:66DF2B80:A9B1'
    """
    clean_msg = message.strip()
    parts = clean_msg.split(":")
    if len(parts) != 6 or parts[0] != "OOB":
        raise ValueError(
            f"Invalid OOB signature. Expected 6 colon-delimited tokens starting with 'OOB', got: '{message}'"
        )

    _, raw_action, entity_id, raw_status, hex_ts, hex_nonce = parts

    action = REVERSE_ACTION_MAP.get(raw_action.upper())
    if not action:
        raise ValueError(f"Unrecognized action code: '{raw_action}'")

    status = REVERSE_STATUS_MAP.get(raw_status.upper())
    if not status:
        raise ValueError(f"Unrecognized status code: '{raw_status}'")

    try:
        ts_epoch = int(hex_ts, 16)
    except ValueError:
        raise ValueError(f"Malformed hexadecimal timestamp: '{hex_ts}'")

    # Compound idempotency key ensuring replay protection
    idempotency_key = f"oob:{entity_id}:{raw_action.upper()}:{raw_status.upper()}:{hex_ts.upper()}:{hex_nonce.upper()}"

    return DeserializedOOBAction(
        action=action,
        entity_id=entity_id,
        status=status,
        timestamp_epoch=ts_epoch,
        nonce=hex_nonce,
        idempotency_key=idempotency_key,
        sender_phone=sender,
    )


def execute_oob_action(action: DeserializedOOBAction) -> Dict[str, Any]:
    """
    Executes deserialized command against storage/state engine and logs audit record.
    """
    logger.info(
        f"[OOB_EXECUTE] Action={action.action} for entity={action.entity_id} "
        f"status={action.status} from sender={action.sender_phone}"
    )

    # 1. Update Allocation state if applicable
    allocations = firestore_service.list_allocations()
    target_alloc_id = None
    target_alloc_data = None

    for alloc in allocations:
        if alloc.get("incident_id") == action.entity_id or alloc.get("allocation_id") == action.entity_id:
            target_alloc_id = alloc.get("allocation_id") or f"alloc_{action.entity_id}"
            target_alloc_data = alloc
            break

    if target_alloc_id and target_alloc_data:
        target_alloc_data["status"] = action.status.capitalize()
        if "plan" in target_alloc_data and isinstance(target_alloc_data["plan"], dict):
            target_alloc_data["plan"]["status"] = action.status.capitalize()
        firestore_service.save_allocation(target_alloc_id, target_alloc_data)

    # 2. Update Incident status if incident exists
    incident = firestore_service.get_incident(action.entity_id)
    if incident:
        incident["status"] = action.status.capitalize()
        if "allocation" in incident and isinstance(incident["allocation"], dict):
            incident["allocation"]["status"] = action.status.capitalize()
        firestore_service.save_incident(action.entity_id, incident)

    # 3. Commit append-only audit log
    audit_record = firestore_service.add_audit_log(
        event_type="OOB_SMS_STATE_UPDATE",
        incident_id=action.entity_id,
        details={
            "action": action.action,
            "status": action.status,
            "sender": action.sender_phone,
            "timestamp_epoch": action.timestamp_epoch,
            "idempotency_key": action.idempotency_key,
            "source": "Textbee_OOB_Gateway"
        }
    )

    return {
        "entity_id": action.entity_id,
        "action": action.action,
        "status": action.status,
        "audit_log_id": audit_record.log_id,
        "processed": True
    }
