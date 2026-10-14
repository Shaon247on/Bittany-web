# ParentBridge Support API Guide (Frontend)

This guide covers Support module integration only.

## Base URL

- HTTP base: http://localhost:7000
- Support prefix: /api/v1/support/
- All endpoints require JWT access token.

## Authentication

Send on each request:

```http
Authorization: Bearer <access_token>
```

## Response Envelope

Support endpoints use the shared ApiResponse wrapper.

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T13:40:00.000000Z",
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
    "timestamp": "2026-04-12T13:40:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## Endpoint Summary

1. GET /api/v1/support/posts/
2. POST /api/v1/support/post/create/
3. GET /api/v1/support/post/{post_id}/
4. PUT /api/v1/support/post/{post_id}/update/
5. DELETE /api/v1/support/post/{post_id}/delete/
6. GET /api/v1/support/post/{post_id}/comments/
7. POST /api/v1/support/post/{post_id}/comment/create/
8. PUT /api/v1/support/post/{post_id}/comment/{comment_id}/update/
9. DELETE /api/v1/support/post/{post_id}/comment/{comment_id}/delete/
10. POST /api/v1/support/posts/{post_id}/reaction/toggle/

---

## Support Post Contract

```ts
type SupportPost = {
  id: number;
  user: string; // string representation from backend
  subject: string;
  message: string;
  category: 'scheduling' | 'parenting' | 'communication' | 'success' | 'other' | null;
  react_count: number;
  comment_count: number;
  is_reacted: boolean;
  is_commented: boolean;
  my_post: boolean;
  created_at: string;
  updated_at: string;
  time_since_created: string; // e.g. "2 hours ago"
};
```

Allowed category values:

- scheduling
- parenting
- communication
- success
- other

---

## 1) List Support Posts

### GET /api/v1/support/posts/

Returns all posts ordered by newest first.

Success 200:

