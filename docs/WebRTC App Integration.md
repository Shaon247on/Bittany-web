# WebRTC — React Native (Expo) App Integration Guide

> **Stack:** React Native · Expo · `react-native-webrtc` · WebSocket (JWT Auth)  
> **Signaling Server:** `ws://<host>:8100/ws/call/webrtc/?token=<jwt>`  
> **TURN Credentials API:** `GET /api/v1/calls/turn-credentials/`

---

## Table of Contents

1. [Prerequisites & Important Warnings](#1-prerequisites--important-warnings)
2. [Installation](#2-installation)
3. [Android Permissions](#3-android-permissions)
4. [iOS Configuration](#4-ios-configuration)
5. [How the Call Flow Works](#5-how-the-call-flow-works)
6. [Step 1 — Request Runtime Permissions](#6-step-1--request-runtime-permissions)
7. [Step 2 — Connect WebSocket](#7-step-2--connect-websocket)
8. [Step 3 — Fetch TURN Credentials](#8-step-3--fetch-turn-credentials)
9. [Step 4 — Get Microphone Stream](#9-step-4--get-microphone-stream)
10. [Step 5 — Make a Call (Caller)](#10-step-5--make-a-call-caller)
11. [Step 6 — Receive a Call (Receiver)](#11-step-6--receive-a-call-receiver)
12. [Step 7 — ICE Candidate Buffering](#12-step-7--ice-candidate-buffering)
13. [Step 8 — End the Call](#13-step-8--end-the-call)
14. [Complete WebSocket Event Reference](#14-complete-websocket-event-reference)
15. [Full Hook Example (useWebRTC)](#15-full-hook-example-usewebrtc)
16. [Common Mistakes to Avoid](#16-common-mistakes-to-avoid)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Prerequisites & Important Warnings

> ⚠️ **`react-native-webrtc` does NOT work in Expo Go.**  
> You MUST use a custom development build.

| Requirement | Detail |
|-------------|--------|
| Expo Go | ❌ Will NOT work |
| Custom Dev Build (`eas build`) | ✅ Required |
| `react-native-webrtc` version | `^118.0.0` or latest |
| Minimum Android API | 21 (Android 5.0) |
| Minimum iOS | 13.0 |

---

## 2. Installation

### Install the package

```bash
npx expo install react-native-webrtc
```

### Add the Expo plugin to `app.json`

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-webrtc",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera.",
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone."
        }
      ]
    ]
  }
}
```

### (Recommended) Install InCallManager for audio routing

```bash
npx expo install react-native-incall-manager
```

> Without InCallManager, audio may come from the earpiece instead of the speaker on iOS, or audio routing may behave incorrectly.

### Build the custom dev client

```bash
# Install EAS CLI
npm install -g eas-cli && eas login

# Add development profile to eas.json
```

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

```bash
# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

> **You must rebuild** after adding any native plugin or changing `app.json` plugins.

---

## 3. Android Permissions

### `AndroidManifest.xml`

If using **Expo managed workflow**, the plugin from Step 2 adds these automatically after `eas build`.

If using **bare workflow**, add manually to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.CAMERA" />
```

### ProGuard rules (release builds)

Add to `android/app/proguard-rules.pro`:

```pro
-keep class org.webrtc.** { *; }
-keep class com.oney.WebRTCModule.** { *; }
-dontwarn org.webrtc.**
```

> Without these rules, release APK will strip WebRTC native code and calls will silently fail.

---

## 4. iOS Configuration

### `Info.plist`

If using Expo managed workflow + plugin, these are added automatically. For bare workflow, add to `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for voice calls.</string>
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for video calls.</string>
```

---

## 5. How the Call Flow Works

```
CALLER (App)                  SERVER                   RECEIVER (App)
  │                             │                              │
  │── connect WebSocket ────────►│                              │
  │                             │◄──── connect WebSocket ──────│
  │── request permissions ──────┤                              │
  │── getUserMedia ─────────────┤                              │
  │── createOffer ──────────────┤                              │
  │── send: offer ─────────────►│── forward: incoming_call ───►│
  │◄─── call_initiated ─────────│      (receiver sees UI)      │
  │                             │◄──── send: answer ───────────│
  │◄─── call_accepted ──────────│                              │
  │── setRemoteDesc (answer) ───┤                              │
  │                             │                              │
  │◄══ ICE candidates ═════════►│══ ICE candidates ═══════════►│
  │                             │                              │
  │◄══════════════ AUDIO FLOWING (P2P or via TURN relay) ═════►│
```

---

## 6. Step 1 — Request Runtime Permissions

**Call this before any microphone access on Android.**

```ts
import { PermissionsAndroid, Platform, Alert } from 'react-native';

async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions via Info.plist prompt
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone Permission',
      message: 'ParentBridge needs microphone access for voice calls.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }
  );

  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    Alert.alert(
      'Permission Required',
      'Microphone access is required to make calls.',
    );
    return false;
  }

  return true;
}
```

---

## 7. Step 2 — Connect WebSocket

```ts
const WS_URL = 'ws://YOUR_SERVER_IP:8100/ws/call/webrtc/';
let ws: WebSocket | null = null;

function connectWebSocket(jwtToken: string) {
  ws = new WebSocket(`${WS_URL}?token=${jwtToken}`);

  ws.onopen = () => {
    console.log('[WS] Connected to signaling server');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleSignalingMessage(message);
  };

  ws.onerror = (e) => {
    console.error('[WS] Error:', e.message);
  };

  ws.onclose = (e) => {
    console.warn('[WS] Closed. Code:', e.code);
  };
}
```

---

## 8. Step 3 — Fetch TURN Credentials

```ts
const API_BASE = 'http://YOUR_SERVER_IP:8100';

async function fetchIceServers(jwtToken: string) {
  const res = await fetch(`${API_BASE}/api/v1/calls/turn-credentials/`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  const data = await res.json();
  return data.iceServers;
}
```

---

## 9. Step 4 — Get Microphone Stream

> ⚠️ **Always import from `react-native-webrtc`** — never use `navigator.mediaDevices`.

```ts
import { mediaDevices, MediaStream } from 'react-native-webrtc';

let localStream: MediaStream | null = null;

async function getLocalStream(): Promise<MediaStream> {
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    throw new Error('Microphone permission denied');
  }

  localStream = await mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  console.log('[MIC] Stream ready, tracks:', localStream.getTracks().length);
  return localStream;
}
```

---

## 10. Step 5 — Make a Call (Caller Side)

```ts
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

let peerConnection: RTCPeerConnection | null = null;
let currentCallId: string | null = null;
let receiverId: string | null = null;
let iceCandidateBuffer: any[] = [];
let isRemoteDescriptionSet = false;

async function startCall(targetUserId: string, jwtToken: string) {
  receiverId = targetUserId;

  // 1. Get microphone stream
  await getLocalStream();

  // 2. Fetch TURN credentials from backend
  const iceServers = await fetchIceServers(jwtToken);

  // 3. Create RTCPeerConnection with TURN config
  peerConnection = new RTCPeerConnection({ iceServers });

  // 4. Add local audio tracks BEFORE createOffer
  localStream!.getTracks().forEach(track => {
    peerConnection!.addTrack(track, localStream!);
  });

  // 5. Handle incoming remote audio
  peerConnection.ontrack = (event: any) => {
    const remoteStream = event.streams[0];
    // Pass remoteStream to your audio component
    // setRemoteStream(remoteStream);
    console.log('[TRACK] Remote audio track received');
  };

  // 6. Send local ICE candidates to signaling server
  peerConnection.onicecandidate = (event: any) => {
    if (event.candidate) {
      ws!.send(JSON.stringify({
        type: 'ice_candidate',
        candidate: event.candidate,
        receiver_id: targetUserId,
      }));
    }
  };

  // 7. Log connection states for debugging
  peerConnection.onconnectionstatechange = () => {
    console.log('[PC] connectionState:', peerConnection?.connectionState);
  };
  peerConnection.oniceconnectionstatechange = () => {
    console.log('[ICE] iceConnectionState:', peerConnection?.iceConnectionState);
  };

  // 8. Start audio session
  InCallManager.start({ media: 'audio' });

  // 9. Create and send offer
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: false,
  } as any);
  await peerConnection.setLocalDescription(offer);

  ws!.send(JSON.stringify({
    type: 'offer',
    sdp: (peerConnection.localDescription as any).sdp,
    receiver_id: targetUserId,
  }));

  console.log('[CALL] Offer sent to', targetUserId);
}
```

---

## 11. Step 6 — Receive a Call (Receiver Side)

```ts
// Store pending offer when incoming_call arrives
let pendingOfferSdp: string | null = null;

function handleIncomingCall(message: any) {
  currentCallId = message.call_id;
  receiverId = message.caller_id;
  pendingOfferSdp = message.sdp;

  // Show incoming call UI
  // navigation.navigate('IncomingCall', { callerId: message.caller_id, ... });
  console.log('[CALL] Incoming call from', message.caller_name);
}

async function acceptCall(jwtToken: string) {
  if (!pendingOfferSdp) {
    console.error('[CALL] No pending offer SDP');
    return;
  }

  // 1. Get microphone stream
  await getLocalStream();

  // 2. Fetch TURN credentials
  const iceServers = await fetchIceServers(jwtToken);

  // 3. Create peer connection
  peerConnection = new RTCPeerConnection({ iceServers });

  // 4. Add local audio tracks
  localStream!.getTracks().forEach(track => {
    peerConnection!.addTrack(track, localStream!);
  });

  // 5. Handle remote audio
  peerConnection.ontrack = (event: any) => {
    const remoteStream = event.streams[0];
    // setRemoteStream(remoteStream);
    console.log('[TRACK] Remote audio track received');
  };

  // 6. Send ICE candidates
  peerConnection.onicecandidate = (event: any) => {
    if (event.candidate) {
      ws!.send(JSON.stringify({
        type: 'ice_candidate',
        candidate: event.candidate,
        receiver_id: receiverId,
      }));
    }
  };

  // 7. Start audio session
  InCallManager.start({ media: 'audio' });

  // 8. Set remote description (caller's offer)
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription({ type: 'offer', sdp: pendingOfferSdp })
  );
  isRemoteDescriptionSet = true;

  // 9. Flush buffered ICE candidates
  await flushIceCandidateBuffer();

  // 10. Create answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // 11. Send answer to signaling server
  ws!.send(JSON.stringify({
    type: 'answer',
    sdp: (peerConnection.localDescription as any).sdp,
    call_id: currentCallId,
  }));

  console.log('[CALL] Answer sent');
}
```

---

## 12. Step 7 — ICE Candidate Buffering

> ⚠️ **This is the #1 cause of mobile call failure.**  
> Mobile devices are slower to initialize than browsers. ICE candidates arrive before `setRemoteDescription` is called and get dropped without buffering.

```ts
let iceCandidateBuffer: any[] = [];
let isRemoteDescriptionSet = false;

// Called when ice_candidate message arrives from signaling
function onRemoteIceCandidate(candidate: any) {
  if (isRemoteDescriptionSet && peerConnection) {
    peerConnection
      .addIceCandidate(new RTCIceCandidate(candidate))
      .catch((e: any) => console.warn('[ICE] addIceCandidate failed:', e));
  } else {
    console.log('[ICE] Buffering candidate (remote desc not ready)');
    iceCandidateBuffer.push(candidate);
  }
}

// Flush after setRemoteDescription
async function flushIceCandidateBuffer() {
  console.log(`[ICE] Flushing ${iceCandidateBuffer.length} buffered candidates`);
  for (const candidate of iceCandidateBuffer) {
    await peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
  }
  iceCandidateBuffer = [];
}

// Caller: flush after receiving the answer
async function handleCallAccepted(message: any) {
  currentCallId = message.call_id;

  await peerConnection?.setRemoteDescription(
    new RTCSessionDescription({ type: 'answer', sdp: message.sdp })
  );
  isRemoteDescriptionSet = true;

  await flushIceCandidateBuffer();
  console.log('[CALL] Connected — audio should be flowing');
}
```

---

## 13. Step 8 — End the Call

```ts
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

  // Stop audio session
  InCallManager.stop();

  // Reset all state
  iceCandidateBuffer = [];
  isRemoteDescriptionSet = false;
  currentCallId = null;
  receiverId = null;
  pendingOfferSdp = null;
}
```

---

## 14. Complete WebSocket Event Reference

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
| `incoming_call` | Someone is calling you | `call_id`, `caller_id`, `caller_name`, `caller_image`, `sdp` |
| `call_accepted` | Receiver answered | `call_id`, `sdp` |
| `call_declined` | Receiver declined | `call_id` |
| `call_ended` | Other party ended call | `call_id` |
| `ice_candidate` | Remote ICE candidate | `candidate`, `sender_id` |
| `error` | Server error | `message` |

### Complete signaling message handler

```ts
function handleSignalingMessage(message: any) {
  switch (message.type) {

    case 'call_initiated':
      currentCallId = message.call_id;
      console.log('[CALL] Initiated, call_id:', message.call_id);
      break;

    case 'incoming_call':
      handleIncomingCall(message);
      break;

    case 'call_accepted':
      handleCallAccepted(message);
      break;

    case 'ice_candidate':
      onRemoteIceCandidate(message.candidate);
      break;

    case 'call_declined':
      console.log('[CALL] Declined');
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

## 15. Full Hook Example (useWebRTC)

```ts
// hooks/useWebRTC.ts
import { useRef, useState, useCallback } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { PermissionsAndroid, Platform } from 'react-native';

const API_BASE = 'http://YOUR_SERVER_IP:8100';
const WS_URL   = 'ws://YOUR_SERVER_IP:8100/ws/call/webrtc/';

export function useWebRTC(jwtToken: string) {
  const ws              = useRef<WebSocket | null>(null);
  const pc              = useRef<RTCPeerConnection | null>(null);
  const localStreamRef  = useRef<MediaStream | null>(null);
  const buffer          = useRef<any[]>([]);
  const remoteDescSet   = useRef(false);
  const callIdRef       = useRef<string | null>(null);
  const receiverIdRef   = useRef<string | null>(null);
  const pendingOffer    = useRef<string | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus]     = useState<string>('idle');

  const fetchIceServers = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/v1/calls/turn-credentials/`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    return (await res.json()).iceServers;
  }, [jwtToken]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const r = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return r === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const flushBuffer = useCallback(async () => {
    for (const c of buffer.current) {
      await pc.current?.addIceCandidate(new RTCIceCandidate(c));
    }
    buffer.current = [];
  }, []);

  const createPC = useCallback(async (iceServers: any[]) => {
    pc.current = new RTCPeerConnection({ iceServers });

    localStreamRef.current?.getTracks().forEach(track => {
      pc.current!.addTrack(track, localStreamRef.current!);
    });

    pc.current.ontrack = (e: any) => setRemoteStream(e.streams[0]);

    pc.current.onicecandidate = (e: any) => {
      if (e.candidate && ws.current) {
        ws.current.send(JSON.stringify({
          type: 'ice_candidate',
          candidate: e.candidate,
          receiver_id: receiverIdRef.current,
        }));
      }
    };

    pc.current.onconnectionstatechange = () =>
      console.log('[PC]', pc.current?.connectionState);
    pc.current.oniceconnectionstatechange = () =>
      console.log('[ICE]', pc.current?.iceConnectionState);
  }, []);

  const connect = useCallback(() => {
    ws.current = new WebSocket(`${WS_URL}?token=${jwtToken}`);
    ws.current.onopen    = () => console.log('[WS] Connected');
    ws.current.onmessage = (e) => handleMessage(JSON.parse(e.data));
    ws.current.onerror   = (e) => console.error('[WS] Error', e);
    ws.current.onclose   = (e) => console.warn('[WS] Closed', e.code);
  }, [jwtToken]);

  const startCall = useCallback(async (targetUserId: string) => {
    receiverIdRef.current = targetUserId;
    const ok = await requestPermission();
    if (!ok) return;

    localStreamRef.current = await mediaDevices.getUserMedia({
      audio: true, video: false,
    });
    const iceServers = await fetchIceServers();
    await createPC(iceServers);
    InCallManager.start({ media: 'audio' });

    const offer = await pc.current!.createOffer({
      offerToReceiveAudio: true, offerToReceiveVideo: false,
    } as any);
    await pc.current!.setLocalDescription(offer);

    ws.current!.send(JSON.stringify({
      type: 'offer',
      sdp: (pc.current!.localDescription as any).sdp,
      receiver_id: targetUserId,
    }));
    setCallStatus('calling');
  }, [createPC, fetchIceServers, requestPermission]);

  const acceptCall = useCallback(async () => {
    if (!pendingOffer.current) return;
    const ok = await requestPermission();
    if (!ok) return;

    localStreamRef.current = await mediaDevices.getUserMedia({
      audio: true, video: false,
    });
    const iceServers = await fetchIceServers();
    await createPC(iceServers);
    InCallManager.start({ media: 'audio' });

    await pc.current!.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: pendingOffer.current })
    );
    remoteDescSet.current = true;
    await flushBuffer();

    const answer = await pc.current!.createAnswer();
    await pc.current!.setLocalDescription(answer);

    ws.current!.send(JSON.stringify({
      type: 'answer',
      sdp: (pc.current!.localDescription as any).sdp,
      call_id: callIdRef.current,
    }));
    setCallStatus('active');
  }, [createPC, fetchIceServers, flushBuffer, requestPermission]);

  const endCall = useCallback(() => {
    if (callIdRef.current) {
      ws.current?.send(JSON.stringify({
        type: 'call_end',
        call_id: callIdRef.current,
      }));
    }
    cleanup();
  }, []);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pc.current?.close();
    pc.current = null;
    InCallManager.stop();
    buffer.current = [];
    remoteDescSet.current = false;
    callIdRef.current = null;
    receiverIdRef.current = null;
    pendingOffer.current = null;
    setRemoteStream(null);
    setCallStatus('idle');
  }, []);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'call_initiated':
        callIdRef.current = message.call_id;
        break;
      case 'incoming_call':
        callIdRef.current   = message.call_id;
        receiverIdRef.current = message.caller_id;
        pendingOffer.current = message.sdp;
        setCallStatus('incoming');
        break;
      case 'call_accepted':
        callIdRef.current = message.call_id;
        pc.current?.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: message.sdp })
        ).then(() => {
          remoteDescSet.current = true;
          flushBuffer();
          setCallStatus('active');
        });
        break;
      case 'ice_candidate':
        if (remoteDescSet.current && pc.current) {
          pc.current.addIceCandidate(new RTCIceCandidate(message.candidate));
        } else {
          buffer.current.push(message.candidate);
        }
        break;
      case 'call_declined':
      case 'call_ended':
        cleanup();
        break;
    }
  }, [cleanup, flushBuffer]);

  return {
    connect,
    startCall,
    acceptCall,
    endCall,
    remoteStream,
    callStatus,
  };
}
```

---

## 16. Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|---------|----------|
| Using `navigator.mediaDevices` | Use `mediaDevices` from `react-native-webrtc` |
| Running in Expo Go | Use custom dev build via `eas build` |
| No Android runtime permission | Call `PermissionsAndroid.request` before `getUserMedia` |
| `addTrack` after `createOffer` | Always `addTrack` **before** `createOffer` |
| No ICE candidate buffering | Buffer candidates, flush after `setRemoteDescription` |
| Only STUN, no TURN | Fetch TURN credentials from `/api/v1/calls/turn-credentials/` |
| Hardcoded TURN credentials | Always fetch from backend API |
| No `InCallManager.stop()` on cleanup | Always stop InCallManager when call ends |
| Mutating SDP with regex | Do not modify SDP strings |
| Storing `peerConnection` in React state | Use `useRef` to avoid stale closure issues |

---

## 17. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| WebSocket closes with code `4001` | Invalid or expired JWT token | Re-login and get fresh token |
| `getUserMedia` throws error | Permission not granted | Check Step 1 permission flow |
| ICE state stuck at `checking` | No TURN server / firewall | Verify TURN setup with trickle-ice tool |
| ICE state `failed` | CGNAT + no TURN | Confirm `relay` candidate appears in trickle-ice |
| Audio plays in earpiece (iOS) | InCallManager not configured | Ensure `InCallManager.start({ media: 'audio' })` is called |
| Crash on release APK | ProGuard stripping WebRTC | Add ProGuard rules (Step 3) |
| Call works in dev, fails in Expo Go | Expo Go limitation | Must use custom dev build |
| `connectionState: failed` | Remote description not set before ICE | Ensure ICE candidate buffering is in place |
| No audio after connection | Tracks added after offer | Always `addTrack` before `createOffer` |

---

*Last updated: July 2026*
