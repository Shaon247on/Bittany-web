import api from '@/lib/axios';
import { getStoredAccessToken } from '@/hooks/useAuth';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatSocketClient } from "@/lib/chatSocket";
import type {
  ChatSocketStatus,
  ChatMessage,
  ChatMessageCreatePayload,
  ChatMessageUpdatePayload,
  ChatMessagesPage,
  ChatRoom,
  ChatRoomCreatePayload,
  ChatUser,
  UseChatRoomSocketOptions,
} from "@/types/chat.type";

const chatKeys = {
  all: ["chat"] as const,
  rooms: () => ["chat", "rooms"] as const,
  room: (roomId: string) => ["chat", "room", roomId] as const,
  messages: (roomId: string, page: number, pageSize: number) =>
    ["chat", "messages", roomId, page, pageSize] as const,
  infiniteMessages: (roomId: string, pageSize: number) =>
    ["chat", "messages-infinite", roomId, pageSize] as const,
  userSearch: (query: string) => ["chat", "user-search", query] as const,
};

function getNextPageFromUrl(nextUrl: string | null): number | undefined {
  if (!nextUrl) return undefined;

  const match = nextUrl.match(/[?&]page=(\d+)/i);
  if (!match?.[1]) return undefined;

  const page = Number.parseInt(match[1], 10);
  if (!Number.isFinite(page) || page <= 0) return undefined;
  return page;
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.rooms)) return record.rooms as T[];
    if (Array.isArray(record.users)) return record.users as T[];

    // Some endpoints return a single object instead of an array.
    if (
      record.data &&
      typeof record.data === "object" &&
      !Array.isArray(record.data)
    ) {
      return [record.data as T];
    }

    if ("id" in record) {
      return [record as T];
    }

    return [];
  }
  return [];
}

async function fetchRooms(): Promise<ChatRoom[]> {
  const res = await api.get("/api/v1/chat/rooms/");
  // Backend returns a single ChatRoom object (auto-creates if needed)
  const room = res.data?.data ?? res.data;
  if (!room) return [];
  if (Array.isArray(room)) return room as ChatRoom[];
  // Single room object returned by backend
  return [room as ChatRoom];
}

async function createRoom(payload: ChatRoomCreatePayload): Promise<ChatRoom> {
  const res = await api.post<ChatRoom>("/api/v1/chat/rooms/", payload);
  return res.data;
}

async function fetchRoom(roomId: string): Promise<ChatRoom> {
  const res = await api.get<ChatRoom>(`/api/v1/chat/rooms/${roomId}/`);
  return res.data;
}

async function leaveRoom(roomId: string): Promise<void> {
  await api.delete(`/api/v1/chat/rooms/${roomId}/`);
}

async function fetchRoomMessages(
  roomId: string,
  page = 1,
  pageSize = 20,
): Promise<ChatMessagesPage> {
  const res = await api.get<ChatMessagesPage>(
    `/api/v1/chat/rooms/${roomId}/messages/`,
    {
      params: { page, page_size: pageSize },
    },
  );
  return {
    count: res.data.count ?? 0,
    next: res.data.next ?? null,
    previous: res.data.previous ?? null,
    results: res.data.results ?? [],
  };
}

async function createMessage(
  roomId: string,
  payload: ChatMessageCreatePayload,
): Promise<ChatMessage> {
  const res = await api.post<ChatMessage>(
    `/api/v1/chat/rooms/${roomId}/messages/`,
    payload,
  );
  return res.data;
}

async function updateMessage(
  roomId: string,
  messageId: number,
  payload: ChatMessageUpdatePayload,
): Promise<ChatMessage> {
  const res = await api.put<ChatMessage>(
    `/api/v1/chat/rooms/${roomId}/messages/${messageId}/`,
    payload,
  );
  return res.data;
}

async function deleteMessage(roomId: string, messageId: number): Promise<void> {
  await api.delete(`/api/v1/chat/rooms/${roomId}/messages/${messageId}/`);
}

async function searchUsers(query: string): Promise<ChatUser[]> {
  if (!query.trim()) return [];
  const res = await api.get("/api/v1/chat/search/users/", {
    params: { q: query },
  });
  return normalizeArray<ChatUser>(
    res.data?.users ?? res.data?.data ?? res.data,
  );
}

export function useChatRoomsQuery() {
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: fetchRooms,
    staleTime: 1000 * 20,
  });
}

export function useChatRoomQuery(roomId: string | null) {
  return useQuery({
    queryKey: chatKeys.room(roomId ?? ""),
    queryFn: () => fetchRoom(roomId as string),
    enabled: Boolean(roomId),
    staleTime: 1000 * 20,
  });
}

export function useRoomMessagesQuery(
  roomId: string | null,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: chatKeys.messages(roomId ?? "", page, pageSize),
    queryFn: () => fetchRoomMessages(roomId as string, page, pageSize),
    enabled: Boolean(roomId),
    staleTime: 1000 * 5,
  });
}

