export interface PaymentApiMeta {
  timestamp?: string;
  request_id?: string;
}

export interface PaymentApiErrorBody {
  code?: string;
  details?: unknown;
}

export interface PaymentApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: PaymentApiErrorBody;
  meta?: PaymentApiMeta;
}

export interface PlanDescription {
  id: number;
  text: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_price: string | null;
  yearly_price: string | null;
  apple_product_id: string | null;
  google_product_id: string | null;
  descriptions: PlanDescription[];
  current_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUser {
  id: number;
  username: string;
  name: string | null;
  image: string | null;
  role: string;
}

export interface ActiveSubscription {
  id: number;
  user: SubscriptionUser;
  plan: number | null;
  status: "free" | "premium" | "canceled" | "expired" | "refunded" | "paused" | "trial" | "incomplete";
  price: string;
  duration_days: number;
  duration_type: "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  auto_renew: boolean;
  provider: "stripe" | "apple" | "google";
  environment: string | null;
  stripe_subscription_id: string | null;
  payment_intent_id: string | null;
  apple_original_transaction_id: string | null;
  apple_receipt: string | null;
  google_purchase_token: string | null;
  google_order_id: string | null;
  invoice: string | null;
  reminder_sent: unknown[];
  last_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistoryData {
  subscription: ActiveSubscription | null;
}

export interface SubscriptionCheckoutPayload {
  plan_id: number;
  plan_duration: "monthly" | "yearly";
  auto_renew?: boolean;
  payment_platform?: "stripe";
}

export interface SubscriptionCheckoutSession {
  session_id: string;
  checkout_url: string;
}

export interface CheckoutSessionRetrieval {
  id: string;
  object?: string;
  mode?: string;
  payment_status?: string;
  status?: string;
}
