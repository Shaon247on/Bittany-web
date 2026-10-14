# ParentBridge Calls API Guide (Frontend)

This guide covers the full Calls module integration for frontend developers — including setup, WebRTC implementation, Twilio integration, call logs, recordings, and error handling.

---

## Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Authentication](#authentication)
3. [Response Formats](#response-formats)
4. [WebRTC Call — Full Implementation Walkthrough](#webrtc-call--full-implementation-walkthrough)
5. [Twilio Voice Call — Full Implementation Walkthrough](#twilio-voice-call--full-implementation-walkthrough)
6. [REST API Reference](#rest-api-reference)
7. [WebSocket Event Reference](#websocket-event-reference)
8. [Recordings](#recordings-apis)
9. [Error Handling](#error-handling)
10. [Known Backend Behaviors](#known-backend-behaviors)

---

## Setup & Prerequisites

### Backend requirements (confirm with your backend team)

- Django Channels is running via Daphne (ASGI server, not plain `runserver`)
- Redis is running and configured as the channel layer
- JWT middleware is active on WebSocket connections
- User accounts exist with valid numeric IDs

### Frontend requirements

- Run on **HTTPS in production** — browsers block microphone access on non-localhost HTTP
- A valid JWT access token (obtained from the auth login endpoint)
- The receiver's **user ID** (integer) — fetch from `GET /api/v1/call/webrtc/users/`
- Both caller and receiver must be simultaneously connected to the WebSocket for a call to work

### Base URLs

| Environment | HTTP Base | WebSocket Base |
|---|---|---|
| Local | `http://localhost:7000` | `ws://localhost:7000` |
| Production | `https://yourdomain.com` | `wss://yourdomain.com` |

- REST prefix: `/api/v1/call/`
- WebRTC WebSocket: `/ws/call/webrtc/`
- Twilio WebSocket: `/ws/call/twilio/{call_id}/`

---

## Authentication

### REST Requests

Include the JWT access token in every request header:

```http
Authorization: Bearer <access_token>
```

### WebSocket Connections

Pass the token as a query parameter:

```
ws://localhost:7000/ws/call/webrtc/?token=<access_token>
```

If the token is invalid or missing, the socket is immediately closed with code **4001**.

---

## Response Formats

> **Important:** The calls module uses two different response styles. Always parse defensively.

### Style 1 — ApiResponse envelope (used by most GET endpoints and initiate)

```json
{
  "success": true,
  "message": "...",
  "data": { },
  "meta": {
    "timestamp": "2026-04-12T14:20:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

### Style 2 — Plain DRF JSON (used by end, update, delete, webrtc initiate)

```json
{
  "error": "Call not found"
}
```

### Recommended defensive parser

```js
function parseResponse(res, body) {
  if (!res.ok) {
    // Try ApiResponse style first
    const msg = body?.message || body?.error
      || Object.values(body || {})[0]
      || fallbackMessage(res.status);
    throw new Error(msg);
  }
  // Unwrap ApiResponse if present, otherwise return body directly
  return body?.data !== undefined ? body.data : body;
}

function fallbackMessage(status) {
  const map = {
    400: 'Invalid call request data.',
    401: 'Session expired. Please log in again.',
    403: 'You do not have access to this call.',
    404: 'Call or recording not found.',
    500: 'Call service is temporarily unavailable.',
  };
  return map[status] || 'An unexpected error occurred.';
}
```

---

## WebRTC Call — Full Implementation Walkthrough

WebRTC is the peer-to-peer audio call system. The backend acts as a **signaling server** over WebSocket — it relays SDP offers/answers and ICE candidates between two users. The actual audio never touches the server.

### Step 1 — Connect to the WebSocket

Connect once when the user logs in or opens the app. Keep this connection alive for the entire session so incoming calls can be received at any time.

```js
let ws = null;

function connectWebSocket(token) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}/ws/call/webrtc/?token=${token}`);

  ws.onopen = () => console.log('WebSocket connected');

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    handleSignal(msg);
  };

  ws.onclose = (e) => {
    console.warn('WebSocket closed:', e.code, e.reason);
    if (e.code === 4001) alert('Authentication failed. Please log in again.');
    // Reconnect after delay if desired
    setTimeout(() => connectWebSocket(token), 3000);
  };

  ws.onerror = () => console.error('WebSocket error');
}
```

### Step 2 — Request Microphone Permission

Request microphone access before allowing a call to start. Cache the stream.

```js
let localStream = null;

async function enableMicrophone() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Optionally attach to a muted <audio> element for local monitoring
    document.getElementById('localAudio').srcObject = localStream;
  } catch (err) {
    alert('Microphone access denied: ' + err.message);
  }
}
```

### Step 3 — Fetch Available Users

Before making a call, load users so the caller can pick a recipient.

```js
async function fetchUsers(token) {
  const res = await fetch('/api/v1/call/webrtc/users/', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  return body.users; // Array of { id, email, name, username, image }
}
```

### Step 4 — Make a Call (Caller side)

```js
let pc = null;
let currentCallId = null;
let currentReceiverId = null;

async function startCall(receiverId) {
  if (!localStream) throw new Error('Enable microphone first');
  currentReceiverId = receiverId;

  // Step 4a: Create RTCPeerConnection
  pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN server here for production cross-network calls:
      // { urls: 'turn:your.turn.server', username: '...', credential: '...' }
    ]
  });

  // Step 4b: Add local audio tracks
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // Step 4c: Handle incoming remote audio
  pc.ontrack = (e) => {
    document.getElementById('remoteAudio').srcObject = e.streams[0];
  };

  // Step 4d: Send ICE candidates to receiver via WebSocket as they are generated
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      ws.send(JSON.stringify({
        type: 'ice_candidate',
        candidate: e.candidate,
        receiver_id: receiverId,
        call_id: currentCallId
      }));
    }
  };

  pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState);
  };

  // Step 4e: Create SDP offer
  const offer = await pc.createOffer();
  // Fix SDP direction to sendrecv
  const sdp = offer.sdp.replace(/a=recvonly/g, 'a=sendrecv');
  await pc.setLocalDescription({ type: 'offer', sdp });

  // Step 4f: Send offer to server — it forwards to receiver
  ws.send(JSON.stringify({
    type: 'offer',
    sdp: pc.localDescription.sdp,
    receiver_id: String(receiverId)
  }));
}
```

### Step 5 — Handle Incoming Call (Receiver side)

The `incoming_call` signal arrives on the receiver's WebSocket. Show a UI prompt with Accept / Decline buttons. **Do not auto-answer in production.**

```js
let pendingOffer = null;

function handleSignal(msg) {
  switch (msg.type) {
    case 'incoming_call':
      pendingOffer = msg;
      showIncomingCallUI(msg);
      break;

    case 'call_initiated':
      // Caller receives this after offer is relayed — store call_id
      currentCallId = msg.call_id;
      break;

    case 'call_accepted':
    case 'call_answer':
      // Caller receives the answer — set remote description
      if (msg.sdp && pc) {
        const sdp = msg.sdp.replace(/a=recvonly/g, 'a=sendrecv');
        pc.setRemoteDescription({ type: 'answer', sdp });
      }
      break;

    case 'ice_candidate':
      if (msg.candidate && pc) {
        pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(console.warn);
      }
      break;

    case 'call_declined':
      alert('Call was declined.');
      cleanupCall();
      break;

    case 'call_ended':
      alert('Call has ended.');
      cleanupCall();
      break;

    case 'recording_started':
      console.log('Recording started for call', msg.call_id);
      break;

    case 'recording_stopped':
      console.log('Recording stopped for call', msg.call_id);
      break;

    case 'error':
      console.error('Server error:', msg.message);
      break;
  }
}

function showIncomingCallUI(msg) {
  // Display caller name and two buttons: Accept / Decline
  document.getElementById('callerName').textContent = msg.caller_name || `User ${msg.caller_id}`;
  document.getElementById('incomingCallModal').style.display = 'flex';
}

async function acceptCall() {
  document.getElementById('incomingCallModal').style.display = 'none';
  const msg = pendingOffer;
  currentCallId = msg.call_id;
  currentReceiverId = msg.caller_id;

  pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  if (localStream) {
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  }

  pc.ontrack = (e) => {
    document.getElementById('remoteAudio').srcObject = e.streams[0];
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      ws.send(JSON.stringify({
        type: 'ice_candidate',
        candidate: e.candidate,
        receiver_id: currentReceiverId,
        call_id: currentCallId
      }));
    }
  };

  const sdp = msg.sdp.replace(/a=recvonly/g, 'a=sendrecv');
  await pc.setRemoteDescription({ type: 'offer', sdp });

  const answer = await pc.createAnswer();
  const answerSdp = answer.sdp.replace(/a=recvonly/g, 'a=sendrecv');
  await pc.setLocalDescription({ type: 'answer', sdp: answerSdp });

  ws.send(JSON.stringify({
    type: 'answer',
    sdp: pc.localDescription.sdp,
    call_id: currentCallId
  }));

  pendingOffer = null;
}

function declineCall() {
  document.getElementById('incomingCallModal').style.display = 'none';
  if (pendingOffer) {
    ws.send(JSON.stringify({
      type: 'call_decline',
      call_id: pendingOffer.call_id
    }));
    pendingOffer = null;
  }
}
```

### Step 6 — End the Call

```js
function endCall() {
  if (ws && currentCallId) {
    ws.send(JSON.stringify({
      type: 'call_end',
      call_id: currentCallId
    }));
  }
  cleanupCall();
}

function cleanupCall() {
  if (pc) {
    pc.close();
    pc = null;
  }
  currentCallId = null;
  currentReceiverId = null;
  document.getElementById('remoteAudio').srcObject = null;
}
```

### Step 7 — Recording (optional)

Start and stop recording over the WebSocket. On `stop_recording`, send the audio data as a base64-encoded webm string; the backend stores it.

```js
function startRecording() {
  ws.send(JSON.stringify({ type: 'start_recording', call_id: currentCallId }));
}

async function stopRecording(mediaRecorderInstance) {
  // Collect recorded chunks and base64 encode them
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  ws.send(JSON.stringify({
    type: 'stop_recording',
    call_id: currentCallId,
    recording_data: base64
  }));
}
```

### WebRTC Signal Flow Diagram

```
Caller                        Server (Signaling)              Receiver
  |                                  |                            |
  |-- offer (sdp, receiver_id) ----->|                            |
  |                                  |-- incoming_call (sdp) ---->|
  |<-- call_initiated (call_id) -----|    [user sees Accept UI]   |
  |                                  |<-- answer (sdp, call_id) --|
  |<-- call_accepted (sdp) ----------|                            |
  |-- ice_candidate ---------------->|-- ice_candidate ---------->|
  |<-- ice_candidate ----------------|<-- ice_candidate ----------|
  |                                                               |
  |<================ AUDIO FLOWING PEER-TO-PEER ================>|
  |                                  |                            |
  |-- call_end (call_id) ----------->|-- call_ended ------------>|
```

---

## Twilio Voice Call — Full Implementation Walkthrough

Twilio calls are phone-based voice calls. The backend uses Twilio's infrastructure. The frontend initiates via REST, then monitors status in real-time via WebSocket.

> **Note:** Do NOT call `/webhook/connect/`, `/webhook/incoming/`, or `/webhook/status/` from the frontend. These are backend-to-backend Twilio callbacks only.

### Step 1 — Initiate the Call

```js
async function initiateTwilioCall(token, receiverPhone, callerPhone = null) {
  const body = { receiver_phone: receiverPhone };
  if (callerPhone) body.caller_phone = callerPhone;

  const res = await fetch('/api/v1/call/initiate/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to initiate call');
  }

  // data.data contains: call_log_id, twilio_sid, receiver, status
  return data.data;
}
```

Phone numbers must be in E.164 format (e.g., `+14155552671`). The user must have a Twilio phone number provisioned on their account.

### Step 2 — Connect to the Twilio WebSocket

Once you have the `call_log_id`, connect to the Twilio WebSocket to receive real-time status updates and send actions.

```js
let twilioWs = null;

function connectTwilioSocket(token, callId) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  twilioWs = new WebSocket(`${protocol}//${location.host}/ws/call/twilio/${callId}/?token=${token}`);

  twilioWs.onmessage = (e) => {
    const event = JSON.parse(e.data);
    handleTwilioEvent(event);
  };

  twilioWs.onclose = (e) => console.warn('Twilio socket closed:', e.code);
}

function handleTwilioEvent(event) {
  switch (event.type) {
    case 'incoming_call':
      showIncomingCallPrompt(event);
      break;
    case 'call_status':
      updateCallStatusUI(event.status, event.duration);
      break;
    case 'call_answered':
      showCallActiveUI();
      break;
    case 'call_declined':
      alert('Call declined.');
      break;
    case 'call_held':
      showHoldUI();
      break;
    case 'call_resumed':
      showActiveUI();
      break;
    case 'call_transfer':
      console.log('Call transferred to', event.transfer_to);
      break;
    case 'error':
      console.error('Twilio error:', event.message);
      break;
  }
}
```

### Step 3 — Send Actions over WebSocket

```js
// Answer an incoming call
twilioWs.send(JSON.stringify({ action: 'answer' }));

// Decline a call
twilioWs.send(JSON.stringify({ action: 'decline' }));

// Put on hold
twilioWs.send(JSON.stringify({ action: 'hold' }));

// Resume from hold
twilioWs.send(JSON.stringify({ action: 'resume' }));

// Transfer to another number
twilioWs.send(JSON.stringify({
  action: 'transfer',
  transfer_to: '+14155550002'
}));
```

### Step 4 — End the Call via REST

```js
async function endTwilioCall(token, callId) {
  const res = await fetch(`/api/v1/call/logs/${callId}/end/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const body = await res.json();
  // Returns: { message, call_id, status }
  return body;
}
```

---

## REST API Reference

### Endpoint Summary

| # | Method | Endpoint | Style |
|---|---|---|---|
| 1 | POST | /api/v1/call/initiate/ | ApiResponse |
| 2 | POST | /api/v1/call/logs/{call_id}/end/ | Plain |
| 3 | GET | /api/v1/call/logs/ | ApiResponse |
| 4 | POST | /api/v1/call/logs/create/ | Plain serializer |
| 5 | GET | /api/v1/call/logs/{call_id}/ | ApiResponse |
| 6 | PATCH | /api/v1/call/logs/{call_id}/update/ | Plain serializer |
| 7 | DELETE | /api/v1/call/logs/{call_id}/delete/ | 204 no content |
| 8 | GET | /api/v1/call/statistics/ | Plain |
| 9 | GET | /api/v1/call/webrtc/users/ | Plain |
| 10 | POST | /api/v1/call/webrtc/initiate/ | Plain |
| 11 | GET | /api/v1/call/webrtc/history/ | Plain |
| 12 | GET | /api/v1/call/webrtc/details/{call_id}/ | Plain serializer |
| 13 | GET | /api/v1/call/{call_id}/recordings/ | Plain |
| 14 | POST | /api/v1/call/{call_id}/recordings/upload/ | Plain serializer |
| 15 | DELETE | /api/v1/call/recordings/{recording_id}/delete/ | Plain |

---

## Twilio Voice Call APIs

## 1) Initiate Twilio Call

### POST /api/v1/call/initiate/

Request:

```json
{
  "receiver_phone": "+14155552671",
  "caller_phone": "+14155550001"
}
```

Rules:

- `receiver_phone` required. Must be E.164 format.
- `caller_phone` optional. If omitted, backend uses the authenticated user's phone on file.
- The authenticated user must have a Twilio phone number provisioned on their account.

Success 201 (ApiResponse):

```json
{
  "success": true,
  "message": "Call initiated successfully",
  "data": {
    "call_log_id": 101,
    "twilio_sid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "receiver": "+14155552671",
    "caller_phone": "+14155550001",
    "from_number": "+15735334593",
    "status": "ringing"
  },
  "meta": {
    "timestamp": "2026-04-12T14:20:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

After success, use `call_log_id` to connect to the Twilio WebSocket for real-time events.

Common errors:

- 400 `receiver_phone is required`
- 400 `Invalid E.164 format`
- 400 `No Twilio number provisioned`
- 500 `Twilio not configured`

---

## 2) End Ongoing Call

### POST /api/v1/call/logs/{call_id}/end/

Plain JSON response style.

Success 200:

```json
{
  "message": "Call ended",
  "call_id": 101,
  "status": "completed"
}
```

Errors:

- 404 { "error": "Call not found" }
- 500 { "error": "..." }

---

## Call Logs APIs

## 3) Get Call Logs

### GET /api/v1/call/logs/

ApiResponse style.

> **Important:** The backend uses a cached queryset for this endpoint. Always re-fetch the list after any create/update/delete/end action.

Query params:

| Param | Values |
|---|---|
| call_type | `incoming` \| `outgoing` \| `missed` |
| call_method | `twilio` \| `webrtc` |
| status | `completed` \| `missed` \| `failed` \| `pending` \| `ringing` \| `declined` |
| start_date | `YYYY-MM-DD` |
| end_date | `YYYY-MM-DD` |

Success 200:

```json
{
  "success": true,
  "message": "Call logs retrieved successfully",
  "data": {
    "results": [
      {
        "id": 101,
        "caller": 2,
        "caller_name": "Jane Doe",
        "caller_email": "jane@example.com",
        "caller_image": null,
        "receiver": "+14155552671",
        "receiver_user": null,
        "receiver_user_name": null,
        "receiver_image": null,
        "status": "completed",
        "call_type": "outgoing",
        "call_method": "twilio",
        "start_time": "2026-04-12T14:10:00Z",
        "end_time": "2026-04-12T14:14:00Z",
        "duration": 240,
        "timestamp": "2026-04-12T14:10:00Z",
        "twilio_call_sid": "CAxxxxxxxx",
        "recordings": []
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-12T14:22:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

## 4) Create Call Log

### POST /api/v1/call/logs/create/

Plain serializer response style.

Request example:

```json
{
  "receiver": "receiver@example.com",
  "receiver_user": 5,
  "call_type": "outgoing",
  "call_method": "webrtc",
  "status": "pending"
}
```

Success 201: full CallLog serializer object.

## 5) Get Call Detail

### GET /api/v1/call/logs/{call_id}/

Success 200 (ApiResponse):

```json
{
  "success": true,
  "message": "Call details retrieved successfully",
  "data": {
    "id": 101
  },
  "meta": {
    "timestamp": "2026-04-12T14:24:00.000000Z",
    "request_id": "a1b2c3d4"
  }
}
```

Error 404 (plain style):

```json
{
  "error": "Call not found"
}
```

## 6) Update Call Log

### PATCH /api/v1/call/logs/{call_id}/update/

Request example:

```json
{
  "status": "completed",
  "end_time": "2026-04-12T14:14:00Z",
  "duration": 240
}
```

Success 200: updated serializer object.
Error 404: plain error message.

## 7) Delete Call Log

### DELETE /api/v1/call/logs/{call_id}/delete/

Success 204 (no content).
Error 404:

```json
{
  "error": "Call not found"
}
```

## 8) Call Statistics

### GET /api/v1/call/statistics/

Plain JSON response:

```json
{
  "total_calls": 40,
  "completed_calls": 28,
  "missed_calls": 4,
  "failed_calls": 3,
  "declined_calls": 5,
  "total_duration": 3810,
  "average_duration": 95.25,
  "twilio_calls": 25,
  "webrtc_calls": 15
}
```

---

## WebRTC REST APIs

## 9) Get Available Users

### GET /api/v1/call/webrtc/users/

Response:

```json
{
  "users": [
    {
      "id": 5,
      "email": "john@example.com",
      "name": "John",
      "username": "john_5",
      "image": null
    }
  ]
}
```

## 10) Initiate WebRTC Call (REST helper — optional but recommended)

### POST /api/v1/call/webrtc/initiate/

Call this **before** sending the WebSocket `offer` to register the call in the database. This gives you a `call_id` that you can attach to subsequent WebSocket messages and recordings.

Request:

```json
{
  "receiver_id": 5
}
```

Success 201:

```json
{
  "message": "WebRTC call initiated",
  "call_id": 333,
  "status": "pending",
  "receiver": {
    "id": 5,
    "name": "John",
    "email": "john@example.com"
  }
}
```

Errors:

- 400 `receiver_id is required`
- 404 `receiver not found`

## 11) Get WebRTC History

### GET /api/v1/call/webrtc/history/

Query params:

- call_method: twilio | webrtc (optional)
- limit: integer (default 50)

Response:

```json
{
  "calls": [
    {
      "id": 333,
      "call_method": "webrtc",
      "status": "completed"
    }
  ]
}
```

## 12) Get WebRTC Call Details

### GET /api/v1/call/webrtc/details/{call_id}/

Success 200: CallLog serializer object.

Errors:

- 403 { "error": "Access denied" }
- 404 { "error": "Call not found" }

---

## Recordings APIs

## 13) Get Call Recordings

### GET /api/v1/call/{call_id}/recordings/

Response:

```json
{
  "call_id": 101,
  "recordings_count": 1,
  "recordings": [
    {
      "id": 7,
      "recording_url": "http://localhost:7000/media/call_recordings/call_101_20260412_142000.webm",
      "twilio_recording_sid": null,
      "created_at": "2026-04-12T14:30:00Z"
    }
  ]
}
```

Error 404: call not found.

## 14) Upload Recording

### POST /api/v1/call/{call_id}/recordings/upload/

Use `multipart/form-data`. Use this endpoint if you captured audio client-side and want to store it manually (outside of the WebSocket `stop_recording` flow).

Fields:

- `recording_file` (required) — audio file blob
- `twilio_recording_sid` (optional)

```js
async function uploadRecording(token, callId, audioBlob) {
  const form = new FormData();
  form.append('recording_file', audioBlob, `call_${callId}.webm`);

  const res = await fetch(`/api/v1/call/${callId}/recordings/upload/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  return res.json();
}
```

Success 201: CallRecording serializer response.
Error 400 if `recording_file` missing.
Error 404 if call not found.

## 15) Delete Recording

### DELETE /api/v1/call/recordings/{recording_id}/delete/

Success 200:

```json
{
  "message": "Recording deleted successfully"
}
```

Errors:

- 403 no access
- 404 recording not found

---

## WebSocket Event Reference

### WebSocket: Twilio Call Consumer

Endpoint:

```
ws://localhost:7000/ws/call/twilio/{call_id}/?token=<access_token>
```

> Only the **caller** can connect to this socket. The receiver_user cannot connect to this room.

#### Client → Server actions

| Action | Extra fields |
|---|---|
| `answer` | — |
| `decline` | — |
| `hold` | — |
| `resume` | — |
| `transfer` | `transfer_to: "+E164number"` |

```json
{ "action": "answer" }
{ "action": "transfer", "transfer_to": "+14155550002" }
```

#### Server → Client event types

| Event type | Description |
|---|---|
| `incoming_call` | Incoming call notification |
| `call_status` | Status update with duration |
| `call_answered` | Call was picked up |
| `call_declined` | Call was declined |
| `call_held` | Call placed on hold |
| `call_resumed` | Hold lifted |
| `call_transfer` | Call transferred |
| `error` | Something went wrong |

Example status event:

```json
{
  "type": "call_status",
  "call_id": 101,
  "status": "completed",
  "duration": 240,
  "timestamp": "2026-04-12T14:40:00Z"
}
```

---

### WebSocket: WebRTC Signaling

Endpoint:

```
ws://localhost:7000/ws/call/webrtc/?token=<access_token>
```

#### Client → Server message types

| Type | Required fields | Description |
|---|---|---|
| `offer` | `sdp`, `receiver_id` | Start a call to another user |
| `answer` | `sdp`, `call_id` | Accept an incoming call |
| `ice_candidate` | `candidate`, `receiver_id` or `call_id` | Exchange ICE candidates |
| `call_end` | `call_id` | End the current call |
| `call_decline` | `call_id` | Decline an incoming call |
| `start_recording` | `call_id` | Signal server to mark recording started |
| `stop_recording` | `call_id`, `recording_data` | Send base64 audio data to server |

```json
{ "type": "offer", "sdp": "v=0...", "receiver_id": "5" }
{ "type": "answer", "sdp": "v=0...", "call_id": "333" }
{ "type": "ice_candidate", "candidate": { "candidate": "candidate:...", "sdpMLineIndex": 0, "sdpMid": "0" }, "receiver_id": "5" }
{ "type": "call_end", "call_id": "333" }
{ "type": "call_decline", "call_id": "333" }
{ "type": "start_recording", "call_id": "333" }
{ "type": "stop_recording", "call_id": "333", "recording_data": "<base64-webm>" }
```

#### Server → Client event types

| Event type | Description |
|---|---|
| `incoming_call` | Receiver gets this with caller SDP. Contains: `call_id`, `caller_id`, `caller_name`, `caller_image`, `sdp` |
| `call_initiated` | Caller gets this after offer is relayed. Contains: `call_id` |
| `call_accepted` | Caller gets the answer SDP. Contains: `sdp`, `call_id` |
| `ice_candidate` | ICE candidate from the other side. Contains: `candidate` |
| `call_declined` | The other side declined |
| `call_ended` | The other side ended the call |
| `recording_started` | Recording is active |
| `recording_stopped` | Recording saved. Contains: `call_id` |
| `error` | Server-side error. Contains: `message` |

Example `incoming_call` payload (most important to handle):

```json
{
  "type": "incoming_call",
  "call_id": 333,
  "caller_id": "2",
  "caller_name": "Jane",
  "caller_image": null,
  "sdp": "v=0..."
}
```

---

## Call Status and Enum Reference

| Enum | Values |
|---|---|
| `status` | `completed` \| `missed` \| `failed` \| `pending` \| `ringing` \| `declined` |
| `call_type` | `incoming` \| `outgoing` \| `missed` |
| `call_method` | `twilio` \| `webrtc` |

---

## Error Handling

### Parse order (apply to every API call)

```js
async function apiCall(url, options, token) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {})
    }
  });

  const body = res.status === 204 ? null : await res.json();

  if (!res.ok) {
    // 1. ApiResponse style — success: false
    if (body?.success === false) throw new Error(body.message);
    // 2. Plain error key
    if (body?.error) throw new Error(body.error);
    // 3. First field validation error
    const firstField = body && Object.values(body)[0];
    if (Array.isArray(firstField)) throw new Error(firstField[0]);
    // 4. Fallback by status code
    throw new Error(fallbackMessage(res.status));
  }

  // Unwrap ApiResponse envelope if present
  return body?.data !== undefined ? body.data : body;
}

function fallbackMessage(status) {
  const map = {
    400: 'Invalid call request data.',
    401: 'Session expired. Please log in again.',
    403: 'You do not have access to this call.',
    404: 'Call or recording not found.',
    500: 'Call service is temporarily unavailable.',
  };
  return map[status] || 'An unexpected error occurred.';
}
```

### WebSocket close codes

| Code | Meaning | Action |
|---|---|---|
| `4001` | Invalid or expired token | Redirect to login |
| `4000` | Server error | Show error, retry |
| `1000` | Normal close | No action needed |
| `1006` | Abnormal closure (network) | Attempt reconnect with backoff |

---

## Known Backend Behaviors

1. **Mixed response formats** — The same module uses both `ApiResponse` envelope and plain DRF JSON depending on the endpoint. Always use the defensive parser above.
2. **Twilio WebSocket room is caller-only** — The `receiver_user` cannot connect to `/ws/call/twilio/{call_id}/`. Only the caller has access to that room.
3. **Twilio webhooks are backend-to-backend** — Never call `/webhook/connect/`, `/webhook/incoming/`, or `/webhook/status/` from the frontend. These are called by Twilio's servers automatically.
4. **Call logs use cached queryset** — Always re-fetch `GET /api/v1/call/logs/` after any create, end, update, or delete action to see fresh data.
5. **STUN only is not enough in production** — The test page uses only Google STUN. Calls will fail across different real-world networks (symmetric NAT) without a TURN server. Configure a TURN server before going to production.
6. **receiver_id must be a user ID integer** — The WebRTC offer message takes `receiver_id` as a string representation of the user's numeric ID, not username or email.
