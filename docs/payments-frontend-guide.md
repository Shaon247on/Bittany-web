# ParentBridge Payments API Guide (Frontend)

This guide documents the current Payments module behavior from backend code in `payments/`.

## Base URL

- HTTP base: http://localhost:7000
- Payments prefix: /api/v1/payment/

## Authentication

All payment endpoints require JWT auth except webhook endpoints.

Use:

```http
Authorization: Bearer <access_token>
```

## Response Format

Most payment endpoints use the shared `ApiResponse` envelope.

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
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
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Webhook endpoints do not use `ApiResponse`. They return plain JSON such as:

```json
{ "status": "success" }
```

## Endpoint Summary

1. GET /api/v1/payment/plan/
2. POST /api/v1/payment/plan/
3. PUT /api/v1/payment/plan/{plan_id}/
4. POST /api/v1/payment/checkout-session/
5. GET /api/v1/payment/checkout-session/retrieve/?session_id=...
6. POST /api/v1/payment/subscription/cancel/
7. GET /api/v1/payment/subscription/history/
8. POST /api/v1/payment/subscription/refund/
9. GET /api/v1/payment/subscription/refund/?type=self|all
10. POST /api/v1/payment/subscription/refund/process/
11. POST /api/v1/payment/webhook/stripe/ (backend-to-backend)
12. POST /api/v1/payment/webhook/iap/ (backend-to-backend)

## Data Contracts

### Plan read contract

```ts
type PlanDescription = {
  id: number;
  text: string;
  created_at: string;
};

type Plan = {
  id: number;
  name: string;
  monthly_price: string | null;
  yearly_price: string | null;
  apple_product_id: string | null;
  google_product_id: string | null;
  descriptions: PlanDescription[];
  current_subscribed: boolean;
  created_at: string;
  updated_at: string;
};
```

### Plan create/update response contract

The POST and PUT endpoints return the `CreateAndUpdatePlan` serializer, not the read serializer.

```ts
type PlanWriteResponse = {
  id: number;
  name: string;
  monthly_price: string | null;
  yearly_price: string | null;
  apple_product_id: string | null;
  google_product_id: string | null;
  descriptions: Array<{ text: string }>;
};
```

### Subscription history contract

```ts
type SubscriptionUser = {
  id: number;
  username: string;
  name: string | null;
  image: string | null;
  role: string;
};

type ActiveSubscription = {
  id: number;
  user: SubscriptionUser;
  plan: number | null;
  status: 'free' | 'premium' | 'canceled' | 'expired' | 'refunded' | 'paused' | 'trial' | 'incomplete';
  price: string;
  duration_days: number;
  duration_type: 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  auto_renew: boolean;
  provider: 'stripe' | 'apple' | 'google';
  environment: string | null;
  stripe_subscription_id: string | null;
  payment_intent_id: string | null;
  apple_original_transaction_id: string | null;
  apple_receipt: string | null;
  google_purchase_token: string | null;
  google_order_id: string | null;
  invoice: string | null;
  reminder_sent: unknown[];
  last_event_id: string | null;
  created_at: string;
  updated_at: string;
};
```

### Refund contract

```ts
type RefundRequest = {
  id: number;
  user: SubscriptionUser;
  subscription: number;
  stripe_refund_id: string | null;
  payment_intent_id: string | null;
  reason: string | null;
  rejected_reason: string | null;
  amount: string;
  status: 'requested' | 'refunded' | 'approved' | 'rejected';
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
};
```

## 1) List Plans

### GET /api/v1/payment/plan/

Returns all subscription plans.

Success 200:

