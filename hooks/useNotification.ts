import api from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DeviceTokenPayload,
  NotificationCountItem,
  NotificationCountType,
  NotificationItem,
  NotificationSettingItem,
  NotificationSettingsUpdatePayload,
} from '@/types/notification.type';

const notificationKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
  counts: () => ['notifications', 'counts'] as const,
  settings: () => ['notifications', 'settings'] as const,
};

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.results)) return record.results as T[];
  }

  return [];
}

async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await api.get('/api/v1/notification/notifications/');
  return normalizeArray<NotificationItem>(res.data?.data ?? res.data);
}

async function fetchNotificationCounts(): Promise<NotificationCountItem[]> {
  const res = await api.get('/api/v1/notification/notifications/counts/');
  return normalizeArray<NotificationCountItem>(res.data?.data ?? res.data);
}

async function fetchNotificationSettings(): Promise<NotificationSettingItem[]> {
  const res = await api.get('/api/v1/notification/notifications/settings/');
  return normalizeArray<NotificationSettingItem>(res.data?.data ?? res.data);
}

async function updateNotificationSettings(payload: NotificationSettingsUpdatePayload): Promise<NotificationSettingItem> {
  const res = await api.put('/api/v1/notification/notifications/settings/', payload);
  const data = res.data?.data;

  if (data && !Array.isArray(data)) {
    return data as NotificationSettingItem;
  }

  const list = normalizeArray<NotificationSettingItem>(data ?? res.data);
  return (
    list[0] ?? {
      id: 0,
      user: 0,
      email_notifications: payload.email_notifications,
      sms_notifications: payload.sms_notifications,
      push_notifications: payload.push_notifications,
    }
  );
}

async function submitDeviceToken(payload: DeviceTokenPayload): Promise<void> {
  await api.post('/api/v1/notification/device_token/', payload);
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: fetchNotifications,
    staleTime: 1000 * 30,
  });
}

export function useNotificationCountsQuery() {
  return useQuery({
    queryKey: notificationKeys.counts(),
    queryFn: fetchNotificationCounts,
    staleTime: 1000 * 30,
  });
}

export function useNotificationSettingsQuery() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: fetchNotificationSettings,
    staleTime: 1000 * 60,
  });
}

export function useUpdateNotificationSettingsMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.settings() });
      qc.invalidateQueries({ queryKey: notificationKeys.counts() });
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useDeviceTokenMutation() {
  return useMutation({
    mutationFn: submitDeviceToken,
  });
}

export function useRegisterDeviceTokenMutation() {
  const mutation = useDeviceTokenMutation();

  return {
    ...mutation,
    register: (token: string, type: DeviceTokenPayload['type'] = 'web') =>
      mutation.mutate({ token, type, operation_type: 'register' }),
  };
}

export function useUnregisterDeviceTokenMutation() {
  const mutation = useDeviceTokenMutation();

  return {
    ...mutation,
    unregister: (token: string) => mutation.mutate({ token, operation_type: 'unregister' }),
  };
}

export function useNotificationCountByType(type: NotificationCountType) {
  const countsQuery = useNotificationCountsQuery();

  const count = (countsQuery.data ?? []).find((item) => item.type === type)?.count ?? 0;

  return {
    ...countsQuery,
    count,
  };
}

export { notificationKeys };