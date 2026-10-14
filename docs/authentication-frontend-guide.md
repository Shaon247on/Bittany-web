# ParentBridge Authentication API Guide (Frontend)

This document explains only authentication-related integration for frontend apps.

## Base URL

- Local example: `http://localhost:7000`
- Auth prefix: `/api/v1/auth/`
- Full endpoint example: `POST /api/v1/auth/login/`

## Auth Mechanism

- Token type: JWT (`Bearer`)
- Send access token in header:

```http
Authorization: Bearer <access_token>
```

- Access token lifetime: 365 days (current backend config)
- Refresh token lifetime: 365 days (current backend config)
- Refresh rotation: disabled

## Endpoint Summary

1. `POST /signup/`
2. `POST /social/signup-signin/`
3. `POST /otp/resend/`
4. `POST /activate/`
5. `POST /login/`
6. `POST /token/refresh/`
7. `POST /password/reset/request/`
8. `POST /password/reset/activate/`
9. `POST /password/reset/` (requires access token)
10. `PUT /profile/password/change/` (requires access token)
11. `GET /profile/` (requires access token)
12. `PUT /profile/` (requires access token)
13. `POST /onboarding/` (requires access token)

## Standard Notes for Frontend

- Backend response keys are not fully uniform across all endpoints.
- Some endpoints return `refresh_token`, one returns `refresh`.
- Some errors return:
  - object with `detail`
  - field-level object (`email`, `password`, `non_field_errors`)
  - object with `error`
  - plain string arrays in field values
- Treat non-2xx as failure and parse defensively.

---

## 1) Email Signup

### `POST /api/v1/auth/signup/`

Creates a user in inactive state, sends OTP by email.

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

Success responses:

- `201 Created`

```json
{
  "message": "A confirmation email has been sent to your inbox."
}
```

- `200 OK` (email already exists but account inactive, OTP resent)

```json
{
  "message": "User already exists but is inactive. A new OTP has been sent to your email."
}
```

Known error responses:

- `400 Bad Request` (validation)
- `400 Bad Request` (active user already exists)

```json
{
  "message": "User already exists and is active."
}
```

or

```json
{
  "email": ["custom validation message"],
  "password": ["custom validation message"]
}
```

---

## 2) Social Signup/Signin

### `POST /api/v1/auth/social/signup-signin/`

If user does not exist: creates account.
If user exists: logs in and updates provider/role if changed.

Request:

```json
{
  "email": "user@example.com",
  "auth_provider": "google",
  "role": "mother"
}
```

Notes:

- `role` optional, defaults to `"user"` if omitted.
- Allowed role values in model: `admin`, `user`, `father`, `mother`.

Success responses:

- `201 Created` (new account)
- `200 OK` (existing account)

```json
{
  "refresh_token": "<jwt>",
  "access_token": "<jwt>",
  "role": "mother",
  "message": "Successfully Created Account."
}
```

or

```json
{
  "refresh_token": "<jwt>",
  "access_token": "<jwt>",
  "role": "mother",
  "message": "Successfully Logged In."
}
```

Error:

- `400 Bad Request`

```json
{
  "error": "<message>"
}
```

or serializer-style field errors.

---

## 3) Resend OTP

### `POST /api/v1/auth/otp/resend/`

Request:

```json
{
  "email": "user@example.com"
}
```

Success:

- `200 OK`

```json
{
  "message": "A new OTP has been sent to your email."
}
```

Errors:

- `400 Bad Request` (serializer error)
- `404 Not Found`

```json
{
  "detail": "User not found"
}
```

- `500 Internal Server Error`

```json
{
  "detail": "An error occurred: <reason>"
}
```

---

## 4) Activate Account (OTP Verify)

### `POST /api/v1/auth/activate/`

Request:

```json
{
  "email": "user@example.com",
  "otp": "1234"
}
```

Success:

- `200 OK`

```json
{
  "email": "user@example.com",
  "role": "user",
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "message": "Your account has been successfully activated!"
}
```

Errors:

- `400 Bad Request`

```json
{
  "non_field_errors": ["Invalid OTP."]
}
```

Possible messages:

- `"Email and OTP are required."`
- `"User with this email does not exist."`
- `"User account is already active."`
- `"Invalid OTP."`

---

## 5) Email/Password Login

### `POST /api/v1/auth/login/`

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

Success:

- `200 OK`

```json
{
  "email": "user@example.com",
  "role": "mother",
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "message": "Successfully logged in."
}
```

Common errors (`400`):

- Inactive user, OTP resent:

```json
{
  "detail": "Your Email is not verified. Please check your email for the OTP to activate your account.",
  "redirect": "activation"
}
```

- Invalid credentials flow:

```json
{
  "detail": "Invalid credentials",
  "redirect": "login"
}
```

- Serializer errors (example):

```json
{
  "non_field_errors": ["Incorrect password."]
}
```

or

```json
{
  "non_field_errors": ["User with this email does not exist."],
  "redirect": "login"
}
```

---

## 6) Refresh Access Token

### `POST /api/v1/auth/token/refresh/`

Request:

```json
{
  "refresh_token": "<jwt_refresh_token>"
}
```

Success:

- `200 OK`

```json
{
  "access": "<new_access_token>"
}
```

Error (`400`):

```json
{
  "error": "Invalid refresh token"
}
```

or serializer validation error if missing `refresh_token`.

---

## 7) Password Reset Request (Email OTP)