export function useInfiniteRoomMessagesQuery(
  roomId: string | null,
  pageSize = 20,
) {
  return useInfiniteQuery({
    queryKey: chatKeys.infiniteMessages(roomId ?? "", pageSize),
    queryFn: ({ pageParam }) =>
      fetchRoomMessages(roomId as string, pageParam, pageSize),
    initialPageParam: 1,
    enabled: Boolean(roomId),
    staleTime: 1000 * 5,
    getNextPageParam: (lastPage) => getNextPageFromUrl(lastPage.next),
  });
}

export function useSearchChatUsersQuery(query: string) {
  return useQuery({
    queryKey: chatKeys.userSearch(query),
    queryFn: () => searchUsers(query),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 30,
  });
}

export function useCreateChatRoomMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useLeaveChatRoomMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useCreateChatMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      payload,
    }: {
      roomId: string;
      payload: ChatMessageCreatePayload;
    }) => createMessage(roomId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: chatKeys.messages(variables.roomId, 1, 20),
      });
      qc.invalidateQueries({ queryKey: chatKeys.rooms() });
      qc.invalidateQueries({ queryKey: chatKeys.room(variables.roomId) });
    },
  });
}

export function useUpdateChatMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      messageId,
      payload,
    }: {
      roomId: string;
      messageId: number;
      payload: ChatMessageUpdatePayload;
    }) => updateMessage(roomId, messageId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: chatKeys.messages(variables.roomId, 1, 20),
      });
      qc.invalidateQueries({ queryKey: chatKeys.rooms() });
      qc.invalidateQueries({ queryKey: chatKeys.room(variables.roomId) });
    },
  });
}

export function useDeleteChatMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      messageId,
    }: {
      roomId: string;
      messageId: number;
    }) => deleteMessage(roomId, messageId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: chatKeys.messages(variables.roomId, 1, 20),
      });
      qc.invalidateQueries({ queryKey: chatKeys.rooms() });
      qc.invalidateQueries({ queryKey: chatKeys.room(variables.roomId) });
    },
  });
}

export function useDownloadChatHistoryMutation() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/api/v1/chat/download/chat-history/', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const disposition = String(response.headers['content-disposition'] ?? '');
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] ?? 'chat-history.pdf';

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useChatRoomSocket({
  roomId,
  enabled = true,
  onChatMessage,
  onTyping,
  onSuggestion,
  onPresence,
  onPartnerStatus,
  onError,
  onDisconnected,
}: UseChatRoomSocketOptions) {
  const clientRef = useRef<ChatSocketClient | null>(null);
  const handlersRef = useRef({
    onChatMessage,
    onTyping,
    onSuggestion,
    onPresence,
    onPartnerStatus,
    onError,
    onDisconnected,
  });
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const [closeCode, setCloseCode] = useState<number | null>(null);
  const token = getStoredAccessToken();
  const canConnect = Boolean(enabled && roomId && token);

  useEffect(() => {
    handlersRef.current = {
      onChatMessage,
      onTyping,
      onSuggestion,
      onPresence,
      onPartnerStatus,
      onError,
      onDisconnected,
    };

    clientRef.current?.setHandlers(handlersRef.current);
  }, [
    onChatMessage,
    onDisconnected,
    onError,
    onPresence,
    onPartnerStatus,
    onSuggestion,
    onTyping,
  ]);

  useEffect(() => {
    if (!canConnect || !roomId || !token) {
      clientRef.current?.disconnect();
      return;
    }

    const client = new ChatSocketClient();
    client.setHandlers(handlersRef.current);
    client.connect({
      roomId,
      token,
      onStatusChange: (nextStatus, nextCloseCode) => {
        setStatus(nextStatus);
        setCloseCode(nextCloseCode ?? null);
      },
    });
    clientRef.current = client;

    return () => {
      client.disconnect();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [canConnect, roomId, token]);

  const sendJson = useCallback((payload: Record<string, unknown>) => {
    return clientRef.current?.sendJson(payload) ?? false;
  }, []);

  const sendMessage = useCallback(
    (message: string, replyTo: number | null = null, messageType = "text") =>
      clientRef.current?.sendMessage(message, replyTo, messageType) ?? false,
    [],
  );

  const requestFilter = useCallback(
    (message: string, messageType = "text") =>
      clientRef.current?.requestFilter(message, messageType) ?? false,
    [],
  );

  const requestSuggestion = useCallback(
    (message: string) => clientRef.current?.requestSuggestion(message) ?? false,
    [],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => clientRef.current?.sendTyping(isTyping) ?? false,
    [],
  );

  const sendSeen = useCallback(
    (messageIds: number[]) => clientRef.current?.sendSeen(messageIds) ?? false,
    [],
  );

  const sendAllSeen = useCallback(
    () => clientRef.current?.sendAllSeen() ?? false,
    [],
  );

  return useMemo(
    () => ({
      status: canConnect ? status : "idle",
      closeCode: canConnect ? closeCode : null,
      isConnected: canConnect && status === "connected",
      sendJson,
      sendMessage,
      requestFilter,
      requestSuggestion,
      sendTyping,
      sendSeen,
      sendAllSeen,
    }),
    [
      canConnect,
      closeCode,
      requestFilter,
      requestSuggestion,
      sendJson,
      sendMessage,
      sendAllSeen,
      sendSeen,
      sendTyping,
      status,
    ],
  );
}

export { chatKeys };