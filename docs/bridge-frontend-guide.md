# ParentBridge Bridge API Guide (Frontend)

This document covers only Bridge-related APIs for frontend integration.

## Base URL

- Local example: `http://localhost:7000`
- Bridge prefix: `/api/v1/bridge/`
- All endpoints in this document require JWT auth.

## Authentication

Send JWT access token in request headers:

```http
Authorization: Bearer <access_token>
```

If token is missing or invalid, backend returns `401 Unauthorized` (DRF default error shape).

## Response Envelope (Bridge Module)

Bridge endpoints use a shared wrapper:

Success shape:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T10:30:00.000000Z",
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
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## Endpoints

1. `GET /api/v1/bridge/info/`
2. `GET /api/v1/bridge/partner/info/`
3. `GET /api/v1/bridge/co-parents/contacts/`
4. `GET /api/v1/bridge/childrens/`

---

## 1) Get Bridge Info

### `GET /api/v1/bridge/info/`

Returns ParentBridge summary for current user (user is either father or mother).

Request body: none.

Success (`200`):

```json
{
  "success": true,
  "message": "ParentBridge info retrieved",
  "data": {
    "id": 7,
    "father": "father@example.com",
    "mother": "mother@example.com",
    "mode": "bridge",
    "children": [
      {
        "id": 1,
        "name": "Child One"
      }
    ],
    "created_at": "2026-04-12T09:15:00.000000Z"
  },
  "meta": {
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error (`404`):

```json
{
  "success": false,
  "message": "No ParentBridge found for the user",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 2) Get Partner Info

### `GET /api/v1/bridge/partner/info/`

Current behavior note:

- Endpoint checks whether current user has a partner in a bridge.
- If partner exists, it validates serializer using request body (for GET usually empty).
- It does not serialize partner instance directly.

Frontend recommendation:

- Treat this endpoint as partner-presence check only until backend behavior is improved.

Request body: none.

Possible success (`200`):

```json
{
  "success": true,
  "message": "Partner information submitted successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error (`404`):

```json
{
  "success": false,
  "message": "No partner found for the user",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Potential validation error (`400`):

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
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 3) Get Co-Parent Contacts

### `GET /api/v1/bridge/co-parents/contacts/`

Request body: none.

Intended success shape (`200`):

```json
{
  "success": true,
  "message": "Co-parent contacts retrieved",
  "data": [
    {
      "id": 3,
      "name": "Grandmother",
      "email": "grandmother@example.com",
      "phone_number": "+1555000001",
      "relationship": "guardian"
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error (`404`): same bridge-not-found envelope as above.

Important backend mismatch to handle in frontend:

- View uses keys `phone_number` and `relationship`.
- Current model defines `phone` and does not define `relationship`.
- In some deployments this can produce server `500`.

Frontend safe fallback:

- If this endpoint fails with `500`, show non-blocking empty contacts state and continue app flow.

---

## 4) Get Children

### `GET /api/v1/bridge/childrens/`

Request body: none.

Success (`200`):

```json
{
  "success": true,
  "message": "Children retrieved",
  "data": [
    {
      "id": 1,
      "name": "Child One",
      "date_of_birth": "2018-02-14",
      "gender": "male"
    },
    {
      "id": 2,
      "name": "Child Two",
      "date_of_birth": "2020-11-10",
      "gender": "female"
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T10:30:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error (`404`): same bridge-not-found envelope as above.

Gender values from model choices:

- `male`
- `female`
- `other`

---

## Data Contracts

### ParentBridge

```ts
type ParentBridgeInfo = {
  id: number;
  father: string | null; // email
  mother: string | null; // email
  mode: 'bridge' | 'independent';
  children: Array<{ id: number; name: string }>;
  created_at: string; // ISO datetime
};
```

### Child (Bridge endpoint)

```ts
type BridgeChild = {
  id: number;
  name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other';
};
```

### Bridge Response Wrapper

```ts
type BridgeSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta: {
    timestamp: string;
    request_id: string;
  };
};

type BridgeError = {
  success: false;
  message: string;
  error: {
    code: string;
    details: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    request_id: string;
  };
};
```

---

## Frontend Error Handling Recommendation

For bridge APIs, parse in this order:

1. If `message` exists -> show it.
2. If `error.details` has fields -> show first field error.
3. Fallback by status code:
   - `401`: "Session expired. Please log in again."
   - `404`: "No bridge data found for this account yet."
   - `500`: "Could not load bridge data. Please try again."

---

## Practical UI Flow

After user login/onboarding:

1. Call `GET /bridge/info/`.
2. If `404`, show setup empty state.
3. If `200`, render bridge summary and child list preview.
4. In parallel or next step, call `GET /bridge/childrens/` for full children details.
5. Optionally call partner and contacts endpoints, but keep them non-blocking due to current backend inconsistencies.
