# WebRTC — Web Frontend Integration Guide

> **Stack:** React / Vanilla JS · Browser WebRTC API · WebSocket (JWT Auth)  
> **Signaling Server:** `ws://<host>:8100/ws/call/webrtc/?token=<jwt>`  
> **TURN Credentials API:** `GET /api/v1/calls/turn-credentials/`

---

## Table of Contents

1. [How the Call Flow Works](#1-how-the-call-flow-works)
2. [Step 1 — Connect WebSocket](#2-step-1--connect-websocket)
3. [Step 2 — Fetch TURN Credentials](#3-step-2--fetch-turn-credentials)
4. [Step 3 — Get Microphone Stream](#4-step-3--get-microphone-stream)
5. [Step 4 — Make a Call (Caller)](#5-step-4--make-a-call-caller)
6. [Step 5 — Receive a Call (Receiver)](#6-step-5--receive-a-call-receiver)
7. [Step 6 — Handle ICE Candidates](#7-step-6--handle-ice-candidates)
8. [Step 7 — End the Call](#8-step-7--end-the-call)
9. [Complete WebSocket Event Reference](#9-complete-websocket-event-reference)
10. [Full Working Example](#10-full-working-example)
11. [Common Mistakes to Avoid](#11-common-mistakes-to-avoid)

---

## 1. How the Call Flow Works

```
CALLER                        SERVER                       RECEIVER
  │                             │                              │
  │── connect WebSocket ────────►│                              │
  │                             │◄──── connect WebSocket ──────│
  │                             │                              │
  │── send: offer (SDP) ───────►│── forward: incoming_call ───►│
  │                             │                              │
  │◄─── call_initiated ─────────│                              │
  │                             │                              │
  │                             │◄──── send: answer (SDP) ─────│
  │◄─── call_accepted ──────────│                              │
  │                             │                              │
  │◄══ ICE candidates ═════════►│══ ICE candidates ═══════════►│
  │                             │                              │
  │◄════════════ AUDIO FLOWING (peer-to-peer or via TURN) ════►│
```

---

## 2. Step 1 — Connect WebSocket

The WebSocket must be connected **before** any call action.

```js
const WS_URL = 'ws://YOUR_SERVER_IP:8100/ws/call/webrtc/';
let ws = null;

function connectWebSocket(jwtToken) {
  ws = new WebSocket(`${WS_URL}?token=${jwtToken}`);

  ws.onopen = () => {
    console.log('[WS] Connected to signaling server');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleSignalingMessage(message);
  };

  ws.onerror = (e) => {
    console.error('[WS] Error:', e);
  };

  ws.onclose = (e) => {
    console.warn('[WS] Disconnected. Code:', e.code);
    // Reconnect logic here if needed
  };
}
```

---

## 3. Step 2 — Fetch TURN Credentials

**Always fetch from the server — never hardcode TURN credentials.**

```js
async function fetchIceServers(jwtToken) {
  const res = await fetch('/api/v1/calls/turn-credentials/', {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  const data = await res.json();
  return data.iceServers;
}
```

**Example response:**
```json
{
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    {
      "urls": ["turn:YOUR_IP:3478", "turns:YOUR_IP:5349"],
      "username": "parentbridge",
      "credential": "StrongPassword123!"
    }
  ]
}
```

---

## 4. Step 3 — Get Microphone Stream

**Request microphone access before creating the peer connection.**

```js
let localStream = null;

async function getLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    console.log('[MIC] Microphone access granted');
    return localStream;
  } catch (err) {
    console.error('[MIC] Permission denied:', err.message);
    throw err;
  }
}
```

---

## 5. Step 4 — Make a Call (Caller Side)

```js
let peerConnection = null;
let currentCallId = null;
let receiverId = null;
let iceCandidateBuffer = [];
let isRemoteDescriptionSet = false;

async function startCall(targetUserId, jwtToken) {
  receiverId = targetUserId;

  // 1. Get microphone
  await getLocalStream();

  // 2. Fetch TURN credentials
  const iceServers = await fetchIceServers(jwtToken);

  // 3. Create peer connection
  peerConnection = new RTCPeerConnection({ iceServers });

  // 4. Add local tracks BEFORE createOffer
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // 5. Handle remote audio
  peerConnection.ontrack = (event) => {
    const remoteAudio = document.getElementById('remoteAudio');
    remoteAudio.srcObject = event.streams[0];
  };

  // 6. Send ICE candidates to signaling server
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({
        type: 'ice_candidate',
        candidate: event.candidate,
        receiver_id: receiverId,
      }));
    }
  };

  // 7. Log connection states (helpful for debugging)
  peerConnection.onconnectionstatechange = () => {
    console.log('[PC] connectionState:', peerConnection.connectionState);
  };
  peerConnection.oniceconnectionstatechange = () => {
    console.log('[ICE] iceConnectionState:', peerConnection.iceConnectionState);
  };

  // 8. Create and send offer
  const offer = await peerConnection.createOffer({ offerToReceiveAudio: true });
  await peerConnection.setLocalDescription(offer);

  ws.send(JSON.stringify({
    type: 'offer',
    sdp: peerConnection.localDescription.sdp,
    receiver_id: targetUserId,
  }));

  console.log('[CALL] Offer sent to', targetUserId);
}
```

---

## 6. Step 5 — Receive a Call (Receiver Side)

The server sends `incoming_call` when someone calls you. Handle it like this:

```js
async function handleIncomingCall(message, jwtToken) {
  currentCallId = message.call_id;
  receiverId = message.caller_id;

  // Show incoming call UI to user
  showIncomingCallUI(message.caller_name, message.caller_image);

  // Store offer SDP — use it when user accepts
  window._pendingOfferSdp = message.sdp;
}

async function acceptCall(jwtToken) {
  const offerSdp = window._pendingOfferSdp;

  // 1. Get microphone
  await getLocalStream();

  // 2. Fetch TURN credentials
  const iceServers = await fetchIceServers(jwtToken);

  // 3. Create peer connection
  peerConnection = new RTCPeerConnection({ iceServers });

  // 4. Add local tracks
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // 5. Handle remote audio
  peerConnection.ontrack = (event) => {
    const remoteAudio = document.getElementById('remoteAudio');
    remoteAudio.srcObject = event.streams[0];
  };

  // 6. Send ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({
        type: 'ice_candidate',
        candidate: event.candidate,
        receiver_id: receiverId,
      }));
    }
  };

  // 7. Set remote description (the caller's offer)
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription({ type: 'offer', sdp: offerSdp })
  );
  isRemoteDescriptionSet = true;

  // 8. Flush any ICE candidates that arrived early
  await flushIceCandidateBuffer();

  // 9. Create and send answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  ws.send(JSON.stringify({
    type: 'answer',
    sdp: peerConnection.localDescription.sdp,
    call_id: currentCallId,
  }));

  console.log('[CALL] Answer sent');
}
```

---

## 7. Step 6 — Handle ICE Candidates

> ⚠️ **Critical:** ICE candidates can arrive before `setRemoteDescription` is called.  
> Always buffer them and flush after remote description is set.

```js
// Buffer for early-arriving candidates
let iceCandidateBuffer = [];
let isRemoteDescriptionSet = false;

// Called when ice_candidate message arrives from signaling
function onRemoteIceCandidate(candidate) {
  if (isRemoteDescriptionSet && peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      .catch(e => console.warn('[ICE] addIceCandidate failed:', e));
  } else {
    console.log('[ICE] Buffering candidate (remote desc not set yet)');
    iceCandidateBuffer.push(candidate);
  }
}

// Flush all buffered candidates after setRemoteDescription
async function flushIceCandidateBuffer() {
  console.log(`[ICE] Flushing ${iceCandidateBuffer.length} buffered candidates`);
  for (const candidate of iceCandidateBuffer) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
  iceCandidateBuffer = [];
}

// Also flush on caller side after receiving answer
async function handleCallAccepted(message) {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription({ type: 'answer', sdp: message.sdp })
  );
  isRemoteDescriptionSet = true;
  await flushIceCandidateBuffer();
  console.log('[CALL] Answer applied, ICE flushed');
}
```

---

## 8. Step 7 — End the Call

```js
function endCall() {
  if (ws && currentCallId) {
    ws.send(JSON.stringify({
      type: 'call_end',
      call_id: currentCallId,
    }));
  }
  cleanup();
}

function cleanup() {
  // Stop microphone
  localStream?.getTracks().forEach(t => t.stop());
  localStream = null;

  // Close peer connection
  peerConnection?.close();
  peerConnection = null;

  // Reset state
  iceCandidateBuffer = [];
  isRemoteDescriptionSet = false;
  currentCallId = null;
  receiverId = null;

  // Clear audio elements
  document.getElementById('remoteAudio').srcObject = null;
}
```

---

## 9. Complete WebSocket Event Reference

### Events you SEND to the server

| `type` | When | Required fields |
|--------|------|----------------|
| `offer` | Starting a call | `sdp`, `receiver_id` |
| `answer` | Accepting a call | `sdp`, `call_id` |
| `ice_candidate` | ICE candidate gathered | `candidate`, `receiver_id` |
| `call_end` | Ending the call | `call_id` |
| `call_decline` | Declining incoming call | `call_id` |

### Events you RECEIVE from the server

| `type` | When | Key fields |
|--------|------|-----------|
| `call_initiated` | Your offer was sent | `call_id`, `status` |
| `incoming_call` | Someone is calling you | `call_id`, `caller_id`, `caller_name`, `sdp` |
| `call_accepted` | Receiver answered | `call_id`, `sdp` |
| `call_declined` | Receiver declined | `call_id` |
| `call_ended` | Other party ended call | `call_id` |
| `ice_candidate` | Remote ICE candidate | `candidate`, `sender_id` |
| `error` | Something went wrong | `message` |

### Complete message handler

```js
function handleSignalingMessage(message) {
  switch (message.type) {

    case 'call_initiated':
      currentCallId = message.call_id;
      console.log('[CALL] Initiated, call_id:', message.call_id);
      break;

    case 'incoming_call':
      handleIncomingCall(message, jwtToken);
      break;

    case 'call_accepted':
      handleCallAccepted(message);
      break;

    case 'ice_candidate':
      onRemoteIceCandidate(message.candidate);
      break;

    case 'call_declined':
      console.log('[CALL] Declined by receiver');
      cleanup();
      break;

    case 'call_ended':
      console.log('[CALL] Ended by other party');
      cleanup();
      break;

    case 'error':
      console.error('[SERVER ERROR]', message.message);
      break;
  }
}
```

---

## 10. Full Working Example

### HTML

```html
<audio id="localAudio" autoplay muted></audio>
<audio id="remoteAudio" autoplay></audio>

<button onclick="startCall('RECEIVER_USER_ID', jwtToken)">📞 Call</button>
<button onclick="acceptCall(jwtToken)">✅ Accept</button>
<button onclick="endCall()">🔴 End</button>
```

### Audio setup

```js
// Local audio (muted so you don't hear yourself)
document.getElementById('localAudio').srcObject = localStream;

// Remote audio auto-plays when ontrack fires
peerConnection.ontrack = (event) => {
  document.getElementById('remoteAudio').srcObject = event.streams[0];
};
```

---

## 11. Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|---------|----------|
| `addTrack` after `createOffer` | Always `addTrack` **before** `createOffer` |
| Hardcoded TURN credentials | Fetch from `/api/v1/calls/turn-credentials/` |
| No ICE candidate buffering | Buffer candidates, flush after `setRemoteDescription` |
| Only Google STUN | Use STUN + TURN (STUN alone fails on mobile/NAT) |
| Mutating SDP with regex | Use `addTransceiver` or don't modify SDP |
| `new RTCPeerConnection()` without config | Always pass `{ iceServers }` |

---

*Last updated: July 2026*
