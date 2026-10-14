import api from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CalendarListResponse,
  EventReadItem,
  EventUpsertPayload,
  EventWriteResponse,
  HolidayItem,
  HolidayUpsertPayload,
} from '@/types/calendar.type';

// ── Query key factory ───────────────────────────────────────────────────────
export const eventKeys = {
  all: ['events'] as const,
  list: (params?: Record<string, string>) => ['events', 'list', params ?? {}] as const,
  calendar: (params?: Record<string, string>) => ['events', 'calendar', params ?? {}] as const,
  detail: (id: number) => ['events', 'detail', id] as const,
  holidays: () => ['events', 'holidays'] as const,
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function toQueryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, v);
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

// ── API calls ────────────────────────────────────────────────────────────────

async function fetchCalendarList(params?: Record<string, string>): Promise<CalendarListResponse> {
  const qs = params ? toQueryString(params) : '';
  const res = await api.get<{ data: CalendarListResponse }>(`/api/v1/event/calendar/${qs}`);
  return res.data.data;
}

async function fetchEventList(params?: Record<string, string>): Promise<CalendarListResponse> {
  const qs = params ? toQueryString(params) : '';
  const res = await api.get<{ data: CalendarListResponse }>(`/api/v1/event/list/${qs}`);
  return res.data.data;
}

async function fetchEventDetail(id: number): Promise<EventReadItem> {
  const res = await api.get<{ data: EventReadItem }>(`/api/v1/event/${id}/`);
  return res.data.data;
}

async function createEvent(payload: EventUpsertPayload): Promise<EventWriteResponse> {
  const res = await api.post<{ data: EventWriteResponse }>('/api/v1/event/add/', payload);
  return res.data.data;
}

async function updateEvent(id: number, payload: Partial<EventUpsertPayload>): Promise<EventWriteResponse> {
  const res = await api.patch<{ data: EventWriteResponse }>(`/api/v1/event/${id}/edit/`, payload);
  return res.data.data;
}

async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/api/v1/event/${id}/delete/`);
}

async function fetchHolidayList(): Promise<HolidayItem[]> {
  const res = await api.get<{ data: HolidayItem[] }>('/api/v1/event/holiday/list/');
  return res.data.data;
}

async function createHoliday(payload: HolidayUpsertPayload): Promise<HolidayItem> {
  const res = await api.post<{ data: HolidayItem }>('/api/v1/event/holiday/add/', payload);
  return res.data.data;
}

async function updateHoliday(id: number, payload: Partial<HolidayUpsertPayload>): Promise<HolidayItem> {
  const res = await api.patch<{ data: HolidayItem }>(`/api/v1/event/holiday/${id}/edit/`, payload);
  return res.data.data;
}

async function deleteHoliday(id: number): Promise<void> {
  await api.delete(`/api/v1/event/holiday/${id}/delete/`);
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/** Calendar list — used for all calendar views. Caches per param set. */
export function useCalendarListQuery(params?: Record<string, string>) {
  return useQuery({
    queryKey: eventKeys.calendar(params),
    queryFn: () => fetchCalendarList(params),
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/** Event list with optional filters */
export function useEventListQuery(params?: Record<string, string>) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => fetchEventList(params),
    staleTime: 1000 * 60 * 2,
  });
}

/** Single event detail */
export function useEventDetailQuery(id: number) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => fetchEventDetail(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/** Holiday list */
export function useHolidayListQuery() {
  return useQuery({
    queryKey: eventKeys.holidays(),
    queryFn: fetchHolidayList,
    staleTime: 1000 * 60 * 5,
  });
}

/** Create event — invalidates all calendar and event list caches on success */
export function useCreateEventMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/** Update event — invalidates all caches and the specific detail cache */
export function useUpdateEventMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<EventUpsertPayload>;
    }) => updateEvent(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
      qc.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
    },
  });
}

/** Delete event — invalidates all caches */
export function useDeleteEventMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/** Create holiday — invalidates holiday and calendar caches */
export function useCreateHolidayMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/** Update holiday */
export function useUpdateHolidayMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<HolidayUpsertPayload>;
    }) => updateHoliday(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

/** Delete holiday */
export function useDeleteHolidayMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// ── Convenience selectors ────────────────────────────────────────────────────

/** Returns the full calendar data split into events and holidays. */
export function useCalendarData(params?: Record<string, string>) {
  const query = useCalendarListQuery(params);
  return {
    ...query,
    events: query.data?.events ?? [],
    holidays: query.data?.holidays ?? [],
  };
}
