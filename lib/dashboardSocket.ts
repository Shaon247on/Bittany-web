import { BASE_URL } from '@/lib/axios';
import type { DashboardSocketInboundEvent, DashboardSummaryEventMessage } from '@/types/home.type';

type DashboardSocketHandlers = {
  onSummary?: (event: DashboardSummaryEventMessage) => void;
  onError?: () => void;
};

function toDashboardWebSocketUrl(token: string) {
  const base = BASE_URL.replace(/\/+$/, '');
  const wsBase = base.startsWith('https://')
    ? base.replace('https://', 'wss://')
    : base.replace('http://', 'ws://');

  return `${wsBase}/ws/dashboard/?Authorization=${encodeURIComponent(`Bearer ${token}`)}`;
}

export class DashboardSocketClient {
  private ws: WebSocket | null = null;

  private handlers: DashboardSocketHandlers = {};

  setHandlers(handlers: DashboardSocketHandlers) {
    this.handlers = handlers;
  }

  connect(token: string) {
    this.disconnect();

    const ws = new WebSocket(toDashboardWebSocketUrl(token));
    this.ws = ws;

    ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    ws.onerror = () => {
      this.handlers.onError?.();
    };

    ws.onclose = () => {
      if (this.ws === ws) {
        this.ws = null;
      }
    };
  }

  disconnect() {
    if (!this.ws) return;

    const current = this.ws;
    this.ws = null;
    current.onmessage = null;
    current.onerror = null;
    current.onclose = null;

    if (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING) {
      current.close();
    }
  }

  private handleMessage(rawMessage: unknown) {
    try {
      const payload = JSON.parse(String(rawMessage)) as DashboardSocketInboundEvent;
      if (payload.type === 'dashboard_summary') {
        this.handlers.onSummary?.(payload as DashboardSummaryEventMessage);
      }
    } catch {
      this.handlers.onError?.();
    }
  }
}