```json
{
  "success": true,
  "message": "Support posts retrieved successfully",
  "data": [
    {
      "id": 9,
      "user": "john@example.com",
      "subject": "Need schedule advice",
      "message": "How do you handle holiday swaps?",
      "category": "scheduling",
      "react_count": 3,
      "comment_count": 2,
      "is_reacted": false,
      "is_commented": true,
      "my_post": false,
      "created_at": "2026-04-12T13:30:00.000000Z",
      "updated_at": "2026-04-12T13:30:00.000000Z",
      "time_since_created": "10 minutes ago"
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T13:40:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 2) Create Support Post

### POST /api/v1/support/post/create/

Request:

```json
{
  "subject": "Need schedule advice",
  "message": "How do you handle holiday swaps?",
  "category": "scheduling"
}
```

Success 201:

```json
{
  "success": true,
  "message": "Support post created successfully",
  "data": {
    "id": 10,
    "user": "jane@example.com",
    "subject": "Need schedule advice",
    "message": "How do you handle holiday swaps?",
    "category": "scheduling",
    "react_count": 0,
    "comment_count": 0,
    "is_reacted": false,
    "is_commented": false,
    "my_post": false,
    "created_at": "2026-04-12T13:41:00.000000Z",
    "updated_at": "2026-04-12T13:41:00.000000Z",
    "time_since_created": "0 minutes ago"
  },
  "meta": {
    "timestamp": "2026-04-12T13:41:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Validation error 400:

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
    "timestamp": "2026-04-12T13:41:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 3) Get Post Detail

### GET /api/v1/support/post/{post_id}/

Success 200 returns one SupportPost object in data.

Not found 404:

```json
{
  "success": false,
  "message": "Support post not found",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T13:43:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 4) Update Post

### PUT /api/v1/support/post/{post_id}/update/

Partial update is allowed by backend despite PUT method.

Request example:

```json
{
  "subject": "Updated subject",
  "message": "Updated body"
}
```

Success 200 returns updated SupportPost in data.

Errors:

- 403 if not owner
- 404 if post not found
- 400 validation

403 example:

```json
{
  "success": false,
  "message": "You do not have permission to update this post",
  "error": {
    "code": "UNKNOWN_ERROR",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-04-12T13:45:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

---

## 5) Delete Post

### DELETE /api/v1/support/post/{post_id}/delete/

Success 200:

```json
{
  "success": true,
  "message": "Support post deleted successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T13:46:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Errors:

- 403 if not owner
- 404 if post not found

---

## Comment Contract

```ts
type SupportComment = {
  id: number;
  message: string;
  comment_user: {
    id: number;
    username: string;
    image: string | null;
    name: string | null;
  };
  created_at: string;
  time_since_commented: string;
  replies: Array<{
    id: number;
    message: string;
    reply_to: number | null;
    comment_user: {
      id: number;
      username: string;
    };
    created_at: string;
    time_since_commented: string;
  }>;
  reply_to: number | null;
};
```

---

## 6) List Comments

### GET /api/v1/support/post/{post_id}/comments/

Success 200:

```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": 11,
      "message": "Try a shared calendar.",
      "comment_user": {
        "id": 5,
        "username": "father_5",
        "image": null,
        "name": "John"
      },
      "created_at": "2026-04-12T13:50:00.000000Z",
      "time_since_commented": "2 minutes ago",
      "replies": [],
      "reply_to": null
    }
  ],
  "meta": {
    "timestamp": "2026-04-12T13:52:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

404 if post not found.

---

## 7) Add Comment

### POST /api/v1/support/post/{post_id}/comment/create/

Request (normal comment):

```json
{
  "message": "Try a shared calendar."
}
```

Request (reply):

```json
{
  "message": "Thanks, that helps.",
  "reply_to": 11
}
```

Success 201 returns created SupportComment object.

Errors:

- 404 post not found
- 400 validation

---

## 8) Update Comment

### PUT /api/v1/support/post/{post_id}/comment/{comment_id}/update/

Partial update is allowed by backend despite PUT method.

Request:

```json
{
  "message": "Edited message"
}
```

Success 200 returns updated SupportComment.

Errors:

- 403 if not owner
- 404 post or comment not found
- 400 invalid data

---

## 9) Delete Comment

### DELETE /api/v1/support/post/{post_id}/comment/{comment_id}/delete/

Success 200:

```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T13:58:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Errors:

- 403 if not owner
- 404 post/comment not found

Important backend behavior:

- Delete comment path decrements a field named total_comments, but model field is comment_count.
- This can cause server-side failure in some cases.

Frontend fallback recommendation:

- If delete comment returns unexpected 500, refresh comments list and continue.

---

## 10) Toggle Post Reaction

### POST /api/v1/support/posts/{post_id}/reaction/toggle/

Request:

```json
{
  "reaction_type": "like"
}
```

Allowed reaction_type:

- like
- love
- insightful
- funny

Success 200 message examples:

- Reaction added successfully
- Reaction removed successfully
- Reaction updated successfully

Response:

```json
{
  "success": true,
  "message": "Reaction added successfully",
  "data": {},
  "meta": {
    "timestamp": "2026-04-12T14:00:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Important backend behavior:

- On reaction type change, react_count is incremented in backend.
- This can overcount reactions.

Frontend recommendation:

- Prefer using returned post list/detail values as source of truth after toggle.

---

## Frontend Error Handling Recommendation

Parse error in this order:

1. message
2. error.details field-level errors
3. generic fallback by status code

Suggested fallback messages:

- 400: Please check your input.
- 401: Session expired. Please log in again.
- 403: You do not have permission for this action.
- 404: Post or comment not found.
- 500: Could not complete support action.

---

## Practical Frontend Flow

1. Load feed with GET /support/posts/.
2. Load comments only when opening post details.
3. After comment/reaction updates, refetch post detail or posts list to sync counts.
4. Keep optimistic UI minimal because counters may differ from intended behavior in current backend.
