# ParentBridge Notifications API Guide (Frontend)

This guide covers only Notifications module integration for frontend.

## Base URL

- HTTP base: http://localhost:7000
- Notifications prefix: /api/v1/notification/
- All endpoints require JWT access token.

## Authentication

Send on every request:

```http
Authorization: Bearer <access_token>
```

## Response Envelope

Notifications endpoints use ApiResponse wrapper.

Success:

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "meta": {
    "timestamp": "2026-04-12T15:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error:

```json
{
  "success": false,
  "message": "...",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T15:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## Endpoint Summary

1. GET /api/v1/notification/notifications/
2. GET /api/v1/notification/notifications/counts/
3. GET /api/v1/notification/notifications/settings/
4. PUT /api/v1/notification/notifications/settings/
5. POST /api/v1/notification/device_token/

---

## Data Contracts

### Notification

```ts
type NotificationItem = {
  id: number;
  user: number;
  message: string;
  is_read: boolean;
  created_at: string;
};
```

### Notification Count

```ts
type NotificationCountItem = {
  id: number;
  user: number;
  type: 'messages' | 'calls' | 'documents' | 'legal_records' | 'calendar' | 'support' | 'others';
  count: number;
};
```

### Notification Settings

```ts
type NotificationSettingItem = {
  id: number;
  user: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
};
```

---

## 1) Get Notifications

### GET /api/v1/notification/notifications/

Returns latest 10 notifications for authenticated user ordered by newest first.

Success 200:

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "id": 21,
      "user": 5,
      "message": "You have a new support comment",
      "is_read": false,
      "created_at": "2026-04-12T15:20:00Z"
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T15:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Possible error:

- 500 internal server error with details.error.

---

## 2) Get Notification Counts

### GET /api/v1/notification/notifications/counts/

Success 200:

```json
{
  "success": true,
  "message": "Notification counts retrieved successfully",
  "data": [
    {
      "id": 2,
      "user": 5,
      "type": "messages",
      "count": 3
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T15:31:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Possible error:

- 500 with generic error message.

---

## 3) Get Notification Settings

### GET /api/v1/notification/notifications/settings/

Success 200:

```json
{
  "success": true,
  "message": "Notification settings retrieved successfully",
  "data": [
    {
      "id": 1,
      "user": 5,
      "email_notifications": true,
      "sms_notifications": false,
      "push_notifications": true
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T15:32:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Note:

- Backend returns a list, not a single object.

---

## 4) Update Notification Settings

### PUT /api/v1/notification/notifications/settings/

Request (intended):

```json
{
  "email_notifications": true,
  "sms_notifications": false,
  "push_notifications": true,
  "type": "messages"
}
```

Intended success 200:

```json
{
  "success": true,
  "message": "Notification setting updated successfully",
  "data": {
    "id": 1,
    "user": 5,
    "email_notifications": true,
    "sms_notifications": false,
    "push_notifications": true
  },
  "meta": {
    "timestamp": "2026-04-12T15:33:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Current backend caveat:

- View tries to query NotificationSetting by a type field, but NotificationSetting model has no type field.
- This can cause runtime errors or not-found behavior.

Frontend fallback recommendation:

- Use GET settings as source of truth.
- If PUT fails unexpectedly, show generic error and keep existing toggle states until backend fix.

---

## 5) Register or Unregister Device Token

### POST /api/v1/notification/device_token/

Request for register:

```json
{
  "token": "fcm_device_token_here",
  "type": "android",
  "operation_type": "register"
}
```

Request for unregister:

```json
{
  "token": "fcm_device_token_here",
  "operation_type": "unregister"
}
```

Success messages:

- Device token registered successfully
- Device token unregistered successfully

Missing token error 400:

```json
{
  "success": false,
  "message": "Token is required",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T15:34:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Current backend caveat:

- Register flow currently deletes existing token and may skip create due to exception logic.
- Frontend should treat success response optimistically but not assume token is persisted.

Suggested frontend behavior:

- Send token on every app launch/login and also after refresh-token events.
- If push is critical, verify by checking notification delivery instead of relying only on registration response.

---

## Frontend Error Handling Recommendation

Parse in this order:

1. message
2. error.details field errors
3. error.details.error
4. generic fallback by status code

Fallback strings:

- 400: Invalid notification request.
- 401: Session expired. Please log in again.
- 404: Notification setting not found.
- 500: Could not load notifications right now.

---

## Practical Frontend Flow

1. On app load, call GET notifications and GET counts in parallel.
2. On settings screen load, call GET settings.
3. On settings toggle change, call PUT settings, then re-fetch GET settings.
4. On login and token refresh, call POST device_token with operation_type register.
5. On logout, call POST device_token with operation_type unregister.
