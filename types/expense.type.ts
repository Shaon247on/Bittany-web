export type ExpenseVisibility = "private" | "shared";
export type ExpenseApprovalStatus = "not_required" | "pending" | "approved" | "rejected";
export type ExpenseAgreementStatus =
  | "not_discussed"
  | "agreed_in_app"
  | "reported_agreed_offline"
  | "confirmed"
  | "disputed";
export type ExpensePaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "paid_by_creator"
  | "paid_by_partner"
  | "paid_by_both";
export type ExpenseSettlementStatus =
  | "not_applicable"
  | "outstanding"
  | "partially_settled"
  | "settled";

export interface ExpenseCoParent {
  id: number | "";
  name: string;
  email: string;
}

export interface ExpenseShare {
  your_share?: string | number;
  co_parent_share?: string | number;
}

export interface ExpenseListItem {
  id: number;
  user: number;
  co_parent?: ExpenseCoParent | null;
  child: number | null;
  title: string | null;
  paid_date: string | null;
  due_date: string | null;
  amount: string | number;
  category: string | null;
  share: ExpenseShare;
  description: string | null;
  expense_payments?: Array<number | Record<string, unknown>>;
  visibility?: ExpenseVisibility;
  bridge_mode?: boolean;
  approval_status?: ExpenseApprovalStatus;
  agreement_status?: ExpenseAgreementStatus;
  payment_status?: ExpensePaymentStatus;
  settlement_status?: ExpenseSettlementStatus;
  father_share?: string | number;
  mother_share?: string | number;
  paid_by?: number | null;
  rejection_reason?: string | null;
  outstanding_from_partner?: string | number | null;
  outstanding_amount?: string | number | null;
  status?: string;
  attachment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseUpsertPayload {
  child?: number | null;
  title?: string | null;
  paid_date?: string | null;
  due_date?: string | null;
  amount: string | number;
  category?: string | null;
  father_percentage?: string | number;
  mother_percentage?: string | number;
  description?: string | null;
}

export interface ExpenseSummary {
  total_expense: string;
  pending_expense: string;
  your_expense: string;
  partner_total_expense: string;
  total_paid?: string;
  outstanding_from_partner?: string;
  mode?: "independent" | "bridge";
}

export interface ExpenseMarkPaidPayload {
  amount: string | number;
  payment_method:
    | "cash"
    | "check"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "mobile_payment"
    | "other";
}

export interface ExpenseListResponse {
  expenses: ExpenseListItem[];
}

export interface ExpenseCardItem {
  id: number;
  title: string;
  amount: string | number;
  category: string;
  visibility: ExpenseVisibility;
  approvalStatus: ExpenseApprovalStatus;
  agreementStatus: ExpenseAgreementStatus;
  paymentStatus: ExpensePaymentStatus;
  settlementStatus: ExpenseSettlementStatus;
  date: string;
  paidBy: string;
  splitWith: string;
  childId: number | null;
  dueDate: string | null;
  description: string | null;
  rejectionReason: string | null;
  settlementAmount: string | number | null;
  yourShare: string | number;
  coParentShare: string | number;
}
