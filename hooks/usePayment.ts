import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ActiveSubscription,
  CheckoutSessionRetrieval,
  PaymentApiResponse,
  SubscriptionCheckoutPayload,
  SubscriptionCheckoutSession,
  SubscriptionHistoryData,
  SubscriptionPlan,
} from "@/types/payment.type";

const paymentKeys = {
  all: ["payment"] as const,
  plans: () => ["payment", "plans"] as const,
  subscriptionHistory: () => ["payment", "subscription", "history"] as const,
  checkoutSession: (sessionId: string) =>
    ["payment", "checkout-session", sessionId] as const,
};

function parsePaymentApiError(error: unknown, fallbackMessage: string): Error {
  const fallback = new Error(fallbackMessage);

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const response = error as {
    response?: {
      status?: number;
      data?: { message?: string; error?: { details?: unknown } };
    };
  };

  const status = response.response?.status;
  const data = response.response?.data;

  if (status === 400)
    return new Error(data?.message ?? "Invalid subscription request.");
  if (status === 401) return new Error("Session expired. Please log in again.");
  if (status === 403)
    return new Error("You do not have permission for this action.");
  if (status === 404)
    return new Error(data?.message ?? "Subscription data not found.");
  if (status === 500)
    return new Error("Subscription service is temporarily unavailable.");

  if (typeof data?.message === "string" && data.message.trim()) {
    return new Error(data.message);
  }

  const details = data?.error?.details;
  if (typeof details === "string" && details.trim()) {
    return new Error(details);
  }

  if (details && typeof details === "object") {
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

  return fallback;
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.plans)) return record.plans as T[];
    if (Array.isArray(record.subscriptions)) return record.subscriptions as T[];
  }
  return [];
}

function normalizeSubscriptionHistory(value: unknown): SubscriptionHistoryData {
  if (!value || typeof value !== "object") {
    return { subscription: null };
  }

  const record = value as { subscription?: unknown; data?: unknown };

  if (record.subscription && typeof record.subscription === "object") {
    return { subscription: record.subscription as ActiveSubscription };
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as { subscription?: unknown };
    if (nested.subscription && typeof nested.subscription === "object") {
      return { subscription: nested.subscription as ActiveSubscription };
    }
  }

  return { subscription: null };
}

function getEnvelopeValue<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object") {
    const record = value as PaymentApiResponse<T> & { data?: unknown };
    if (record.data !== undefined) {
      return record.data as T;
    }
  }

  return fallback;
}

async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const res = await api.get<PaymentApiResponse<SubscriptionPlan[]>>(
      "/api/v1/payment/plan/",
    );
    return normalizeArray<SubscriptionPlan>(getEnvelopeValue(res.data, []));
  } catch (error) {
    throw parsePaymentApiError(error, "Failed to load subscription plans.");
  }
}

async function fetchActiveSubscription(): Promise<SubscriptionHistoryData> {
  try {
    const res = await api.get<PaymentApiResponse<SubscriptionHistoryData>>(
      "/api/v1/payment/subscription/history/",
    );
    return normalizeSubscriptionHistory(getEnvelopeValue(res.data, {}));
  } catch (error) {
    const response = error as { response?: { status?: number } };
    if (response?.response?.status === 404) {
      return { subscription: null };
    }
    throw parsePaymentApiError(error, "Failed to load subscription status.");
  }
}

async function createSubscriptionCheckout(
  payload: SubscriptionCheckoutPayload,
): Promise<SubscriptionCheckoutSession> {
  try {
    const res = await api.post<PaymentApiResponse<SubscriptionCheckoutSession>>(
      "/api/v1/payment/checkout-session/",
      payload,
    );
    const data = getEnvelopeValue(
      res.data,
      null as unknown as SubscriptionCheckoutSession,
    );
    return data;
  } catch (error) {
    throw parsePaymentApiError(error, "Failed to create checkout session.");
  }
}

async function retrieveCheckoutSession(
  sessionId: string,
): Promise<CheckoutSessionRetrieval> {
  try {
    const res = await api.get<PaymentApiResponse<CheckoutSessionRetrieval>>(
      "/api/v1/payment/checkout-session/retrieve/",
      { params: { session_id: sessionId } },
    );
    return getEnvelopeValue(res.data, { id: sessionId });
  } catch (error) {
    throw parsePaymentApiError(error, "Failed to retrieve checkout session.");
  }
}

async function cancelSubscription(): Promise<void> {
  try {
    await api.post<PaymentApiResponse<unknown>>(
      "/api/v1/payment/subscription/cancel/",
    );
  } catch (error) {
    throw parsePaymentApiError(error, "Failed to cancel subscription.");
  }
}

export function useSubscriptionPlansQuery() {
  return useQuery({
    queryKey: paymentKeys.plans(),
    queryFn: fetchSubscriptionPlans,
    staleTime: 1000 * 60 * 5,
  });
}

export function useActiveSubscriptionQuery(enabled = true) {
  return useQuery({
    queryKey: paymentKeys.subscriptionHistory(),
    queryFn: fetchActiveSubscription,
    enabled,
    retry: false,
    staleTime: 1000 * 30,
  });
}

export function useCreateSubscriptionCheckoutMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createSubscriptionCheckout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.subscriptionHistory() });
    },
  });
}

export function useRetrieveCheckoutSessionQuery(sessionId?: string) {
  return useQuery({
    queryKey: sessionId
      ? paymentKeys.checkoutSession(sessionId)
      : paymentKeys.checkoutSession(""),
    queryFn: () => retrieveCheckoutSession(sessionId ?? ""),
    enabled: Boolean(sessionId),
    retry: false,
    staleTime: 1000 * 10,
  });
}

export function useCancelSubscriptionMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.subscriptionHistory() });
    },
  });
}

export { paymentKeys, parsePaymentApiError };