```json
{
  "success": true,
  "message": "Subscription plans retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "ParentBridge Pro",
      "monthly_price": "9.99",
      "yearly_price": "99.00",
      "apple_product_id": null,
      "google_product_id": null,
      "descriptions": [
        {
          "id": 3,
          "text": "Core feature set",
          "created_at": "2026-04-30T12:00:00Z"
        }
      ],
      "current_subscribed": false,
      "created_at": "2026-04-30T12:00:00Z",
      "updated_at": "2026-04-30T12:00:00Z"
    }
  ],
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## 2) Create Plan

### POST /api/v1/payment/plan/

Request:

```json
{
  "name": "ParentBridge Pro Plus",
  "monthly_price": "14.99",
  "yearly_price": "149.99",
  "apple_product_id": "pro_plus_monthly",
  "google_product_id": "pro_plus_monthly",
  "descriptions": [
    { "text": "Priority support" },
    { "text": "Advanced moderation" }
  ]
}
```

Success 201:

```json
{
  "success": true,
  "message": "Subscription plan created successfully",
  "data": {
    "id": 2,
    "name": "ParentBridge Pro Plus",
    "monthly_price": "14.99",
    "yearly_price": "149.99",
    "apple_product_id": "pro_plus_monthly",
    "google_product_id": "pro_plus_monthly",
    "descriptions": [
      { "text": "Priority support" },
      { "text": "Advanced moderation" }
    ]
  },
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error 400 returns `Failed to create subscription plan` with serializer field errors inside `error.details`.

## 3) Update Plan

### PUT /api/v1/payment/plan/{plan_id}/

Partial update is supported.

Request example:

```json
{
  "monthly_price": "12.99",
  "descriptions": [
    { "text": "Updated feature list" }
  ]
}
```

Success 200 returns the same shape as the create response.

Error 400 returns `Failed to update subscription plan` with serializer field errors in `error.details`.

## 4) Create Stripe Checkout Session

### POST /api/v1/payment/checkout-session/

Creates a Stripe Checkout session in `subscription` mode.

Request:

```json
{
  "plan_id": 1,
  "plan_duration": "monthly",
  "auto_renew": true,
  "payment_platform": "stripe"
}
```

Rules:

- `plan_id` is required.
- `plan_duration` must be `monthly` or `yearly`.
- `payment_platform` currently supports `stripe` only.
- `auto_renew` is accepted by the endpoint but is not used when creating the Stripe checkout session.
- If the user already has an active Stripe subscription with `auto_renew=true`, the endpoint returns 400 instead of creating a second one.

Success 200:

```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "session_id": "cs_test_...",
    "checkout_url": "https://checkout.stripe.com/..."
  },
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 400 `Invalid plan duration. Must be 'monthly' or 'yearly'.`
- 400 `Unsupported payment platform`
- 400 `You already have an active subscription...`
- 404 `Subscription plan not found`
- 500 `Failed to create checkout session`

## 5) Retrieve Checkout Session

### GET /api/v1/payment/checkout-session/retrieve/?session_id=cs_...

Returns `dict(session)` from Stripe in `data`.

Success 200:

```json
{
  "success": true,
  "message": "Checkout session retrieved successfully",
  "data": {
    "id": "cs_test_...",
    "object": "checkout.session",
    "mode": "subscription",
    "payment_status": "paid",
    "status": "complete"
  },
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 400 `session_id is required`
- 500 `Failed to retrieve checkout session`

Important:

- Treat this as Stripe session status only.
- Final local subscription state is created asynchronously by the Stripe webhook, not by this endpoint.

## 6) Cancel Auto-Renew (Stripe)

### POST /api/v1/payment/subscription/cancel/

Request body: none.

Behavior:

- Finds the latest active premium subscription for the authenticated user.
- Requires provider `stripe`.
- Calls Stripe with `cancel_at_period_end=true`.
- Sets the local `auto_renew` flag to `false`.
- Sends cancellation email.
- Subscription remains active until `end_date`.

Success 200:

```json
{
  "success": true,
  "message": "Subscription auto renewal cancellation scheduled. It will remain active until the end of the current billing period.",
  "data": {
    "end_date": "2026-06-01T00:00:00Z"
  },
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 404 `No active subscription found`
- 400 `Website auto-renewal cancellation is only supported for Stripe subscriptions...`
- 400 `No Stripe subscription ID found`
- 400 `Auto-renewal is already cancelled for this subscription.`
- 400 `Stripe error: ...`

## 7) Get Active Subscription

### GET /api/v1/payment/subscription/history/

Query params:

- optional `user_id` for staff users

Success 200:

```json
{
  "success": true,
  "message": "Active subscription retrieved successfully",
  "data": {
    "subscription": {
      "id": 10,
      "user": {
        "id": 7,
        "username": "jane_7",
        "name": "Jane",
        "image": null,
        "role": "mother"
      },
      "plan": 1,
      "status": "premium",
      "price": "9.99",
      "duration_days": 30,
      "duration_type": "monthly",
      "start_date": "2026-05-01T00:00:00Z",
      "end_date": "2026-06-01T00:00:00Z",
      "is_active": true,
      "auto_renew": true,
      "provider": "stripe",
      "environment": null,
      "stripe_subscription_id": "sub_...",
      "payment_intent_id": "pi_...",
      "apple_original_transaction_id": null,
      "apple_receipt": null,
      "google_purchase_token": null,
      "google_order_id": null,
      "invoice": null,
      "reminder_sent": [],
      "last_event_id": "evt_...",
      "created_at": "2026-05-01T00:00:00Z",
      "updated_at": "2026-05-01T00:00:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 404 `No active subscription found for this user.`
- 404 `User not found or insufficient permissions.`
- 500 `Error retrieving subscription: ...`

## 8) Create Refund Request

### POST /api/v1/payment/subscription/refund/

Request:

```json
{
  "subscription_id": 10,
  "reason": "Accidental purchase",
  "amount": "5.00",
  "email": "user@example.com",
  "type": "self"
}
```

Notes:

- `subscription_id` is required.
- `reason`, `amount`, `email`, and `type` are optional.
- `type` defaults to `self`.
- The endpoint only allows refunds against the authenticated user's active, non-expired subscription.
- For `type=self`, only Stripe subscriptions are accepted.

Success 201:

```json
{
  "success": true,
  "message": "Refund request created successfully",
  "data": {
    "refund_request_id": 3
  },
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 400 `Subscription ID is required for refund request`
- 400 `Refunds can only be requested for Stripe subscriptions...`
- 400 `Cannot request refund for expired subscription`
- 400 `Refund request already exists for this subscription`
- 404 `Subscription not found or expired`

## 9) List Refund Requests

### GET /api/v1/payment/subscription/refund/?type=self|all

Rules:

- `type=self` returns only the current user's refund requests.
- Any other value, including the default `all`, requires staff permission.

Success 200:

```json
{
  "success": true,
  "message": "Refund requests retrieved successfully",
  "data": [
    {
      "id": 3,
      "user": {
        "id": 7,
        "username": "jane_7",
        "name": "Jane",
        "image": null,
        "role": "mother"
      },
      "subscription": 10,
      "stripe_refund_id": null,
      "payment_intent_id": null,
      "reason": "Accidental purchase",
      "rejected_reason": null,
      "amount": "5.00",
      "status": "requested",
      "requested_at": "2026-05-01T10:00:00Z",
      "approved_at": null,
      "rejected_at": null
    }
  ],
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 403 `Insufficient permissions to view all refund requests`

## 10) Process Refund

### POST /api/v1/payment/subscription/refund/process/

Approve request payload:

```json
{
  "refund_request_id": 3,
  "action": "approve",
  "amount": "5.00"
}
```

Reject request payload:

```json
{
  "refund_request_id": 3,
  "action": "reject",
  "rejected_reason": "Outside refund window"
}
```

Approve success 200:

```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refund_id": "re_...",
    "amount": 5.0
  },
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Reject success 200:

```json
{
  "success": true,
  "message": "Refund request rejected",
  "data": {},
  "meta": {
    "timestamp": "2026-05-01T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Common errors:

- 400 `Action is required (approve or reject)`
- 400 `No payment intent found for this subscription, cannot process refund`
- 400 `Stripe refund error: ...`
- 400 `Invalid action: ...`
- 404 `Refund request not found or already processed`
- 404 `Associated subscription not found for this refund request`
- 500 `Refund error: ...`

Processing side effects when approved:

- Stripe refund is created.
- Local refund row becomes `approved` immediately.
- Subscription is deactivated locally with `status=expired` and `auto_renew=false`.
- A websocket notification is sent to the refunded user.
- Later, Stripe `charge.refunded` webhook may move matching local refund rows to `refunded` and update subscription status to `refunded`.

## 11) Stripe Webhook (Backend Only)

### POST /api/v1/payment/webhook/stripe/

This endpoint is for Stripe servers only.

Handled events in current code:

- `checkout.session.completed`
- `invoice.payment_succeeded`
- `charge.refunded`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Response examples:

```json
{ "status": "success" }
```

or duplicate replay:

```json
{ "status": "duplicate" }
```

## 12) IAP Webhook (Backend Only)

### POST /api/v1/payment/webhook/iap/

Processes Apple and Google subscription events. Frontend should never call this endpoint.

## Payment System Flow

### Subscription purchase flow

1. Frontend fetches plans from `GET /payment/plan/`.
2. Frontend creates Stripe checkout from `POST /payment/checkout-session/`.
3. Stripe redirects user back to frontend success page with `session_id`.
4. Frontend may call `GET /payment/checkout-session/retrieve/` to verify Stripe session status.
5. Stripe sends `checkout.session.completed` to `POST /payment/webhook/stripe/`.
6. Webhook loads `user_id` and `plan_id` from Stripe metadata and creates a new `Subscription` row.
7. Webhook deactivates any previous active local subscription for the same user.
8. Webhook sends purchase notification, sends invoice email, and creates `SubscriptionHistory` row.
9. Frontend should then call `GET /payment/subscription/history/` and use that response as the source of truth.

### Renewal flow

1. Stripe sends `invoice.payment_succeeded` for renewal invoices.
2. Webhook creates a new subscription row for the renewal period and expires the old row.
3. Webhook saves `SubscriptionHistory` and sends renewal email.
4. Frontend should re-fetch `GET /payment/subscription/history/` whenever subscription state must be refreshed.

### Cancel auto-renew flow

1. Frontend calls `POST /payment/subscription/cancel/`.
2. Backend updates Stripe with `cancel_at_period_end=true`.
3. Backend immediately sets local `auto_renew=false`.
4. Stripe later sends `customer.subscription.updated` or `customer.subscription.deleted`.
5. Local subscription remains active until `end_date`, then transitions through webhook or expiration logic.

### Refund flow

1. User creates refund request via `POST /payment/subscription/refund/`.
2. Admin or privileged UI calls `POST /payment/subscription/refund/process/`.
3. Backend attempts Stripe refund using local `payment_intent_id` or a fallback Stripe invoice lookup.
4. On success, backend deactivates the subscription locally and notifies the user.
5. Stripe later emits `charge.refunded`, which marks matching local refund rows `refunded` and updates subscription state again.

## Module Dependencies

- `payments/views.py` handles plan CRUD, checkout session creation, active subscription lookup, cancellation, and refund endpoints.
- `payments/webhooks/stripe_webhook.py` is the authoritative source for subscription activation, renewal, refund finalization, and Stripe-driven state changes.
- `payments/webhooks/helpers.py` creates and renews local `Subscription` rows.
- `payments/utils.py` writes `SubscriptionHistory` rows and sends invoice email templates.
- `accounts.CustomUser.stripe_customer_id` is used for Stripe customer linkage.
- `accounts.ActivityLog` stores purchase and refund activity.
- `notifications.utils.send_ws_notification` is used for purchase and refund notifications.

## Recommended Frontend Flow

1. Load plans from `GET /payment/plan/`.
2. Start checkout with `POST /payment/checkout-session/`.
3. Redirect to `data.checkout_url`.
4. On return, optionally verify with `GET /payment/checkout-session/retrieve/`.
5. Always re-fetch `GET /payment/subscription/history/` before showing premium state.
6. For cancellation, call `POST /payment/subscription/cancel/` and then re-fetch subscription history.
7. For refunds, use `POST /payment/subscription/refund/`, `GET /payment/subscription/refund/`, and `POST /payment/subscription/refund/process/`.

## Current Backend Caveats

1. Plan create and update endpoints are authenticated but not staff-restricted in current code.
2. Refund processing endpoint is authenticated but not staff-restricted in current code.
3. Checkout request field is `plan_duration`, not `duration_type`.
4. `auto_renew` is accepted in checkout request but not applied when creating the Stripe checkout session.
5. Plan list endpoint is authenticated; there is no public anonymous plan list.
6. `GET /payment/subscription/history/` returns only the current active subscription, not historical rows.
7. Final subscription truth lives in webhook-driven local subscription state, not in the immediate checkout session retrieval response.

## Error Handling Recommendation

Parse in order:

1. `message`
2. `error.details`
3. `detail`
4. fallback by status code

Fallbacks:

- 400: Payment request is invalid.
- 401: Session expired. Please log in again.
- 403: You do not have permission for this action.
- 404: Requested payment resource not found.
- 500: Payment service temporarily unavailable.
