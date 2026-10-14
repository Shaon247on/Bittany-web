export type EventApiType =
  | "activity"
  | "school"
  | "custody"
  | "medical"
  | "other";
export type EventApiRepeat = "once" | "weekly" | "monthly" | "custom";

export interface EventApiChild {
  id: number;
  name: string;
  date_of_birth: string;
  age: number;
}

export interface EventReadItem {
  id: number;
  child: EventApiChild | null;
  post_by: string;
  title: string;
  type: EventApiType;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  repeat: EventApiRepeat;
  custom_start_date: string | null;
  custom_end_date: string | null;
  reminder_minutes: number;
  description: string | null;
  previous_occurrences?: string[];
  occurrences?: string[];
  created_at: string;
  updated_at: string;
}

export interface EventWriteResponse {
  id: number;
  child: number;
  title: string;
  type: EventApiType;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  repeat: EventApiRepeat;
  custom_start_date: string | null;
  custom_end_date: string | null;
  reminder_minutes: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface HolidayItem {
  id: number;
  child: number | null;
  child_name: string | null;
  post_by: string;
  name: string;
  start_date: string;
  end_date: string;
  assigned_to: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventCalendarData {
  events: EventReadItem[];
  holidays: HolidayItem[];
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp?: string;
    request_id?: string;
  };
  error?: {
    code?: string;
    details?: Record<string, unknown>;
  };
}

export interface EventEditPayload {
  child?: number;
  title?: string;
  type?: EventApiType;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  repeat?: EventApiRepeat;
  custom_start_date?: string | null;
  custom_end_date?: string | null;
  reminder_minutes?: number;
  description?: string | null;
}

export interface EventCreatePayload {
  child: number;
  title: string;
  type: EventApiType;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  repeat?: EventApiRepeat;
  custom_start_date?: string | null;
  custom_end_date?: string | null;
  reminder_minutes?: number;
  description?: string | null;
}

export interface HolidayUpsertPayload {
  child?: number | null;
  name: string;
  start_date: string;
  end_date: string;
  assigned_to?: string | null;
  location?: string | null;
  description?: string | null;
}
