import { Client, IMessage } from '@stomp/stompjs';
import { WS_BASE_URL } from '../config/env';

/**
 * One long-lived STOMP client for the whole "online" session — publishes
 * location (FR-3.3) and subscribes to the partner's two push topics:
 * /topic/partner/{id}/request (FR-4.1, new offers) and
 * /topic/partner/{id}/cancellation (FR-4.7, system-side cancellation alert).
 * Connects with the JWT on the STOMP CONNECT frame (see
 * StompAuthChannelInterceptor on the backend) — no SockJS, RN has a native
 * WebSocket the @stomp/stompjs Client can use directly.
 */
let client: Client | null = null;
let currentPartnerId: string | null = null;

type AssignmentListeners = {
  onOffer?: (payload: unknown) => void;
  onCancellation?: (payload: unknown) => void;
};

let listeners: AssignmentListeners = {};

/** Registered once by HomeScreen; read every time a push arrives, not at subscribe time. */
export function setAssignmentListeners(next: AssignmentListeners): void {
  listeners = next;
}

function parseBody(message: IMessage): unknown {
  try {
    return JSON.parse(message.body);
  } catch {
    return null;
  }
}

export function connectLocationSocket(partnerId: string, accessToken: string): void {
  currentPartnerId = partnerId;
  if (client?.active) return;

  client = new Client({
    brokerURL: WS_BASE_URL,
    connectHeaders: { Authorization: `Bearer ${accessToken}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client?.subscribe(`/topic/partner/${partnerId}/request`, (message) => {
        listeners.onOffer?.(parseBody(message));
      });
      client?.subscribe(`/topic/partner/${partnerId}/cancellation`, (message) => {
        listeners.onCancellation?.(parseBody(message));
      });
    },
  });
  client.activate();
}

export function publishLocation(latitude: number, longitude: number): void {
  if (!client?.connected || !currentPartnerId) return;
  client.publish({
    destination: `/app/partner/${currentPartnerId}/location`,
    body: JSON.stringify({ latitude, longitude }),
  });
}

export function disconnectLocationSocket(): void {
  client?.deactivate();
  client = null;
  currentPartnerId = null;
}

export function isLocationSocketConnected(): boolean {
  return !!client?.connected;
}
