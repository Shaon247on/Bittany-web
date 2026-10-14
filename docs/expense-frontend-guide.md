# ParentBridge Expense API Guide (Frontend)

This guide documents the current Expense module behavior as implemented in backend code.

## Base URL

- HTTP base: http://localhost:7000
- Expense API prefix: /api/v1/expense/

## Authentication

All endpoints require JWT access token.

Send on every request:

```http
Authorization: Bearer <access_token>
```

## Response Envelope

All Expense endpoints use shared ApiResponse wrapper.

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T13:00:00.000000Z",
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
    "timestamp": "2026-04-12T13:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## Endpoint Summary

1. POST /api/v1/expense/create/
2. PATCH /api/v1/expense/update/{expense_id}/
3. GET /api/v1/expense/list/
4. DELETE /api/v1/expense/delete/{expense_id}/
5. GET /api/v1/expense/summary/
6. PUT /api/v1/expense/{expense_id}/paid/

---

## Expense Data Contract

### Create or update payload

```ts
type ExpenseUpsertPayload = {
  child?: number | null;
  title?: string | null;
  paid_date?: string | null; // YYYY-MM-DD
  due_date?: string | null; // YYYY-MM-DD
  amount?: string | number;
  category?: string | null;
  father_percentage?: string | number;
  mother_percentage?: string | number;
  description?: string | null;
  status?: 'pending' | 'approved' | 'paid' | 'rejected';
};
```

### Expense list item

```ts
type ExpenseListItem = {
  id: number;
  user: number;
  co_parent: {
    id: number | '';
    name: string;
    email: string;
  };
  child: number | null;
  title: string | null;
  paid_date: string | null;
  due_date: string | null;
  amount: string;
  category: string | null;
  share: {
    your_share: string | number;
    co_parent_share: string | number;
  };
  description: string | null;
  expense_payments: number[];
  status: string;
  attachment: string | null;
  created_at: string;
  updated_at: string;
};
```

---

## 1) Create Expense

### POST /api/v1/expense/create/

Creates an expense owned by the authenticated user.

Request example:

```json
{
  "child": 1,
  "title": "School Fee April",
  "paid_date": "2026-04-12",
  "due_date": "2026-04-20",
  "amount": "200.00",
  "category": "School",
  "father_percentage": "50.00",
  "mother_percentage": "50.00",
  "description": "Monthly school fee",
  "status": "pending"
}
```

Success 201:

```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "id": 10,
    "user": 2,
    "child": 1,
    "title": "School Fee April",
    "paid_date": "2026-04-12",
    "due_date": "2026-04-20",
    "amount": "200.00",
    "category": "School",
    "father_percentage": "50.00",
    "mother_percentage": "50.00",
    "description": "Monthly school fee",
    "status": "pending",
    "created_at": "2026-04-12T13:05:00.000000Z",
    "updated_at": "2026-04-12T13:05:00.000000Z"
  },
  "meta": {
    "timestamp": "2026-04-12T13:05:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error 400 (serializer validation failure):

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
    "timestamp": "2026-04-12T13:05:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 2) Update Expense

### PATCH /api/v1/expense/update/{expense_id}/

Updates an existing expense visible to authenticated user (own expense or partner expense).

Partial update is supported.

Request example:

```json
{
  "amount": "220.00",
  "status": "approved",
  "description": "Updated amount"
}
```

Success 200: same response data shape as create.

Not found 404:

```json
{
  "success": false,
  "message": "Expense not found",
  "error": {
    "code": "EXPENSE_NOT_FOUND",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T13:10:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 3) Get Expense List

### GET /api/v1/expense/list/

Returns expenses for authenticated user and partner.

Success 200:

```json
{
  "success": true,
  "message": "Expense list fetched successfully",
  "data": {
    "expenses": [
      {
        "id": 10,
        "user": 2,
        "co_parent": {
          "id": 3,
          "name": "John",
          "email": "john@example.com"
        },
        "child": 1,
        "title": "School Fee April",
        "paid_date": "2026-04-12",
        "due_date": "2026-04-20",
        "amount": "200.00",
        "category": "School",
        "share": {
          "your_share": "100.00",
          "co_parent_share": "100.00"
        },
        "description": "Monthly school fee",
        "expense_payments": [1, 2],
        "status": "pending",
        "attachment": null,
        "created_at": "2026-04-12T13:05:00.000000Z",
        "updated_at": "2026-04-12T13:05:00.000000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-12T13:12:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Notes:

- share is computed from authenticated user role and father_percentage or mother_percentage.
- co_parent is resolved via partner lookup; if partner is missing, id can be empty string.
- expense_payments contains payment record IDs.
- list is ordered by newest `created_at` first.

---

## 4) Delete Expense

### DELETE /api/v1/expense/delete/{expense_id}/

Deletes an expense visible to authenticated user (own expense or partner expense).

Success 200:

```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T13:15:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Not found 404 uses error code EXPENSE_NOT_FOUND.

---

## 5) Monthly Expense Summary

### GET /api/v1/expense/summary/

Query params:

- month (optional)
- year (optional)

Defaults:

- If omitted or non-digit, backend uses current month and year.

Example:

- /api/v1/expense/summary/?month=04&year=2026

Success 200:

```json
{
  "success": true,
  "message": "Monthly expense summary fetched successfully",
  "data": {
    "total_expense": "500.00",
    "pending_expense": "120.00",
    "your_expense": "300.00",
    "partner_total_expense": "200.00"
  },
  "meta": {
    "timestamp": "2026-04-12T13:20:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Computation behavior:

- total_expense: sum of your expenses filtered by paid_date month and year.
- pending_expense: sum where status is pending in same period.
- partner_total_expense: partner's expenses in same period.
- your_expense: total_expense - partner_total_expense.

---

## 6) Mark Expense as Paid

### PUT /api/v1/expense/{expense_id}/paid/

Request body currently requires:

```json
{
  "amount": "100.00",
  "payment_method": "bank_transfer"
}
```

Current backend behavior:

- Returns 400 if amount or payment_method is missing.
- Returns 404 if expense not found in user + partner scope.
- Creates an `ExpensePayment` record with `user`, `expense`, `amount`, and `payment_method`.
- Sets expense status to `paid`, then sets it again to empty string before response.
- Endpoint does not currently validate payment_method against enum in schema.

Success 200:

```json
{
  "success": true,
  "message": "Expense status updated successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T13:25:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error 400 when missing fields:

```json
{
  "success": false,
  "message": "Amount and payment method are required",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T13:25:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## Important Caveats

1. Expense status choices are pending, approved, paid, rejected, but model default is currently unpaid. Treat status carefully when creating records without explicit status.
2. attachment is returned in list responses, but create and update serializers currently do not accept attachment field.
3. Mark-as-paid endpoint creates a payment row, but final expense status is currently overwritten to an empty string before returning success.
