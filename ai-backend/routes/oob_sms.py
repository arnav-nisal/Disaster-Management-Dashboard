import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from services.oob_sms_service import (
    TextbeeWebhookPayload,
    deserialize_oob_message,
    idempotency_store,
    execute_oob_action,
)

logger = logging.getLogger("textbee_route")
router = APIRouter(prefix="/api/oob", tags=["Textbee Out-of-Band SMS Gateway"])


@router.post("/textbee-webhook", status_code=status.HTTP_200_OK)
def handle_textbee_webhook(payload: TextbeeWebhookPayload) -> Dict[str, Any]:
    """
    Ingestion endpoint for Textbee Android-to-Webhook Gateway.

    1. Checks webhookEvent: Ignores if not 'MESSAGE_RECEIVED'.
    2. Protocol Check: Filters out non-OOB messages.
    3. Deserializes compressed token payload: OOB:<ACTION>:<ENTITY_ID>:<STATUS>:<TIMESTAMP_HEX>:<NONCE_HEX>
    4. Idempotency Gate: Validates compound hash/timestamp to drop retried/duplicated SMS.
    5. State Mutation: Commits state change and writes to audit logs.
    """
    # 1. Event Type Validation
    if payload.webhookEvent != "MESSAGE_RECEIVED":
        logger.info(f"Ignoring non-message event: {payload.webhookEvent}")
        return {
            "status": "IGNORED",
            "reason": f"Event '{payload.webhookEvent}' is not 'MESSAGE_RECEIVED'"
        }

    raw_message = payload.message.strip()

    # 2. Protocol Prefix Validation
    if not raw_message.startswith("OOB:"):
        logger.info(f"Ignoring non-OOB SMS from {payload.sender}: '{raw_message}'")
        return {
            "status": "IGNORED",
            "reason": "Message does not contain OOB protocol envelope"
        }

    # 3. Message Deserialization
    try:
        action_spec = deserialize_oob_message(raw_message, payload.sender)
    except ValueError as err:
        logger.warning(f"Unprocessable OOB payload from {payload.sender}: {err}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse OOB payload: {str(err)}"
        )

    # 4. Idempotency Verification
    lock_acquired = idempotency_store.acquire_lock(action_spec.idempotency_key)
    if not lock_acquired:
        logger.warning(
            f"Duplicate OOB delivery detected for key '{action_spec.idempotency_key}'. Discarding."
        )
        return {
            "status": "DUPLICATE_IGNORED",
            "idempotency_key": action_spec.idempotency_key,
            "message": "Payload was already processed within the idempotency window."
        }

    # 5. Execute State Mutation & Audit Logging
    result = execute_oob_action(action_spec)

    return {
        "status": "PROCESSED",
        "sms_id": payload.smsId,
        "action": action_spec.action,
        "entity_id": action_spec.entity_id,
        "new_status": action_spec.status,
        "idempotency_key": action_spec.idempotency_key,
        "result": result
    }
