export interface DashboardSummaryMessageSender {
  id: number;
  username: string;
  name: string;
  image: string | null;
  role: string;
}

export interface DashboardSummaryMessage {
  id: number;
  message: string;
  sender: DashboardSummaryMessageSender;
  timestamp: string;
}

export interface DashboardSummaryCall {
  id?: number;
  name?: string;
  caller?: string;
  callee?: string;
  type?: string;
  duration?: string | number;
  timestamp?: string;
  created_at?: string;
}

export interface DashboardSummaryEvent {
  id?: number;
  title?: string;
  name?: string;
  date?: string;
  start_date?: string;
  start_time?: string;
  end_time?: string;
  time?: string;
}

export interface DashboardSummaryData {
  messages_today: number;
  events_this_week: number;
  pending_expenses: number;
  last_3_messages: DashboardSummaryMessage[];
  unread_messages: number;
  recent_calls_number: number;
  total_documents: number;
  expenses_pending_number: number;
  last_3_calls: DashboardSummaryCall[];
  upcoming_3_events: DashboardSummaryEvent[];
}

export interface DashboardSummaryEventMessage {
  type: 'dashboard_summary';
  data: DashboardSummaryData;
}

export type DashboardSocketInboundEvent = DashboardSummaryEventMessage | { type: string; [key: string]: unknown };