import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiResponseEnvelope,
  CreateWalletTopupCheckoutPayload,
  WalletBalance,
  WalletCheckoutSession,
  WalletHistoryData,
  WalletTopupPackage,
} from "@/types/wallet.type";

const walletKeys = {
  all: ["wallet"] as const,
  balance: () => ["wallet", "balance"] as const,
  history: () => ["wallet", "history"] as const,
  packages: () => ["wallet", "packages"] as const,
};

function parseWalletApiError(err: unknown, fallbackMessage: string): Error {
  const fallback = new Error(fallbackMessage);
  if (!err || typeof err !== "object") return fallback;

  const response = (err as { response?: { status?: number; data?: unknown } })
    .response;
  const status = response?.status;
  const data = response?.data as
    | {
        message?: string;
        error?: { details?: unknown };
      }
    | undefined;

  if (status === 400) return new Error("Invalid wallet request.");
  if (status === 401) return new Error("Session expired. Please log in again.");
  if (status === 403)
    return new Error("You do not have permission for this action.");
  if (status === 404) return new Error("Wallet data not found.");
  if (status === 500)
    return new Error("Wallet service is temporarily unavailable.");

  if (typeof data?.message === "string" && data.message.trim()) {
    return new Error(data.message);
  }

  if (data?.error?.details) {
    const details = data.error.details;
    if (typeof details === "string" && details.trim()) {
      return new Error(details);
    }

    if (typeof details === "object") {
      const firstValue = Object.values(details as Record<string, unknown>)[0];
      if (typeof firstValue === "string" && firstValue.trim()) {
        return new Error(firstValue);
      }
      if (Array.isArray(firstValue) && firstValue.length > 0) {
        const firstItem = firstValue[0];
        if (typeof firstItem === "string" && firstItem.trim()) {
          return new Error(firstItem);
        }
      }
    }
  }

  return fallback;
}

function getEnvelopeData<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object") {
    const record = value as ApiResponseEnvelope<T> & { data?: unknown };
    if (record.data !== undefined) {
      return record.data as T;
    }
  }

  return fallback;
}

function normalizeWalletHistoryData(value: unknown): WalletHistoryData {
  if (!value || typeof value !== "object") {
    return { balance: 0, transactions: [] };
  }

  const record = value as { balance?: unknown; transactions?: unknown };
  const balance = Number(record.balance ?? 0);

  return {
    balance: Number.isFinite(balance) ? balance : 0,
    transactions: Array.isArray(record.transactions)
      ? (record.transactions as WalletHistoryData["transactions"])
      : [],
  };
}

function normalizeWalletTopupPackages(value: unknown): WalletTopupPackage[] {
  if (Array.isArray(value)) {
    return value as WalletTopupPackage[];
  }

  if (value && typeof value === "object") {
    const record = value as {
      results?: unknown;
      packages?: unknown;
      data?: unknown;
    };

    if (Array.isArray(record.results)) {
      return record.results as WalletTopupPackage[];
    }

    if (Array.isArray(record.packages)) {
      return record.packages as WalletTopupPackage[];
    }

    if (Array.isArray(record.data)) {
      return record.data as WalletTopupPackage[];
    }
  }

  return [];
}

async function fetchWalletBalance(): Promise<WalletBalance> {
  try {
    const res = await api.get<ApiResponseEnvelope<WalletBalance>>(
      "/api/v1/twilio/wallet/",
    );
    return getEnvelopeData<WalletBalance>(res.data, { balance: 0 });
  } catch (error) {
    throw parseWalletApiError(error, "Failed to fetch wallet balance.");
  }
}

async function fetchWalletHistory(): Promise<WalletHistoryData> {
  try {
    const res = await api.get<ApiResponseEnvelope<WalletHistoryData>>(
      "/api/v1/twilio/wallet/history/",
    );
    const raw = getEnvelopeData<unknown>(res.data, {});
    return normalizeWalletHistoryData(raw);
  } catch (error) {
    throw parseWalletApiError(error, "Failed to fetch wallet history.");
  }
}

async function fetchWalletTopupPackages(): Promise<WalletTopupPackage[]> {
  try {
    const res = await api.get<ApiResponseEnvelope<WalletTopupPackage[]>>(
      "/api/v1/twilio/wallet/topup/packages/",
    );
    const raw = getEnvelopeData<unknown>(res.data, []);
    return normalizeWalletTopupPackages(raw);
  } catch (error) {
    throw parseWalletApiError(error, "Failed to fetch top-up packages.");
  }
}

function parseAmountValue(value: number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

async function createWalletTopupCheckout(
  payload: CreateWalletTopupCheckoutPayload,
): Promise<WalletCheckoutSession> {
  const normalizedAmount = parseAmountValue(payload.amount);
  const normalizedPackageId =
    payload.package_id !== undefined ? Number(payload.package_id) : undefined;

  const requestPayload: CreateWalletTopupCheckoutPayload = {};

  if (
    normalizedPackageId !== undefined &&
    Number.isFinite(normalizedPackageId)
  ) {
    requestPayload.package_id = normalizedPackageId;
  }

  if (normalizedAmount !== undefined) {
    requestPayload.amount = normalizedAmount;
  }

  try {
    const res = await api.post<ApiResponseEnvelope<WalletCheckoutSession>>(
      "/api/v1/twilio/wallet/",
      requestPayload,
    );
    return res.data.data;
  } catch (error) {
    throw parseWalletApiError(error, "Failed to create checkout session.");
  }
}

export function useWalletBalanceQuery() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: fetchWalletBalance,
    staleTime: 1000 * 20,
  });
}

export function useWalletHistoryQuery(enabled = true) {
  return useQuery({
    queryKey: walletKeys.history(),
    queryFn: fetchWalletHistory,
    staleTime: 1000 * 15,
    enabled,
    retry: false,
  });
}

export function useWalletTopupPackagesQuery() {
  return useQuery({
    queryKey: walletKeys.packages(),
    queryFn: fetchWalletTopupPackages,
    staleTime: 1000 * 60,
  });
}

export function useCreateWalletTopupCheckoutMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createWalletTopupCheckout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.balance() });
      qc.invalidateQueries({ queryKey: walletKeys.history() });
    },
  });
}

export { parseWalletApiError, walletKeys };
