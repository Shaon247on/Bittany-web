import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import type { CallHistoryItem, WebRTCUser } from "@/types/call.type";

const callKeys = {
  all: ["call"] as const,
  webrtcUsers: () => ["call", "webrtc-users"] as const,
  webrtcHistory: () => ["call", "webrtc-history"] as const,
};

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as T[];
    if (Array.isArray(record.calls)) return record.calls as T[];
    if (Array.isArray(record.users)) return record.users as T[];
    if (record.data && typeof record.data === "object") {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.results)) return nested.results as T[];
      if (Array.isArray(nested.calls)) return nested.calls as T[];
      if (Array.isArray(nested.users)) return nested.users as T[];
    }
  }
  return [];
}

async function fetchWebRTCUsers(): Promise<WebRTCUser[]> {
  const res = await api.get("/api/v1/call/webrtc/users/");
  return normalizeArray<WebRTCUser>(res.data);
}

async function fetchWebRTCHistory(): Promise<CallHistoryItem[]> {
  const res = await api.get("/api/v1/call/webrtc/history/");
  return normalizeArray<CallHistoryItem>(res.data);
}

export function useWebRTCUsersQuery() {
  return useQuery({
    queryKey: callKeys.webrtcUsers(),
    queryFn: fetchWebRTCUsers,
    staleTime: 1000 * 30,
  });
}

export function useWebRTCHistoryQuery() {
  return useQuery({
    queryKey: callKeys.webrtcHistory(),
    queryFn: fetchWebRTCHistory,
    staleTime: 1000 * 10,
  });
}

export { callKeys };