### `POST /api/v1/auth/password/reset/request/`

Request:

```json
{
  "email": "user@example.com"
}
```

Success:

- `200 OK`

```json
{
  "message": "A confirmation email has been sent to your inbox. Please check your email and follow the instructions to reset your password."
}
```

Errors:

- `400` serializer validation (unknown email/inactive user)
- `500`

```json
{
  "detail": "An error occurred: <reason>"
}
```

---

## 8) Password Reset OTP Activate

### `POST /api/v1/auth/password/reset/activate/`

Verifies OTP and returns temporary auth tokens.

Request:

```json
{
  "email": "user@example.com",
  "otp": "1234"
}
```

Success:

- `200 OK`

```json
{
  "detail": "OTP Activated",
  "refresh": "<jwt_refresh_token>",
  "access_token": "<jwt_access_token>"
}
```

Important:

- This endpoint returns `refresh` (not `refresh_token`).

Errors:

- `400` serializer validation errors
- `404` fallback catch errors

---

## 9) Reset Password (Authenticated)

### `POST /api/v1/auth/password/reset/`

Requires `Authorization: Bearer <access_token>`.
Use access token from step 8.

Request:

```json
{
  "new_password": "NewStrong1!"
}
```

Success:

- `200 OK`

```json
{
  "message": "Password has been reset successfully."
}
```

Validation errors (`400`) for password rules:

- At least 8 characters
- Must include at least one digit
- Must include at least one uppercase letter
- Must include at least one special character from `@!#$%^&*()-+`

Common unauthorized error:

- `401 Unauthorized` if missing/invalid token

---

## 10) Change Password (Authenticated User Session)

### `PUT /api/v1/auth/profile/password/change/`

Requires `Authorization: Bearer <access_token>`.

Request:

```json
{
  "old_password": "OldStrong1!",
  "new_password": "NewStrong1!"
}
```

Success:

- `200 OK`

```json
{
  "detail": "Password changed successfully"
}
```

Errors (`400`):

- `"Old password is incorrect."`
- Same password policy errors as reset password.

---

## 11) Get Profile (Authenticated)

### `GET /api/v1/auth/profile/`

Requires `Authorization: Bearer <access_token>`.

Success (`200`):

```json
{
  "name": "Jane",
  "phone": "123456789",
  "state": "CA",
  "image": "/media/users_images/profile.jpg",
  "children": [
    {
      "id": 1,
      "name": "Child Name",
      "date_of_birth": "2018-01-20"
    }
  ],
  "court_mandated": false,
  "role": "mother"
}
```

Errors:

- `401` unauthorized
- `404` user not found (rare)

---

## 12) Update Profile (Authenticated)

### `PUT /api/v1/auth/profile/`

Requires `Authorization: Bearer <access_token>`.

Request (all fields optional because partial update):

```json
{
  "name": "Jane Updated",
  "phone": "123456789",
  "state": "NY",
  "court_mandated": true,
  "role": "mother",
  "children": [
    {
      "name": "Child One",
      "date_of_birth": "2019-03-11"
    }
  ]
}
```

Success: updated profile object (`200`).

Errors:

- `400` field errors
- `401` unauthorized

Note:

- If `children` is included, backend replaces existing children list for the related bridge.

---

## 13) Onboarding (Authenticated)

### `POST /api/v1/auth/onboarding/`

Requires `Authorization: Bearer <access_token>`.

Request:

```json
{
  "name": "Jane",
  "phone": "123456789",
  "state": "CA",
  "court_mandated": false,
  "role": "mother",
  "mode": "bridge",
  "partner_code": "",
  "children": [
    {
      "name": "Child One",
      "date_of_birth": "2018-02-14"
    }
  ]
}
```

Rules:

- `role` must be `father` or `mother`.
- `mode` must be `bridge` or `independent`.
- `partner_code` must be a valid UUID if provided.

Success (`200`):

```json
{
  "message": "Onboarding completed successfully.",
  "data": {
    "shareable_code": "<user_uuid>",
    "twilio_phone_number": "+15735334593",
    "mode_page": true,
    "bridge_mode_page": true,
    "independent_mode_page": false
  }
}
```

Errors (`400`):

- invalid role/mode/partner code
- serializer field validation errors

---

## Error Handling Contract (Frontend Recommendation)

Use this parsing priority:

1. If `detail` exists and is string -> show it.
2. Else if `error` exists -> show it.
3. Else if `non_field_errors` exists (array) -> show first item.
4. Else for field errors (`email`, `password`, etc.) -> show first field error.
5. Else fallback to generic message.

Recommended generic fallback messages:

- `400`: "Request failed. Please check your input."
- `401`: "Session expired. Please log in again."
- `403`: "You do not have permission to perform this action."
- `404`: "Resource not found."
- `500`: "Something went wrong. Please try again."

---

## Suggested Frontend Token Storage Keys

- `pb_access_token`
- `pb_refresh_token`
- `pb_user_role`

When using password-reset activation response:

- map response `refresh` -> `pb_refresh_token`

---

## Typical Auth Flows

### Email Signup Flow

1. `signup`
2. `activate` (OTP)
3. store tokens
4. `onboarding`
5. normal app usage

### Login Flow

1. `login`
2. if `redirect=activation`, show OTP screen
3. else store tokens and continue

### Forgot Password Flow

1. `password/reset/request`
2. `password/reset/activate` (OTP)
3. call `password/reset` with access token
4. optionally force fresh login
