import { SignalsSnapshotPayload } from '../types/market';
import { getStoredPassword } from './auth';

export type SseConnectionStatus = 'connecting' | 'live' | 'error' | 'idle';

type EventCallback = (payload: any) => void;
type StatusCallback = (status: SseConnectionStatus) => void;

const TRACKED_EVENTS = [
  'signals_snapshot',
  'signals_updated',
  'sales_updated',
  'validation_updated',
  'audit_updated',
  'pipeline_updated',
  'opportunities_updated',
  'usage_updated',
  'workspace_updated',
] as const;

let eventSource: EventSource | null = null;
let currentStatus: SseConnectionStatus = 'idle';
let lastSignalsSnapshot: SignalsSnapshotPayload | null = null;

const eventListeners = new Map<string, Set<EventCallback>>();
const statusListeners = new Set<StatusCallback>();
const attachedEventTargets = new Map<string, EventListener>();

function setSseStatus(status: SseConnectionStatus) {
  currentStatus = status;
  for (const cb of statusListeners) {
    try {
      cb(status);
    } catch {
      // ignore listener errors
    }
  }
}

function dispatchLiveEvent(eventName: string, data: any) {
  if (eventName === 'signals_snapshot' || eventName === 'signals_updated') {
    lastSignalsSnapshot = data as SignalsSnapshotPayload;
  }
  const listeners = eventListeners.get(eventName);
  if (!listeners) return;
  for (const cb of listeners) {
    try {
      cb(data);
    } catch {
      // ignore listener errors
    }
  }
}

export function startLiveStream(): void {
  if (typeof window === 'undefined' || eventSource) return;

  const token = getStoredPassword();
  const streamUrl = token
    ? `/api/signals/stream?token=${encodeURIComponent(token)}`
    : '/api/signals/stream';

  setSseStatus('connecting');
  const es = new EventSource(streamUrl);
  eventSource = es;

  es.onopen = () => {
    setSseStatus('live');
  };

  es.onerror = () => {
    setSseStatus('error');
  };

  attachedEventTargets.clear();
  for (const evtName of TRACKED_EVENTS) {
    const handler: EventListener = (evt: Event) => {
      try {
        const msg = evt as MessageEvent;
        const parsed = JSON.parse(msg.data);
        setSseStatus('live');
        dispatchLiveEvent(evtName, parsed);
      } catch {
        // Ignore malformed SSE payload
      }
    };
    attachedEventTargets.set(evtName, handler);
    es.addEventListener(evtName, handler);
  }
}

export function stopLiveStream(): void {
  if (!eventSource) {
    setSseStatus('idle');
    return;
  }
  for (const [evtName, handler] of attachedEventTargets.entries()) {
    eventSource.removeEventListener(evtName, handler);
  }
  attachedEventTargets.clear();
  eventSource.close();
  eventSource = null;
  setSseStatus('idle');
}

export function restartLiveStream(): void {
  stopLiveStream();
  startLiveStream();
}

export function subscribeLiveEvent<T = any>(
  eventName: (typeof TRACKED_EVENTS)[number] | string,
  callback: (payload: T) => void
): () => void {
  let set = eventListeners.get(eventName);
  if (!set) {
    set = new Set<EventCallback>();
    eventListeners.set(eventName, set);
  }
  set.add(callback as EventCallback);

  // Immediately replay cached signals snapshot if subscribing to signals_snapshot
  if (eventName === 'signals_snapshot' && lastSignalsSnapshot) {
    try {
      callback(lastSignalsSnapshot as unknown as T);
    } catch {
      // ignore
    }
  }

  return () => {
    set?.delete(callback as EventCallback);
  };
}

export function subscribeSseStatus(callback: StatusCallback): () => void {
  statusListeners.add(callback);
  callback(currentStatus);
  return () => {
    statusListeners.delete(callback);
  };
}

export function getLastSignalsSnapshot(): SignalsSnapshotPayload | null {
  return lastSignalsSnapshot;
}

export function getCurrentSseStatus(): SseConnectionStatus {
  return currentStatus;
}
