import { BASE_URL } from '@/lib/axios';
import type {
  ChatSocketInboundEvent,
  ChatSocketStatus,
  UseChatRoomSocketOptions,
} from '@/types/chat.type';

type ChatSocketHandlers = Pick<
  UseChatRoomSocketOptions,
  | "onChatMessage"
  | "onTyping"
  | "onSuggestion"
  | "onPresence"
  | "onPartnerStatus"
  | "onError"
  | "onDisconnected"
>;

type ConnectionOptions = {
  roomId: string;
  token: string;
  onStatusChange?: (
    status: ChatSocketStatus,
    closeCode?: number | null,
  ) => void;
};

function toWebSocketUrl(roomId: string, token: string) {
  const base = BASE_URL.replace(/\/+$/, "");
  const wsBase = base.startsWith("https://")
    ? base.replace("https://", "wss://")
    : base.replace("http://", "ws://");

  return `${wsBase}/ws/chat/${roomId}/?token=${encodeURIComponent(token)}`;
}

// A presence socket that never reconnects reports everyone as permanently
// offline after the first network blip or tab sleep. Backoff caps out so a long
// outage does not hammer the server.
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 15_000;

// Auth failures are not worth retrying — a new token means a new connect() call.
const NO_RETRY_CLOSE_CODES = new Set([4001, 4003]);

export class ChatSocketClient {
  private ws: WebSocket | null = null;

  private handlers: ChatSocketHandlers = {};

  private connectionOptions: ConnectionOptions | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private reconnectAttempts = 0;

  private closedByUs = false;

  private wakeListener: (() => void) | null = null;

  setHandlers(handlers: ChatSocketHandlers) {
    this.handlers = handlers;
  }

  connect(options: ConnectionOptions) {
    this.disconnect();

    this.connectionOptions = options;
    this.reconnectAttempts = 0;
    this.closedByUs = false;
    this.addWakeListeners();
    this.open();
  }

  disconnect() {
    this.closedByUs = true;
    this.clearReconnectTimer();
    this.removeWakeListeners();

    if (!this.ws) return;

    const current = this.ws;
    this.ws = null;

    current.onopen = null;
    current.onmessage = null;
    current.onerror = null;
    current.onclose = null;

    if (
      current.readyState === WebSocket.OPEN ||
      current.readyState === WebSocket.CONNECTING
    ) {
      current.close();
    }

    this.connectionOptions?.onStatusChange?.("idle", null);
  }

  private open() {
    const options = this.connectionOptions;
    if (!options) return;

    this.clearReconnectTimer();
    options.onStatusChange?.("connecting", null);

    const ws = new WebSocket(toWebSocketUrl(options.roomId, options.token));
    this.ws = ws;

    ws.onopen = () => {
      console.log("[ChatSocket] connected", {
        roomId: options.roomId,
        readyState: ws.readyState,
      });
      this.reconnectAttempts = 0;
      options.onStatusChange?.("connected", null);
    };

    ws.onmessage = (event) => {
      console.log("[ChatSocket] message received", {
        roomId: options.roomId,
        raw: event.data,
      });
      this.handleMessage(event.data);
    };

    ws.onerror = (error) => {
      console.error("[ChatSocket] socket error", {
        roomId: options.roomId,
        error,
      });
      options.onStatusChange?.("disconnected", null);
    };

    ws.onclose = (event) => {
      console.warn("[ChatSocket] closed", {
        roomId: options.roomId,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        closedByUs: this.closedByUs,
      });
      if (this.ws === ws) {
        this.ws = null;
      }
      options.onStatusChange?.("disconnected", event.code ?? null);
      this.handlers.onDisconnected?.();

      if (this.closedByUs || NO_RETRY_CLOSE_CODES.has(event.code)) return;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.closedByUs) return;

    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_DELAY_MS,
    );
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.closedByUs || this.ws) return;
      this.open();
    }, delay);
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  /**
   * A slept tab often comes back with a socket the browser already killed, and no
   * close event lands until the tab is foregrounded. Retry immediately on wake
   * instead of waiting out the backoff.
   */
  private addWakeListeners() {
    if (typeof window === "undefined" || this.wakeListener) return;

    this.wakeListener = () => {
      if (this.closedByUs || this.ws) return;
      if (document.visibilityState === "hidden") return;
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      this.open();
    };

    document.addEventListener("visibilitychange", this.wakeListener);
    window.addEventListener("online", this.wakeListener);
    window.addEventListener("focus", this.wakeListener);
  }

  private removeWakeListeners() {
    if (typeof window === "undefined" || !this.wakeListener) return;
    document.removeEventListener("visibilitychange", this.wakeListener);
    window.removeEventListener("online", this.wakeListener);
    window.removeEventListener("focus", this.wakeListener);
    this.wakeListener = null;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  sendJson(payload: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[ChatSocket] send blocked; socket not open", {
        readyState: this.ws?.readyState,
        payload,
      });
      return false;
    }
    console.log("[ChatSocket] sending payload", payload);
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  sendMessage(
    message: string,
    replyTo: number | null = null,
    messageType = "text",
  ) {
    return this.sendJson({
      type: "message",
      message,
      message_type: messageType,
      reply_to: replyTo,
      attachment: null,
    });
  }

  requestFilter(message: string, messageType = "text") {
    return this.sendJson({
      type: "filter_request",
      message,
      message_type: messageType,
    });
  }

  requestSuggestion(message: string) {
    return this.sendJson({
      type: "suggestion_request",
      message,
    });
  }

  sendTyping(isTyping: boolean) {
    return this.sendJson({
      type: "typing",
      is_typing: isTyping,
    });
  }

  sendSeen(messageIds: number[]) {
    return this.sendJson({
      type: "seen",
      message_ids: messageIds,
    });
  }

  sendAllSeen() {
    return this.sendJson({
      type: "all_seen",
    });
  }

  private handleMessage(rawMessage: unknown) {
    try {
      const payload = JSON.parse(String(rawMessage)) as ChatSocketInboundEvent;
      console.log("[ChatSocket] parsed payload", payload);

      if (payload.type === "chat_message")
        this.handlers.onChatMessage?.(payload);
      else if (payload.type === "typing") this.handlers.onTyping?.(payload);
      else if (payload.type === "suggestion_response")
        this.handlers.onSuggestion?.(payload);
      else if (payload.type === "user_joined" || payload.type === "user_left") {
        this.handlers.onPresence?.(payload);
      } else if (payload.type === "partner_status") {
        this.handlers.onPartnerStatus?.(payload);
      } else if (payload.type === "error") {
        this.handlers.onError?.(payload);
      }
    } catch (error) {
      console.error("[ChatSocket] invalid payload", {
        rawMessage,
        error,
      });
    }
  }
}
