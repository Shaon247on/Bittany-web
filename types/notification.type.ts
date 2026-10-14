export type NotificationCountType =
  | 'messages'
  | 'calls'
  | 'documents'
  | 'legal_records'
  | 'calendar'
  | 'support'
  | 'others';

export interface NotificationItem {
  id: number;
  user: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationCountItem {
  id: number;
  user: number;
  type: NotificationCountType;
  count: number;
}

export interface NotificationSettingItem {
  id: number;
  user: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
}

export interface NotificationSettingsUpdatePayload {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  type?: NotificationCountType;
}

export type DeviceTokenPlatform = 'android' | 'ios' | 'web';

export interface DeviceTokenPayload {
  token: string;
  operation_type: 'register' | 'unregister';
  type?: DeviceTokenPlatform;
}