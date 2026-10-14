export interface ChatUser {
  id: number;
  username: string;
  name: string;
  email: string;
  image: string | null;
}

export interface ChatMessage {
  id: number;
  chat_room: number;
  sender: ChatUser;
  reply_to: number | null;
  message: string;
  filtered_message: string;
  attachment: string | null;
  image: string | null;
  message_type: string;
  is_deleted: boolean;
  is_filtered: boolean;
  status: string;
  status_color: string;
  timestamp: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  room_id: string;
  participants: ChatUser[];
  created_at: string;
  last_message: ChatMessage | null;
  unread_count: number;
}

export interface ChatRoomCreatePayload {
  name: string;
  participants: number[];
}

export interface ChatMessageCreatePayload {
  message: string;
  reply_to?: number | null;
  message_type?: string;
}

export interface ChatMessageUpdatePayload {
  message: string;
}

export interface ChatMessagesPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

export type ChatSocketStatus = "idle" | "connecting" | "connected" | "disconnected";

type ChatSocketChatMessageEvent = {
  type: "chat_message";
  message_id: number;
  message: string;
  filtered_message?: string | null;
  is_filtered?: boolean;
  sender_id: number;
  sender: string;
  sender_name: string;
  sender_image?: string | null;
  reply_to_id?: number | null;
  message_type?: string;
  status?: string;
  status_color?: string;
  timestamp: string;
};

type ChatSocketTypingEvent = {
  type: "typing";
  user_id: number;
  username: string;
  is_typing: boolean;
};

type ChatSocketSuggestionEvent = {
  type: "suggestion_response";
  original_message: string;
  suggestion:
    | string
    | Array<
        | string
        | {
            suggestion?: string;
            tone?: string;
          }
      >
    | {
        suggestion?: string;
        tone?: string;
      };
  status_color?: string;
};

type ChatSocketPresenceEvent = {
  type: "user_joined" | "user_left";
  user_id: number;
  username: string;
};

type ChatSocketErrorEvent = {
  type: "error";
  message: string;
};

type ChatSocketPartnerStatusEvent = {
  type: "partner_status";
  is_online: boolean;
};

export type ChatSocketInboundEvent =
  | ChatSocketChatMessageEvent
  | ChatSocketTypingEvent
  | ChatSocketSuggestionEvent
  | ChatSocketPresenceEvent
  | ChatSocketErrorEvent
  | ChatSocketPartnerStatusEvent;

export type UseChatRoomSocketOptions = {
  roomId: string | null;
  enabled?: boolean;
  onChatMessage?: (event: ChatSocketChatMessageEvent) => void;
  onTyping?: (event: ChatSocketTypingEvent) => void;
  onSuggestion?: (event: ChatSocketSuggestionEvent) => void;
  onPresence?: (event: ChatSocketPresenceEvent) => void;
  onPartnerStatus?: (event: ChatSocketPartnerStatusEvent) => void;
  onError?: (event: ChatSocketErrorEvent) => void;
  /** The socket dropped — presence read from it is now stale. */
  onDisconnected?: () => void;
};
