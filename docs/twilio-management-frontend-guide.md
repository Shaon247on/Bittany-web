# ParentBridge Twilio Management API Guide (Frontend)

This guide covers Twilio management APIs exposed under the Twilio module.

## Base URL

- HTTP base: http://localhost:7000
- Twilio prefix: /api/v1/twilio/

## Authentication

Use JWT for all frontend Twilio endpoints:

```http
Authorization: Bearer <access_token>
```

Note: webhook endpoint does not require auth and is backend-only.

## Response Envelope

Most Twilio endpoints use ApiResponse wrapper.

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

---

## Endpoint Summary

1. POST /api/v1/twilio/sub-account/
2. POST /api/v1/twilio/test-sms/
3. GET /api/v1/twilio/wallet/
4. POST /api/v1/twilio/wallet/
5. GET /api/v1/twilio/wallet/history/
6. GET /api/v1/twilio/wallet/topup/packages/
7. POST /api/v1/twilio/wallet/topup/packages/ (admin)
8. PUT /api/v1/twilio/wallet/topup/packages/{package_id}/ (admin)
9. DELETE /api/v1/twilio/wallet/topup/packages/{package_id}/ (admin)
10. POST /api/v1/twilio/webhook/stripe/topup/ (backend-only)

---

## 1) Provision Twilio Subaccount + Number

### POST /api/v1/twilio/sub-account/

Creates a Twilio subaccount and purchases a number for call/SMS usage.

Request:

```json
{
  "area_code": 415,
  "country_code": "US"
}
```

Both fields are optional. country_code defaults to US.

Success 201 example:

```json
{
  "success": true,
  "message": "Twilio number provisioned successfully",
  "data": {
    "number": "+13509601611",
    "phone_sid": "PNbfba9bc930e50e5be0a5613ad7d7b4be",
    "already_assigned": false,
    "subaccount_sid": "AC...",
    "subaccount_auth_token": "...",
    "country_code": "US"
  }
}
```

Potential errors:

- 400 invalid payload
- 500 number provisioning failure

---

## 2) Send Test SMS

### POST /api/v1/twilio/test-sms/

Development endpoint to test SMS delivery.

Request:

```json
{
  "to": "+14155552671",
  "body": "Hello from ParentBridge!",
  "from_number": "+19175550001"
}
```

Rules:

- to is required.
- from_number is optional only if user profile already has a provisioned Twilio number.

Success 200:

```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "sid": "SM...",
    "status": "queued"
  }
}
```

---

## 3) Wallet APIs

Wallet endpoints live in the same Twilio module.

Use:

- GET /api/v1/twilio/wallet/
- POST /api/v1/twilio/wallet/
- GET /api/v1/twilio/wallet/history/
- GET/POST/PUT/DELETE package endpoints

See full wallet integration details in docs/wallet-frontend-guide.md.

---

## 4) Stripe Top-Up Webhook (Backend Only)

### POST /api/v1/twilio/webhook/stripe/topup/

Used by Stripe to confirm successful top-up checkout and update wallet balance.

Frontend should never call this endpoint directly.

---

## Practical Frontend Recommendations

1. Treat sub-account provisioning as one-time setup per user and cache successful number in frontend state.
2. Do not display or persist subaccount auth token in frontend logs/local storage.
3. For wallet top-ups, always re-fetch wallet balance and history after user returns from Stripe checkout.
4. Parse errors from message first, then error.details.

---

## Current Backend Caveats

1. Provision endpoint currently does not enforce IsAuthenticated in code, but uses request.user internally. Frontend should still send auth.
2. Provision endpoint returns sensitive Twilio credentials (subaccount_auth_token). Handle as sensitive data.
3. Wallet webhook updates balance but does not create Transaction rows in the same webhook flow.
