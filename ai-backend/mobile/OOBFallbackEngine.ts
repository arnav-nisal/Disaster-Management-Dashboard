// mobile/OOBFallbackEngine.ts
/**
 * Out-of-Band (OOB) SMS Fallback Engine for React Native / Expo.
 *
 * Implements App Store & Google Play compliant SMS fallbacks:
 * - Does not require dangerous SEND_SMS background permissions.
 * - Formats native Intent/MFMessageComposeViewController URLs ('sms:?body=' / 'sms:&body=').
 * - Ultra-compact serialization (35-45 chars) fitting in a single 160-char 7-bit GSM SMS.
 * - Idempotency hash (epoch timestamp in hex + 16-bit random nonce in hex).
 */

import { Platform, Linking } from 'react-native';

export type ActionType = 'update_status' | 'report_incident' | 'ack_dispatch';
export type StatusType = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

export interface ActionPayload {
  action: ActionType;
  entityId: string; // e.g., incident_id, order_id
  status: StatusType;
  metadata?: Record<string, string>;
}

// 1:1 Bi-directional Lookup Tables for Compression
export const ACTION_MAP: Record<ActionType, string> = {
  update_status: 'UST',
  report_incident: 'RPI',
  ack_dispatch: 'ACK',
};

export const STATUS_MAP: Record<StatusType, string> = {
  pending: 'PND',
  in_progress: 'INP',
  completed: 'CMP',
  cancelled: 'CAN',
  failed: 'FLD',
};

/**
 * Serializes standard JSON payload into a strict, delimited GSM-safe string.
 * Format: OOB:<ACTION>:<ENTITY_ID>:<STATUS>:<TIMESTAMP_HEX>:<NONCE_HEX>
 * Example: OOB:UST:inc_12345:CMP:66DF2B80:A9B1
 */
export function compressActionPayload(payload: ActionPayload): string {
  const shortAction = ACTION_MAP[payload.action];
  if (!shortAction) {
    throw new Error(`Unsupported action type: ${payload.action}`);
  }

  const shortStatus = STATUS_MAP[payload.status];
  if (!shortStatus) {
    throw new Error(`Unsupported status type: ${payload.status}`);
  }

  // Idempotency: 32-bit epoch timestamp (in seconds) in HEX
  const epochSeconds = Math.floor(Date.now() / 1000);
  const timeHex = epochSeconds.toString(16).toUpperCase();

  // 16-bit pseudo-random salt/nonce in HEX to prevent collisions in same second
  const nonce = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0')
    .toUpperCase();

  // Sanitize entityId by stripping delimiter ':'
  const sanitizedEntityId = payload.entityId.replace(/:/g, '');

  return `OOB:${shortAction}:${sanitizedEntityId}:${shortStatus}:${timeHex}:${nonce}`;
}

/**
 * Triggers native OS SMS composer pre-filled with gateway recipient and payload.
 * Fully compliant with iOS App Store & Android Google Play policies.
 */
export async function launchNativeSmsFallback(
  gatewayNumber: string,
  compressedPayload: string
): Promise<boolean> {
  const cleanNumber = gatewayNumber.replace(/[^\d+]/g, '');
  const encodedBody = encodeURIComponent(compressedPayload);

  // iOS uses '&body=', Android uses '?body='
  const url = Platform.select({
    ios: `sms:${cleanNumber}&body=${encodedBody}`,
    android: `sms:${cleanNumber}?body=${encodedBody}`,
    default: `sms:${cleanNumber}?body=${encodedBody}`,
  });

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error(`Cannot open native SMS composer with URL: ${url}`);
  }

  await Linking.openURL(url);
  return true;
}

export interface ClientConfig {
  apiBaseUrl: string;
  gatewayPhoneNumber: string; // Textbee Android Gateway SIM Number in E.164 (e.g. "+15551234567")
  timeoutMs?: number;
}

export class ResilientNetworkClient {
  private apiBaseUrl: string;
  private gatewayPhoneNumber: string;
  private timeoutMs: number;

  constructor(config: ClientConfig) {
    this.apiBaseUrl = config.apiBaseUrl;
    this.gatewayPhoneNumber = config.gatewayPhoneNumber;
    this.timeoutMs = config.timeoutMs ?? 4000; // 4s timeout before triggering OOB SMS
  }

  /**
   * Executes HTTP POST state change with hard AbortController timeout.
   * On timeout or network drop, intercepts the failure, serializes the payload,
   * and invokes the native OS SMS fallback.
   */
  public async executeStateChangeWithFallback(
    endpoint: string,
    payload: ActionPayload
  ): Promise<{ success: boolean; mode: 'HTTP' | 'SMS_OOB'; message: string }> {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timerId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        mode: 'HTTP',
        message: 'Primary HTTP state transition committed successfully.',
      };
    } catch (err: unknown) {
      clearTimeout(timerId);

      const isTimeoutOrNetworkFail =
        (err instanceof Error && err.name === 'AbortError') ||
        (err instanceof TypeError && err.message.toLowerCase().includes('network'));

      if (isTimeoutOrNetworkFail) {
        console.warn('[NETWORK_TIMEOUT] Backend unreachable. Invoking native OOB SMS fallback...');

        // 1. Serialize and compress payload
        const compressedSms = compressActionPayload(payload);

        // 2. Open native SMS composer (Intent / MFMessageComposeViewController)
        await launchNativeSmsFallback(this.gatewayPhoneNumber, compressedSms);

        return {
          success: true,
          mode: 'SMS_OOB',
          message: `OOB SMS dispatched to native composer: ${compressedSms}`,
        };
      }

      throw err;
    }
  }
}
