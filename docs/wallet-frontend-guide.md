# ParentBridge Wallet API Guide (Frontend)

This guide documents the current wallet behavior from backend code in `twilio_management/`.

## Base URL

- HTTP base: http://localhost:7000
- Wallet prefix: /api/v1/twilio/

## Authentication

- All wallet endpoints require JWT auth.
- Stripe top-up webhook does not require auth and is backend-only.

Use:

```http
Authorization: Bearer <access_token>
```

## Response Envelope

Wallet endpoints use the shared `ApiResponse` wrapper.

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T16:00:00.000000Z",
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
    "timestamp": "2026-04-12T16:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Important:

- `ApiResponse.success()` converts falsy `data` values to `{}`.
- Endpoints that do not pass data, including delete responses and webhook acknowledgements, return `"data": {}` rather than `null`.

## Endpoint Summary

1. GET /api/v1/twilio/wallet/
2. POST /api/v1/twilio/wallet/
3. GET /api/v1/twilio/wallet/history/
4. GET /api/v1/twilio/wallet/topup/packages/
5. POST /api/v1/twilio/wallet/topup/packages/ (admin)
6. PUT /api/v1/twilio/wallet/topup/packages/{package_id}/ (admin)
7. DELETE /api/v1/twilio/wallet/topup/packages/{package_id}/ (admin)
8. POST /api/v1/twilio/webhook/stripe/topup/ (Stripe webhook, backend only)

Related endpoints and code paths:

- POST /api/v1/twilio/sub-account/ for Twilio number provisioning
- `twilio_management.utils.debit_wallet()` for Twilio call and SMS deductions

## Data Contracts

### Wallet balance contract

```ts
type WalletBalance = {
  balance: number;
};
```

### Wallet checkout response contract

```ts
type WalletCheckoutSession = {
  checkout_url: string;
  session_id: string;
  amount: number;
  bonus_amount: number;
  package_id: string;
};
```

### Transaction contract

```ts
type WalletTransaction = {
  id: number;
  amount: string;
  transaction_type: 'credit' | 'debit';
  transaction_type_display: string;
  cost_type: 'call' | 'sms' | 'topup' | 'other';
  cost_type_display: string;
  description: string | null;
  created_at: string;
};
```

### Top-up package contract

```ts
type WalletTopupPackage = {
  id: number;
  amount: string;
  bonus: string;
  description: string | null;
};
```

## 1) Get Wallet Balance

### GET /api/v1/twilio/wallet/

Returns wallet balance for the authenticated user.

If a wallet does not exist yet, backend creates one automatically with `0` balance.

Success 200:

