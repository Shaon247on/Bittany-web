# ParentBridge Chating API Guide (Frontend)

This document covers only chat integration for frontend, including REST and WebSocket.

## Base URLs

- HTTP base: http://localhost:7000
- REST prefix: /api/v1/chat/
- WebSocket path: /ws/chat/{room_id}/

## Authentication

### REST

Send access token in header:

```http
Authorization: Bearer <access_token>
```

### WebSocket

JWT is read from one of these handshake options:

1. Query param token
2. Query param Authorization=Bearer <token>
3. Header Authorization: Bearer <token>

Recommended URL form:

```text
ws://localhost:7000/ws/chat/{room_id}/?token=<access_token>
```

If auth fails, socket closes with code 4001.
If user is not room participant, socket closes with code 4003.

---

## REST Endpoints

1. GET, POST /api/v1/chat/rooms/
2. GET, DELETE /api/v1/chat/rooms/{room_id}/
3. GET, POST /api/v1/chat/rooms/{room_id}/messages/
4. GET, PUT, DELETE /api/v1/chat/rooms/{room_id}/messages/{message_id}/
5. GET /api/v1/chat/search/users/?q={query}
6. GET /api/v1/chat/download/chat-history/

---

## 1) Chat Room Get or Create

### GET /api/v1/chat/rooms/

Returns a **single** ChatRoom object for the current user. The backend uses the following auto-resolution logic:

1. Return the first room where the user is already a participant.
2. If none found, look for the user's co-parent's room and add the current user to it.
3. If still none found, create a new room named "General Chat" and add both the user and their co-parent.

This means a room is always returned — it is never an empty response.

Success 200 — returns a single ChatRoom object (not an array):

```json
{
  "id": 12,
  "name": "General Chat",
  "room_id": "08b8440d-c9a8-4f2b-9ecf-c8b3ee0ec087",
  "participants": [
    {
      "id": 2,
      "username": "mother_2",
      "name": "Jane",
      "email": "jane@example.com",
      "image": "/media/users_images/jane.jpg"
    }
  ],
  "created_at": "2026-04-12T11:10:00.000000Z",
  "last_message": {
    "id": 77,
    "chat_room": 12,
    "sender": {
      "id": 2,
      "username": "mother_2",
      "name": "Jane",
      "email": "jane@example.com",
      "image": null
    },
    "reply_to": null,
    "message": "Hi",
    "filtered_message": "",
    "attachment": null,
    "image": null,
    "message_type": "text",
    "is_deleted": false,
    "is_filtered": false,
    "status": "neutral",
    "status_color": "green",
    "timestamp": "2026-04-12T11:12:00.000000Z"
  },
  "unread_count": 0
}
```

Notes:

- Response is a single object, NOT an array.
- unread_count is currently always 0 in backend logic.
- last_message excludes deleted messages.

### POST /api/v1/chat/rooms/

Creates a chat room.

Request:

```json
{
  "name": "Support Room",
  "participants": [5, 8]
}
```

Backend automatically adds current user to participants if missing.

Success 201: returns ChatRoom object (same shape as list item).

Errors 400:

```json
{
  "error": "At least one participant is required"
}
```

or

```json
{
  "error": "Some participants do not exist"
}
```

---

## 2) Chat Room Detail and Leave/Delete

### GET /api/v1/chat/rooms/{room_id}/

Returns a single room if user is a participant.

Success 200: ChatRoom object.

Not found 404:

```json
{
  "detail": "Not found."
}
```

### DELETE /api/v1/chat/rooms/{room_id}/

Removes current user from room participants.

If no participants remain, room is deleted.

Success 200:

```json
{
  "message": "Left chat room"
}
```

or

```json
{
  "message": "Chat room deleted"
}
```

---

## 3) Room Messages List and Create

### GET /api/v1/chat/rooms/{room_id}/messages/

Returns non-deleted messages for room, ordered newest first.

Pagination:

- default page_size: 50
- max page_size: 100
- query params: page, page_size

Success 200 (paginated shape):

```json
{
  "count": 120,
  "next": "http://localhost:7000/api/v1/chat/rooms/{room_id}/messages/?page=2",
  "previous": null,
  "results": [
    {
      "id": 10,
      "chat_room": 12,
      "sender": {
        "id": 2,
        "username": "mother_2",
        "name": "Jane",
        "email": "jane@example.com",
        "image": null
      },
      "reply_to": null,
      "message": "Hello",
      "filtered_message": "",
      "attachment": null,
      "image": null,
      "message_type": "text",
      "is_deleted": false,
      "is_filtered": false,
      "status": "neutral",
      "status_color": "green",
      "timestamp": "2026-04-12T11:12:00.000000Z"
    }
  ]
}
```

### POST /api/v1/chat/rooms/{room_id}/messages/

Creates a message in the room.

Request JSON example:

```json
{
  "message": "Can we move pickup to 5 PM?",
  "reply_to": null,
  "message_type": "text"
}
```

Attachment/image upload:

- Use multipart/form-data when sending files.
- Fields: message, message_type, reply_to, attachment, image

Success 201: returns created message object.

Validation errors 400: serializer field errors.

---

## 4) Message Detail, Edit, Delete

