export interface ApiMeta {
  timestamp?: string;
  request_id?: string;
}

export interface ApiErrorBody {
  code?: string;
  details?: unknown;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: ApiErrorBody;
  meta?: ApiMeta;
}

export interface WalletBalance {
  balance: number;
}

export interface WalletCheckoutSession {
  checkout_url: string;
  session_id: string;
  amount: number;
  bonus_amount: number;
  package_id: string;
}

export interface WalletTransaction {
  id: number;
  amount: string;
  transaction_type: "credit" | "debit";
  transaction_type_display: string;
  cost_type: "call" | "sms" | "topup" | "other";
  cost_type_display: string;
  description: string | null;
  created_at: string;
}

export interface WalletTopupPackage {
  id: number;
  amount: string;
  bonus: string;
  description: string | null;
}

export interface WalletHistoryData {
  balance: number;
  transactions: WalletTransaction[];
}

export interface CreateWalletTopupCheckoutPayload {
  amount?: number;
  package_id?: number;
}
