// ── UI model used by calendar view components ──────────────────────────────
export interface CalendarEvent {
  id: string;
  sourceId: number;
  sourceKind: "event" | "holiday";
  title: string;
  date: Date;
  category: "Activity" | "School" | "Custody" | "Medical" | "Other" | "Holiday";
  time?: string;
  childId?: number | null;
  type?: EventType;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  repeat?: RepeatMode;
  customStartDate?: string | null;
  customEndDate?: string | null;
  reminderMinutes?: number;
  description?: string | null;
}

// ── API types ───────────────────────────────────────────────────────────────

export type EventType = "activity" | "school" | "custody" | "medical" | "other";
export type RepeatMode = "once" | "weekly" | "monthly" | "custom";

export interface EventChild {
  id: number;
  name: string;
  date_of_birth: string;
  age: number;
}

export interface EventReadItem {
  id: number;
  child: EventChild | null;
  post_by: string;
  title: string;
  type: EventType;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  repeat: RepeatMode;
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
  type: EventType;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  repeat: RepeatMode;
  custom_start_date: string | null;
  custom_end_date: string | null;
  reminder_minutes: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventUpsertPayload {
  child: number;
  title: string;
  type: EventType;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  repeat?: RepeatMode;
  custom_start_date?: string | null;
  custom_end_date?: string | null;
  reminder_minutes?: number;
  description?: string | null;
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

export interface HolidayUpsertPayload {
  child?: number | null;
  name: string;
  start_date: string;
  end_date: string;
  assigned_to?: string | null;
  location?: string | null;
  description?: string | null;
}

export interface CalendarListResponse {
  events: EventReadItem[];
  holidays: HolidayItem[];
}