```json
{
  "success": true,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "balance": 0.0
  },
  "meta": {
    "timestamp": "2026-04-12T16:05:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## 2) Create Wallet Top-Up Checkout Session

### POST /api/v1/twilio/wallet/

Creates a Stripe Checkout session in `payment` mode for wallet top-up. This endpoint does not immediately credit the wallet.

Request options:

Direct amount:

```json
{
  "amount": 25
}
```

Package-based top-up:

```json
{
  "package_id": 1
}
```

Mixed fallback request:

```json
{
  "amount": 25,
  "package_id": 1
}
```

Rules:

- You can send `amount`, `package_id`, or both.
- If `package_id` is valid, backend uses `package.amount` as the Stripe charge amount.
- If the package has bonus, backend stores `amount + bonus` in Stripe metadata and later credits that full metadata amount to the wallet.
- If `package_id` is invalid, backend logs a warning and falls back to validating `amount`.
- Final charge amount must be greater than `0`.
- Backend creates or reuses `request.user.stripe_customer_id` before creating the checkout session.

Success 201:

```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "checkout_url": "https://checkout.stripe.com/...",
    "session_id": "cs_test_...",
    "amount": 20.0,
    "bonus_amount": 2.0,
    "package_id": "1"
  },
  "meta": {
    "timestamp": "2026-04-12T16:07:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 400 `Invalid amount specified`
- 500 `Failed to create checkout session`

Frontend notes:

- Redirect user to `data.checkout_url`.
- Do not increment wallet balance locally after this response.
- The actual wallet credit happens only after Stripe webhook confirmation.

## 3) Get Wallet Transaction History

### GET /api/v1/twilio/wallet/history/

Returns current balance plus wallet transaction rows.

Success 200:

```json
{
  "success": true,
  "message": "Wallet transaction history retrieved successfully",
  "data": {
    "balance": 53.5,
    "transactions": [
      {
        "id": 14,
        "amount": "25.00",
        "transaction_type": "credit",
        "transaction_type_display": "Credit",
        "cost_type": "topup",
        "cost_type_display": "Wallet Top-up",
        "description": "Top-up via Stripe",
        "created_at": "2026-04-12T15:59:00Z"
      },
      {
        "id": 15,
        "amount": "2.50",
        "transaction_type": "debit",
        "transaction_type_display": "Debit",
        "cost_type": "call",
        "cost_type_display": "Voice Call",
        "description": "Call charge",
        "created_at": "2026-04-12T16:02:00Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-12T16:10:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error 404:

```json
{
  "success": false,
  "message": "Wallet not found",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T16:10:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Important behavior:

- Unlike `GET /twilio/wallet/`, this endpoint does not auto-create a wallet.
- If the user has never hit the balance endpoint and no other path created a wallet, history may return 404.

## 4) Get Top-Up Packages

### GET /api/v1/twilio/wallet/topup/packages/

Returns all wallet top-up packages.

Success 200:

```json
{
  "success": true,
  "message": "Wallet top-up packages retrieved successfully",
  "data": [
    {
      "id": 1,
      "amount": "20.00",
      "bonus": "2.00",
      "description": "Starter top-up"
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T16:12:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## 5) Create Top-Up Package (Admin)

### POST /api/v1/twilio/wallet/topup/packages/

Admin-only endpoint.

Request:

```json
{
  "amount": "50.00",
  "bonus": "5.00",
  "description": "Popular package"
}
```

Success 201:

```json
{
  "success": true,
  "message": "Wallet top-up package created successfully",
  "data": {
    "id": 2,
    "amount": "50.00",
    "bonus": "5.00",
    "description": "Popular package"
  },
  "meta": {
    "timestamp": "2026-04-12T16:13:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Errors:

- 403 `Unauthorized access`
- 400 `Invalid data` with serializer errors in `error.details`

## 6) Update Top-Up Package (Admin)

### PUT /api/v1/twilio/wallet/topup/packages/{package_id}/

Admin-only endpoint. Partial update is supported.

Request example:

```json
{
  "bonus": "7.50"
}
```

Success 200:

```json
{
  "success": true,
  "message": "Wallet top-up package updated successfully",
  "data": {
    "id": 2,
    "amount": "50.00",
    "bonus": "7.50",
    "description": "Popular package"
  },
  "meta": {
    "timestamp": "2026-04-12T16:14:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Errors:

- 403 `Unauthorized access`
- 404 `Package not found`
- 400 `Invalid data`

## 7) Delete Top-Up Package (Admin)

### DELETE /api/v1/twilio/wallet/topup/packages/{package_id}/

Admin-only endpoint.

Success 200:

```json
{
  "success": true,
  "message": "Package deleted",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T16:15:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Errors:

- 403 `Unauthorized access`
- 404 `Package not found`

## 8) Stripe Top-Up Webhook (Backend Only)

### POST /api/v1/twilio/webhook/stripe/topup/

This endpoint is called by Stripe, not by frontend.

Handled event in current code:

- `checkout.session.completed` where `metadata.purpose == wallet_topup`

Webhook success response:

```json
{
  "success": true,
  "message": "Webhook received",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T16:20:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error examples:

- 400 `Invalid payload`
- 400 `Invalid signature`

Webhook side effects on valid top-up:

- Reads `user_id` and credited `amount` from Stripe metadata.
- Creates wallet if it does not exist.
- Adds metadata amount to `wallet.balance`.
- Sends websocket notification to the user.

Current limitation:

- Webhook does not create a `Transaction` row for successful top-up credit.

## Wallet System Flow

### Top-up flow

1. Frontend loads wallet screen with `GET /twilio/wallet/`.
2. Frontend optionally fetches package presets from `GET /twilio/wallet/topup/packages/`.
3. User chooses direct amount or package.
4. Frontend calls `POST /twilio/wallet/`.
5. Backend creates or reuses Stripe customer and returns Stripe checkout URL.
6. Frontend redirects user to Stripe checkout.
7. Stripe sends `checkout.session.completed` to `POST /twilio/webhook/stripe/topup/`.
8. Webhook credits `wallet.balance` using Stripe metadata amount.
9. Webhook sends a notification to the user.
10. Frontend re-fetches `GET /twilio/wallet/` and `GET /twilio/wallet/history/` after return from Stripe.

### Wallet deduction flow

1. Twilio call or SMS logic computes a charge amount.
2. Backend calls `twilio_management.utils.debit_wallet(user, data)`.
3. Utility checks wallet existence and available balance.
4. Utility reduces `wallet.balance`.
5. Utility creates a `Transaction` row with `transaction_type='debit'` and cost type such as `call` or `sms`.
6. `GET /twilio/wallet/history/` reflects those debit transactions.

### Transaction history truth

- Debits are created through `debit_wallet()`.
- Credits from Stripe top-up webhook currently update balance without creating a matching transaction row.
- Because of that mismatch, `GET /twilio/wallet/` is the source of truth for balance, while `GET /twilio/wallet/history/` is only a partial ledger in current implementation.

## Module Dependencies

- `twilio_management.views.WalletView` handles wallet read and top-up checkout creation.
- `twilio_management.views.StripeWebhookView` is the only current path that credits wallet balance for Stripe top-ups.
- `twilio_management.models.Wallet` stores balance per user.
- `twilio_management.models.Transaction` stores debit and manual credit history rows when created elsewhere.
- `twilio_management.models.WalletTopUpPackege` stores preset top-up packages.
- `accounts.CustomUser.stripe_customer_id` is reused for Stripe customer linkage.
- `notifications.utils.send_ws_notification` is used after successful top-up.
- Twilio call and SMS charging depends on `twilio_management.utils.debit_wallet()`.

## Recommended Frontend Wallet Flow

1. On wallet screen load, call `GET /twilio/wallet/` first.
2. Then call `GET /twilio/wallet/history/`.
3. Optionally load `GET /twilio/wallet/topup/packages/`.
4. When user chooses a package, prefer sending both `package_id` and explicit `amount` for safer fallback behavior.
5. Redirect to Stripe using `data.checkout_url` from `POST /twilio/wallet/`.
6. After success return, always re-fetch both balance and history.
7. Use wallet balance endpoint as the source of truth for displayed available funds.

## Current Backend Caveats

1. Wallet model uses `ForeignKey` user-to-wallet, but view logic assumes one wallet per user.
2. `GET /twilio/wallet/` auto-creates wallet, while `GET /twilio/wallet/history/` returns 404 if wallet does not exist.
3. Stripe top-up webhook updates wallet balance but does not create a `Transaction` record.
4. When `package_id` is invalid, backend only logs a warning and falls back to validating `amount`.
5. Top-up credit amount includes package bonus because webhook uses Stripe metadata amount, not just the charged amount.

## Error Handling Recommendation

Parse in order:

1. `message`
2. `error.details`
3. generic fallback by status code

Fallback messages:

- 400: Invalid wallet request.
- 401: Session expired. Please log in again.
- 403: You do not have permission for this action.
- 404: Wallet data not found.
- 500: Wallet service is temporarily unavailable.
