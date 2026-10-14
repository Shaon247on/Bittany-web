# ParentBridge Document API Guide (Frontend)

This guide covers the Document module endpoints and the current backend behavior for frontend integration.

## Base URL

- Local backend example: `http://localhost:7000`
- Document API prefix: `/api/v1/document/`
- Full example: `GET /api/v1/document/documents/`

## Authentication

All Document endpoints require a JWT access token.

Send this header on every request:

```http
Authorization: Bearer <access_token>
```

For token issuance and refresh flow, see `docs/authentication-frontend-guide.md`.

## Response Envelope

These endpoints use the shared `ApiResponse` wrapper.

Success shape:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {
    "timestamp": "2026-04-19T10:00:00.000000Z",
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
    "timestamp": "2026-04-19T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## Endpoint Summary

1. `GET /api/v1/document/documents/`
2. `POST /api/v1/document/documents/`
3. `PUT /api/v1/document/documents/{document_id}/`
4. `DELETE /api/v1/document/documents/{document_id}/`

## Query Params (GET)

- `document_id` (optional): returns one document if found in the current user + partner scope.
- `category` (optional): filters list by category; use `all` or omit to return all categories.

## Visibility Rules

- List/detail are scoped to documents where:
  - `user = current user`, or
  - `user = partner(current user)`
- Update/delete are scoped to documents where:
  - `user = current user` only

## Data Model (Backend)

Document model fields used by backend data layer:

- `id`: number
- `user`: number (owner user id)
- `bridge`: number
- `child`: number
- `title`: string
- `category`: string
- `expiration_date`: `YYYY-MM-DD`
- `created_at`: datetime
- `files`: array of attached files (related model)
- `images`: array of attached images (related model)

Category values in model:

- `medical`
- `financial`
- `activity`
- `education`
- `legal`
- `other`

## 1) Get Documents (List or Single)

### `GET /api/v1/document/documents/`

Returns documents visible to current user (self + partner), ordered newest first.

Request examples:

```http
GET /api/v1/document/documents/
GET /api/v1/document/documents/?category=medical
GET /api/v1/document/documents/?document_id=12
```

Success `200` (list):

```json
{
  "success": true,
  "message": "Documents retrieved",
  "data": [
    {
      "id": 12,
      "user": 4,
      "bridge": 2,
      "title": "Doctor Visit Summary",
      "child": 7,
      "category": "medical",
      "expiration_date": "2027-04-01",
      "created_at": "2026-04-19T07:10:00.000000Z",
      "files": [
        {
          "id": 3,
          "file": "/media/documents/report.pdf",
          "created_at": "2026-04-19T07:10:00.000000Z"
        }
      ],
      "images": [
        {
          "id": 8,
          "image": "/media/document_images/prescription.jpg",
          "created_at": "2026-04-19T07:10:00.000000Z"
        }
      ],
      "file_type": null,
      "file_size": null
    }
  ],
  "meta": {
    "timestamp": "2026-04-19T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Success `200` (single via `document_id`):

```json
{
  "success": true,
  "message": "Document retrieved",
  "data": {
    "id": 12,
    "user": 4,
    "bridge": 2,
    "title": "Doctor Visit Summary",
    "child": 7,
    "category": "medical",
    "expiration_date": "2027-04-01",
    "created_at": "2026-04-19T07:10:00.000000Z",
    "files": [],
    "images": [],
    "file_type": null,
    "file_size": null
  },
  "meta": {
    "timestamp": "2026-04-19T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Not found `404` (when `document_id` is provided but not accessible):

```json
{
  "success": false,
  "message": "Document not found",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": ""
  },
  "meta": {
    "timestamp": "2026-04-19T10:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## 2) Create Document

### `POST /api/v1/document/documents/`

Creates a new document for the authenticated user.

Content type:

- `multipart/form-data`

Supported upload keys:

- `upload_files`: repeated file field
- `upload_images`: repeated image field

Example request (`multipart/form-data`):

- `child`: `7`
- `category`: `medical`
- `title`: `Doctor Visit Summary`
- `expiration_date`: `2027-04-01`
- `upload_files`: `(file)`
- `upload_images`: `(image)`

Success `201`:

```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "id": 15,
    "user": 4,
    "bridge": 2,
    "title": "Doctor Visit Summary",
    "child": 7,
    "category": "medical",
    "expiration_date": "2027-04-01",
    "created_at": "2026-04-19T11:00:00.000000Z",
    "files": [],
    "images": [],
    "file_type": null,
    "file_size": null
  },
  "meta": {
    "timestamp": "2026-04-19T11:00:00.000000Z",
    "request_id": "e5f6g7h8"
  }
}
```

Validation failure `400`:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {
      "field_name": ["error message"]
    }
  },
  "meta": {
    "timestamp": "2026-04-19T11:00:00.000000Z",
    "request_id": "e5f6g7h8"
  }
}
```

## 3) Update Document

### `PUT /api/v1/document/documents/{document_id}/`

Updates a document owned by current user.

Content type:

- `multipart/form-data`

Behavior:

- Partial update is enabled.
- New `upload_files` and `upload_images` are appended to existing related records.

Success `200`:

```json
{
  "success": true,
  "message": "Document updated",
  "data": {
    "id": 15,
    "user": 4,
    "bridge": 2,
    "title": "Doctor Visit Summary",
    "child": 7,
    "category": "medical",
    "expiration_date": "2027-04-01",
    "created_at": "2026-04-19T11:00:00.000000Z",
    "files": [],
    "images": [],
    "file_type": null,
    "file_size": null
  },
  "meta": {
    "timestamp": "2026-04-19T11:30:00.000000Z",
    "request_id": "m1n2o3p4"
  }
}
```

Not found/unauthorized owner `404`:

```json
{
  "success": false,
  "message": "Failed to update document",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": "No Document matches the given query."
  },
  "meta": {
    "timestamp": "2026-04-19T11:30:00.000000Z",
    "request_id": "m1n2o3p4"
  }
}
```

## 4) Delete Document

### `DELETE /api/v1/document/documents/{document_id}/`

Deletes a document owned by current user.

Success `200`:

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-04-19T12:00:00.000000Z",
    "request_id": "q5r6s7t8"
  }
}
```

Not found/unauthorized owner `404`:

```json
{
  "success": false,
  "message": "Failed to delete document",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": "No Document matches the given query."
  },
  "meta": {
    "timestamp": "2026-04-19T12:00:00.000000Z",
    "request_id": "q5r6s7t8"
  }
}
```

## Frontend Integration Notes

1. Use `multipart/form-data` for create/update because parser classes are `MultiPartParser` and `FormParser`.
2. GET single document is implemented with `document_id` query param, not by `GET /documents/{id}/` path.
3. The path with `{document_id}` currently supports only `PUT` and `DELETE`.
4. List/detail visibility includes partner documents; update/delete is owner-only.
5. Send `title`, `category`, `child`, and `expiration_date` on create/update, plus optional `upload_files` and `upload_images`.
6. Most document responses are wrapped with `ApiResponse`; however, create endpoint does not currently have a global try/except block, so unexpected server errors may return default DRF/Django 500 shape.