### GET /api/v1/chat/rooms/{room_id}/messages/{message_id}/

Returns a non-deleted message.

Success 200: message object.

### PUT /api/v1/chat/rooms/{room_id}/messages/{message_id}/

Only message sender can edit.

Request example:

```json
{
  "message": "Updated text"
}
```

Success 200: updated message object.

Forbidden 403:

```json
{
  "error": "You can only edit your own messages"
}
```

### DELETE /api/v1/chat/rooms/{room_id}/messages/{message_id}/

Only message sender can delete.

Soft delete behavior:

- backend sets is_deleted=true (record remains in DB)

Success 200:

```json
{
  "message": "Message deleted"
}
```

Forbidden 403:

```json
{
  "error": "You can only delete your own messages"
}
```

---

## 5) Search Users

### GET /api/v1/chat/search/users/?q={query}

Searches by username, name, or email, excluding current user.
Result capped at 10 users.

Success 200:

```json
{
  "users": [
    {
      "id": 5,
      "username": "father_5",
      "name": "John",
      "email": "john@example.com",
      "image": null
    }
  ]
}
```

If q is missing or empty:

```json
{
  "users": []
}
```

---

## 6) Download Chat History as PDF

### GET /api/v1/chat/download/chat-history/

Downloads a PDF file containing all non-deleted messages from the current user's chat room (the same room resolved by GET /api/v1/chat/rooms/).

No request body or query params required.

Success 200:

- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="chat_{room_id}.pdf"`
- Body: binary PDF data

The PDF contains a table with columns: ID, Sender, Message (truncated to 50 chars), Type, Time.

Not found 404 (plain text, not JSON):

```
Room not found
```

---

## WebSocket Realtime Chat

## Connect

```text
ws://localhost:7000/ws/chat/{room_id}/?token=<access_token>
```

room_id must be a UUID string.

## Client -> Server Events

### 1) Send message

```json
{
  "type": "message",
  "message": "Hello",
  "reply_to": null,
  "message_type": "text",
  "attachment": null,
  "status": "neutral",
  "status_color": "green"
}
```

### 2) Filter request (persists message and sets filtered fields)

```json
{
  "type": "filter_request",
  "message": "message to moderate",
  "message_type": "text"
}
```

### 3) Suggestion request (does not persist message)

```json
{
  "type": "suggestion_request",
  "message": "draft text"
}
```

### 4) Typing indicator

```json
{
  "type": "typing",
  "is_typing": true
}
```

## Server -> Client Events

### chat_message

```json
{
  "type": "chat_message",
  "message_id": 100,
  "message": "Hello",
  "filtered_message": "",
  "is_filtered": false,
  "sender_id": 5,
  "sender": "father_5",
  "sender_name": "John",
  "sender_image": null,
  "reply_to_id": null,
  "message_type": "text",
  "status": "neutral",
  "status_color": "green",
  "timestamp": "2026-04-12T11:40:00.000000"
}
```

### suggestion_response

```json
{
  "type": "suggestion_response",
  "original_message": "draft text",
  "suggestion": "improved suggestion",
  "status_color": "blue"
}
```

### typing

```json
{
  "type": "typing",
  "user_id": 8,
  "username": "mother_8",
  "is_typing": true
}
```

### user_joined

```json
{
  "type": "user_joined",
  "user_id": 8,
  "username": "mother_8"
}
```

### user_left

```json
{
  "type": "user_left",
  "user_id": 8,
  "username": "mother_8"
}
```

### partner_status

Sent to the connecting user in one-to-one rooms immediately after connect.

```json
{
  "type": "partner_status",
  "is_online": true
}
```

### active_users

Sent to the connecting user in group rooms immediately after connect.

```json
{
  "type": "active_users",
  "users": [
    {
      "id": 12,
      "username": "father_12",
      "is_online": true
    }
  ]
}
```

### error

```json
{
  "type": "error",
  "message": "Message cannot be empty"
}
```

---

## Message Field Reference

message_type values:

- text
- image
- file

status values:

- neutral
- cooperative
- supportive

status_color values stored by model:

- blue
- green
- red

is_deleted behavior:

- Deleted messages are not returned by list endpoint.
- reply_to is returned as null if referenced message is deleted.

---

## Frontend Integration Notes

1. Keep REST as source of truth for history and pagination.
2. Use WebSocket for realtime updates and optimistic UI.
3. After socket reconnect, refetch latest messages from REST to avoid missing events.
4. For message list screen, reverse server order if UI expects oldest at top.
5. Treat non-200 moderation/suggestion backend as graceful fallback because external moderation API can fail.
6. On socket connect, expect an immediate online-status payload: `partner_status` for one-to-one rooms or `active_users` for group rooms.
7. Backend toggles `is_online` based on WebSocket connect/disconnect lifecycle.

---

## Error Handling Recommendation

Parse in this order:

1. error key if present
2. detail key if present
3. first serializer field error
4. fallback by status code

Suggested fallback strings:

- 400: Request invalid. Please check input.
- 401: Session expired. Please log in again.
- 403: You are not allowed to do this action.
- 404: Chat room or message not found.
- 500: Unable to load chat right now. Try again.
