# ParentBridge Event API Guide (Frontend)

This guide covers the Event module and its Holiday endpoints so frontend developers can integrate the calendar/event flows against the current backend behavior.

## Base URL

- Local backend example: `http://localhost:7000`
- Event API prefix: `/api/v1/event/`
- Full example: `GET /api/v1/event/list/`

## Authentication

All Event endpoints require a JWT access token.

Send this header on every request:

```http
Authorization: Bearer <access_token>
```

For token issuance and refresh flow, see `docs/authentication-frontend-guide.md`.

## Response Envelope

These endpoints use the shared `ApiResponse` wrapper for both success and failure responses.

Success shape:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {
    "timestamp": "2026-04-18T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error shape:

```json
{
  "success": false,
  "message": "...",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-18T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## Endpoint Summary

1. `POST /api/v1/event/add/`
2. `GET /api/v1/event/list/`
3. `GET /api/v1/event/calendar/`
4. `GET /api/v1/event/{event_id}/`
5. `PATCH /api/v1/event/{event_id}/edit/`
6. `DELETE /api/v1/event/{event_id}/delete/`
7. `POST /api/v1/event/holiday/add/`
8. `GET /api/v1/event/holiday/list/`
9. `PATCH /api/v1/event/holiday/{holiday_id}/edit/`
10. `DELETE /api/v1/event/holiday/{holiday_id}/delete/`

## Integration Notes

- `child` is sent as a numeric ID in create/update requests.
- Event create/update responses return `child` as a numeric ID.
- Event list/detail/calendar responses return `child` as an object with `id`, `name`, `date_of_birth`, and `age`.
- Holidays are returned with both `child` and `child_name`.
- `type` for events means event category: `activity | school | custody | medical | other`.
- `repeat` for events means recurrence mode: `once | weekly | monthly | custom`.
- `GET /list/` and `GET /calendar/` both return holidays alongside events.
- Holidays are not filtered by `start_date`, `end_date`, or `type`; the backend always returns the full authenticated user's holiday list.
- `weekly` and `monthly` filters work against the event `date` field only.
- `custom` is a valid stored repeat value, but there is no dedicated query filter for it.
- `DELETE` endpoints respond with HTTP `204 No Content`; do not rely on a response body even though the backend uses the standard wrapper helper.

## Event Data Contract

### Event create/update payload

```ts
type EventUpsertPayload = {
  child: number;
  title: string;
  type: 'activity' | 'school' | 'custody' | 'medical' | 'other';
  date?: string | null; // YYYY-MM-DD
  start_time?: string | null; // HH:MM[:SS]
  end_time?: string | null; // HH:MM[:SS]
  location?: string | null;
  repeat?: 'once' | 'weekly' | 'monthly' | 'custom';
  custom_start_date?: string | null; // YYYY-MM-DD
  custom_end_date?: string | null; // YYYY-MM-DD
  reminder_minutes?: number;
  description?: string | null;
};
```

### Event create/update response item

```ts
type EventWriteResponse = {
  id: number;
  child: number;
  title: string;
  type: 'activity' | 'school' | 'custody' | 'medical' | 'other';
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  repeat: 'once' | 'weekly' | 'monthly' | 'custom';
  custom_start_date: string | null;
  custom_end_date: string | null;
  reminder_minutes: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};
```

### Event list/detail/calendar item

```ts
type EventReadItem = {
  id: number;
  child: {
    id: number;
    name: string;
    date_of_birth: string;
    age: number;
  } | null;
  post_by: string;
  title: string;
  type: 'activity' | 'school' | 'custody' | 'medical' | 'other';
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  repeat: 'once' | 'weekly' | 'monthly' | 'custom';
  custom_start_date: string | null;
  custom_end_date: string | null;
  reminder_minutes: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};
```

## Holiday Data Contract

### Holiday create/update payload

```ts
type HolidayUpsertPayload = {
  child?: number | null;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  assigned_to?: string | null;
  location?: string | null;
  description?: string | null;
};
```

### Holiday response item

```ts
type HolidayItem = {
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
};
```

## 1) Create Event

### `POST /api/v1/event/add/`

Creates an event for the authenticated user.

Request example:

```json
{
  "child": 1,
  "title": "School Parent Meeting",
  "type": "school",
  "date": "2026-04-20",
  "start_time": "10:00:00",
  "end_time": "11:30:00",
  "location": "School Hall",
  "repeat": "once",
  "custom_start_date": null,
  "custom_end_date": null,
  "reminder_minutes": 30,
  "description": "Bring report card"
}
```

Success `201 Created`:

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 5,
    "child": 1,
    "title": "School Parent Meeting",
    "type": "school",
    "date": "2026-04-20",
    "start_time": "10:00:00",
    "end_time": "11:30:00",
    "location": "School Hall",
    "repeat": "once",
    "custom_start_date": null,
    "custom_end_date": null,
    "reminder_minutes": 30,
    "description": "Bring report card",
    "created_at": "2026-04-18T10:05:00.000000Z",
    "updated_at": "2026-04-18T10:05:00.000000Z"
  },
  "meta": {
    "timestamp": "2026-04-18T10:05:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Validation error `400 Bad Request`:

```json
{
  "success": false,
  "message": "Invalid data",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {
      "field_name": ["validation message"]
    }
  },
  "meta": {
    "timestamp": "2026-04-18T10:05:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Frontend notes:

- Use the child ID from your Bridge/child management flow.
- `repeat` defaults to `once` if omitted by the client.
- The backend does not expose extra computed fields in the create response.

## 2) Get Event List

### `GET /api/v1/event/list/`

Returns the authenticated user's events plus the authenticated user's holidays.

Query params:

- `type`: `once | weekly | monthly`
- `start_date`: `YYYY-MM-DD`
- `end_date`: `YYYY-MM-DD`

Examples:

- `/api/v1/event/list/`
- `/api/v1/event/list/?type=once`
- `/api/v1/event/list/?type=weekly&start_date=2026-04-01&end_date=2026-04-30`
- `/api/v1/event/list/?type=monthly&start_date=2026-04-01&end_date=2026-05-01`

Success `200 OK`:

```json
{
  "success": true,
  "message": "Event and holiday list fetched successfully",
  "data": {
    "events": [
      {
        "id": 5,
        "child": {
          "id": 1,
          "name": "Child One",
          "date_of_birth": "2018-02-14",
          "age": 8
        },
        "post_by": "Jane",
        "title": "School Parent Meeting",
        "type": "school",
        "date": "2026-04-20",
        "start_time": "10:00:00",
        "end_time": "11:30:00",
        "location": "School Hall",
        "repeat": "once",
        "custom_start_date": null,
        "custom_end_date": null,
        "reminder_minutes": 30,
        "description": "Bring report card",
        "created_at": "2026-04-18T10:05:00.000000Z",
        "updated_at": "2026-04-18T10:05:00.000000Z"
      }
    ],
    "holidays": [
      {
        "id": 2,
        "child": 1,
        "child_name": "Child One",
        "post_by": "Jane",
        "name": "Summer Break",
        "start_date": "2026-06-01",
        "end_date": "2026-06-15",
        "assigned_to": "Mother",
        "location": "Dhaka",
        "description": "School vacation",
        "created_at": "2026-04-18T10:06:00.000000Z",
        "updated_at": "2026-04-18T10:06:00.000000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-18T10:10:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Frontend notes:

- If `type` is omitted, backend returns all events for the user, including `custom` repeat events.
- If `type=once`, backend returns only events where `repeat='once'`.
- If `type=weekly` or `type=monthly`, backend filters by `date` range only.
- If `type=custom`, backend does not error here; it falls back to returning all events because only `once`, `weekly`, and `monthly` are explicitly handled.
- Holidays are always returned as the full list for the user, regardless of query params.

## 3) Get Calendar List

### `GET /api/v1/event/calendar/`

Also returns `events` and `holidays`, intended for calendar screens.

Query params:

- `type`: `once | weekly | monthly`
- `start_date`: `YYYY-MM-DD` optional
- `end_date`: `YYYY-MM-DD` optional

Success `200 OK` response shape is the same as `GET /list/`.

Validation error for invalid type `400 Bad Request`:

```json
{
  "success": false,
  "message": "Invalid type parameter",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {
      "error": "Type must be one of ['once', 'weekly', 'monthly']"
    }
  },
  "meta": {
    "timestamp": "2026-04-18T10:15:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Frontend notes:

- Unlike `/list/`, this endpoint validates `type` and rejects unsupported values such as `custom`.
- If no `type` is provided, all user events are returned.
- Holidays are still not date-filtered by the backend.

## 4) Get Event Detail

### `GET /api/v1/event/{event_id}/`

Returns one event for the authenticated user.

Success `200 OK`:

```json
{
  "success": true,
  "message": "Event fetched successfully",
  "data": {
    "id": 5,
    "child": {
      "id": 1,
      "name": "Child One",
      "date_of_birth": "2018-02-14",
      "age": 8
    },
    "post_by": "Jane",
    "title": "School Parent Meeting",
    "type": "school",
    "date": "2026-04-20",
    "start_time": "10:00:00",
    "end_time": "11:30:00",
    "location": "School Hall",
    "repeat": "once",
    "custom_start_date": null,
    "custom_end_date": null,
    "reminder_minutes": 30,
    "description": "Bring report card",
    "created_at": "2026-04-18T10:05:00.000000Z",
    "updated_at": "2026-04-18T10:05:00.000000Z"
  },
  "meta": {
    "timestamp": "2026-04-18T10:20:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Not found `404 Not Found`:

```json
{
  "success": false,
  "message": "Event not found",
  "error": {
    "code": "EVENT_NOT_FOUND",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-18T10:20:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## 5) Edit Event

### `PATCH /api/v1/event/{event_id}/edit/`

Partial update is supported.

Request example:

```json
{
  "title": "Updated meeting title",
  "location": "Updated room",
  "reminder_minutes": 15
}
```

Success `200 OK`:

- Same response `data` shape as create event.
- `child` remains a numeric ID in this response.

Not found `404 Not Found`:

```json
{
  "success": false,
  "message": "Event not found",
  "error": {
    "code": "EVENT_NOT_FOUND",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-18T10:25:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Validation error `400 Bad Request` follows the standard `Invalid data` structure.

## 6) Delete Event

### `DELETE /api/v1/event/{event_id}/delete/`

Deletes one event belonging to the authenticated user.

Success:

- HTTP status: `204 No Content`
- Frontend should treat the request as successful if status is `204`.

Not found `404 Not Found`:

```json
{
  "success": false,
  "message": "Event not found",
  "error": {
    "code": "EVENT_NOT_FOUND",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-18T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## 7) Create Holiday

### `POST /api/v1/event/holiday/add/`

Creates a holiday entry for the authenticated user.

Request example:

```json
{
  "child": 1,
  "name": "Summer Break",
  "start_date": "2026-06-01",
  "end_date": "2026-06-15",
  "assigned_to": "Mother",
  "location": "Dhaka",
  "description": "School vacation"
}
```

Success `201 Created`:

```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
    "id": 2,
    "child": 1,
    "child_name": "Child One",
    "post_by": "Jane",
    "name": "Summer Break",
    "start_date": "2026-06-01",
    "end_date": "2026-06-15",
    "assigned_to": "Mother",
    "location": "Dhaka",
    "description": "School vacation",
    "created_at": "2026-04-18T10:35:00.000000Z",
    "updated_at": "2026-04-18T10:35:00.000000Z"
  },
  "meta": {
    "timestamp": "2026-04-18T10:35:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Frontend notes:

- `child` can be nullable in the underlying model.
- `child_name` is computed server-side in the response.

## 8) Get Holiday List

### `GET /api/v1/event/holiday/list/`

Returns only the authenticated user's holidays.

Success `200 OK`:

```json
{
  "success": true,
  "message": "Holiday list fetched successfully",
  "data": [
    {
      "id": 2,
      "child": 1,
      "child_name": "Child One",
      "post_by": "Jane",
      "name": "Summer Break",
      "start_date": "2026-06-01",
      "end_date": "2026-06-15",
      "assigned_to": "Mother",
      "location": "Dhaka",
      "description": "School vacation",
      "created_at": "2026-04-18T10:35:00.000000Z",
      "updated_at": "2026-04-18T10:35:00.000000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-04-18T10:40:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Frontend note:

- Here `data` is an array, not an object wrapper like `{ holidays: [...] }`.

## 9) Edit Holiday

### `PATCH /api/v1/event/holiday/{holiday_id}/edit/`

Partial update is supported.

Request example:

```json
{
  "assigned_to": "Father",
  "location": "Chattogram"
}
```

Success `200 OK`:

- Response `data` shape matches the holiday create response item.

Not found `404 Not Found`:

```json
{
  "success": false,
  "message": "Holiday not found",
  "error": {
    "code": "HOLIDAY_NOT_FOUND",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-18T10:45:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Validation error `400 Bad Request` follows the standard `Invalid data` structure.

## 10) Delete Holiday

### `DELETE /api/v1/event/holiday/{holiday_id}/delete/`

Deletes one holiday belonging to the authenticated user.

Success:

- HTTP status: `204 No Content`
- Frontend should treat the request as successful if status is `204`.

Not found `404 Not Found`:

```json
{
  "success": false,
  "message": "Holiday not found",
  "error": {
    "code": "HOLIDAY_NOT_FOUND",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-18T10:50:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## Recommended Frontend Handling

- Normalize event create/update responses and event read responses into one frontend event model because `child` shape changes between endpoints.
- Parse both `null` and empty/missing optional fields safely.
- Treat any non-2xx response as failure and read `error.details` for field-level validation messages.
- For calendar screens, consider client-side filtering of holidays by visible date range because the backend does not do that yet.
- Prefer `GET /calendar/` for calendar views because it explicitly validates filter values.
