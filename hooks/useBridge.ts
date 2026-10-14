import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';

export interface BridgeChild {
  id: number;
  name: string;
  date_of_birth: string;
  gender?: string;
}

export interface ParentBridgeInfo {
  id?: number;
  bridge_id?: string;
  partner?: {
    id: number;
    username: string;
    name: string;
    image: string | null;
    role?: string;
  };
  father: string | null;
  mother: string | null;
  mode: "bridge" | "independent";
  children: Array<{ id: number; name: string }>;
  created_at: string;
}

export interface CoParentContact {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  relationship?: string;
}

type BridgeEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function parseBridgeError(error: unknown) {
  const err = error as {
    response?: {
      status?: number;
      data?: { message?: string; error?: { details?: unknown } };
    };
  };

  const status = err?.response?.status;
  const details = err?.response?.data?.error?.details;
  const message = err?.response?.data?.message;

  if (typeof details === "string" && details) throw new Error(details);
  if (message) throw new Error(message);
  if (status === 404)
    throw new Error("No bridge data found for this account yet.");
  if (status === 500)
    throw new Error("Could not load bridge data. Please try again.");
  throw error;
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as T[];
    if (Array.isArray(record.children)) return record.children as T[];
    if (Array.isArray(record.data)) return record.data as T[];
  }

  return [];
}

async function fetchBridgeChildren(): Promise<BridgeChild[]> {
  try {
    const res = await api.get<BridgeEnvelope<BridgeChild[]>>(
      "/api/v1/bridge/childrens/",
    );
    return normalizeArray<BridgeChild>(res.data.data);
  } catch (error) {
    parseBridgeError(error);
    return [];
  }
}

async function fetchBridgeInfo(): Promise<ParentBridgeInfo | null> {
  try {
    const res = await api.get<BridgeEnvelope<ParentBridgeInfo>>(
      "/api/v1/bridge/info/",
    );
    return res.data.data ?? null;
  } catch (error) {
    parseBridgeError(error);
    return null;
  }
}

async function fetchCoParentContacts(): Promise<CoParentContact[]> {
  try {
    const res = await api.get<BridgeEnvelope<CoParentContact[]>>(
      "/api/v1/bridge/co-parents/contacts/",
    );
    return normalizeArray<CoParentContact>(res.data.data);
  } catch (error) {
    const err = error as { response?: { status?: number } };
    if (err?.response?.status === 500) {
      return [];
    }
    parseBridgeError(error);
    return [];
  }
}

export function useBridgeChildrenQuery() {
  return useQuery({
    queryKey: ["bridge", "children"],
    queryFn: fetchBridgeChildren,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBridgeInfoQuery() {
  return useQuery({
    queryKey: ["bridge", "info"],
    queryFn: fetchBridgeInfo,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCoParentContactsQuery() {
  return useQuery({
    queryKey: ["bridge", "co-parent-contacts"],
    queryFn: fetchCoParentContacts,
    staleTime: 1000 * 60 * 5,
  });
}
