# ParentBridge Web — ZEGOCLOUD Voice Calling

Integration guide for the Next.js site: replace the hand-rolled WebRTC calling
with the **ZEGOCLOUD Call Kit for Web**, so the website and the mobile app can
call each other.

Scope: **voice calls only**, one-to-one, between co-parents — matching the app.

Verified against `@zegocloud/zego-uikit-prebuilt@2.18.1` and `zego-zim-web@3.1.0`
(API signatures below are taken from the package's own `index.d.ts` and bundle,
not from memory).

---
wwd
## 0. What you are building

| Piece | Owner |
| --- | --- |
| Ringing, accept/decline, in-call UI | ZEGOCLOUD Call Kit (prebuilt) |
| Media, signalling, ICE, reconnection | Zego Express + ZIM (internal) |
| Who am I / who do I call | Your backend user IDs |
| Call history rows | Your existing `/logs/` endpoints |

Your app's job is only: **get a token, create the client, send an invitation,
record history.** Exactly the split described in
[zego-call-integration.md](./zego-call-integration.md) for the mobile app.

> **The web SDK is a completely different package from the app's.** The app uses
> `@zegocloud/zego-uikit-prebuilt-call-rn`; that package does not run in a
> browser. The web package is `@zegocloud/zego-uikit-prebuilt`. Do not try to
> share call code between the two repos — share the *backend contract* instead.

---

## 1. Blocking prerequisite: the project must be in Token mode

**Read this before writing any code.** The mobile app currently authenticates
with an **App Sign** (`ZEGO_APP_SIGN` is hardcoded in
[lib/zego/zegoConfig.ts](../lib/zego/zegoConfig.ts)).

A browser cannot use App Sign. The web Call Kit only accepts a *kit token*, and
the only production-safe way to produce one is from a server-generated
**token04**. So:

1. In the ZEGOCLOUD console, set the project's authentication mode to **Token**.
2. Ship the backend token endpoint (§2) — the app already knows how to call it.
3. In the **mobile repo**, set `ZEGO_APP_SIGN = ""` in
   [lib/zego/zegoConfig.ts](../lib/zego/zegoConfig.ts). That one line flips the
   app into token mode; the plumbing is already written.

Both platforms must be on the same App ID and the same auth mode, or they cannot
see each other. Doing this also removes a real security problem: the App Sign is
a credential and it currently ships inside the APK.

Also confirm in the console that **In-app Chat (ZIM)** is enabled — call
invitations ride on it.

---

## 2. Backend contract (shared with the app — do not fork it)

### 2.1 `GET /api/v1/call/zego/token/`

Authenticated with `Authorization: Bearer <access_token>`. This is the *same*
endpoint the mobile app uses; if it already exists, the web needs no new backend
work.

```json
{
  "app_id": 1234567890,
  "user_id": "42",
  "user_name": "Sarah Johnson",
  "token": "04AAAAAG...",
  "expires_in": 86400
}
```

`user_id` **must be `str(request.user.id)`** — the same value the caller passes
as the invitee ID. This is what makes a call placed from the website ring on the
co-parent's phone. If web and mobile disagree on the identity scheme, every
invitation silently goes to a user that never rings.

Implementation sketch is in
[zego-call-integration.md §3.1](./zego-call-integration.md).

### 2.2 Call history (already exists)

- `POST /logs/create/` → `{ receiver_user, call_type: "outgoing", call_method: "webrtc", status: "pending" }`
- `PATCH /logs/{id}/update/` → `{ status, duration }`
- `POST /logs/{id}/end/`
- `GET /webrtc/history/`

Keep all of these. Only the **caller** writes a row, once per call — same rule as
the app, so the two clients cannot double-count.

### 2.3 What the backend can now delete

Once both clients are on ZEGOCLOUD, the custom signalling is dead code:

- the `/ws/call/webrtc/` WebSocket consumer
- any SDP/ICE relay endpoints and TURN credential minting
- `POST /webrtc/initiate/` (the client writes the log row now)

Do this **last**, after both clients are shipped and verified.

---

## 3. Removing the old custom WebRTC calling

Do this **before** wiring the new stack. Two calling systems live at once means
two incoming-call UIs, two media streams competing for the microphone, and
impossible-to-read bugs.

### 3.1 Find it

```bash
# Media / peer connection
grep -rn "RTCPeerConnection\|getUserMedia\|createOffer\|createAnswer\|onicecandidate\|addIceCandidate\|RTCSessionDescription" src/ app/ components/ lib/ hooks/

# Signalling
grep -rn "ws/call/webrtc\|iceServers\|turn:\|stun:\|signal" src/ app/ components/ lib/ hooks/

# UI + entry points
grep -rn -i "incoming-?call\|CallModal\|useWebRTC\|useCall\b\|ringtone" src/ app/ components/ lib/ hooks/
```

Anything matching the first two groups is going away wholesale. The third group
needs reading — some of it is call-history UI you are keeping.

### 3.2 Removal order

1. **Unmount first, delete second.** Remove the old call provider/modal from the
   root layout and confirm the site still builds and no screen imports it. A
   dangling import in a rarely-visited route is the usual way this bites.
2. Delete the peer-connection and signalling modules (`useWebRTC`,
   `webrtcSocket`, `webrtcConfig`, ICE config, TURN fetcher).
3. Delete the custom incoming-call modal, ringing screen, and ringtone assets.
4. Remove the now-unused deps from `package.json` (`simple-peer`, `peerjs`,
   `socket.io-client` **only if** nothing else uses it — chat/presence often
   does; check before removing).
5. **Keep**: call-history pages, the `/logs/` API client, and the presence /
   online-status code. None of that is WebRTC.

### 3.3 Verify it is gone

```bash
grep -rn "RTCPeerConnection\|ws/call/webrtc" src/ app/ components/ lib/ hooks/   # → no results
npm run build                                                                     # → clean
```

---

## 4. Install

```bash
npm i @zegocloud/zego-uikit-prebuilt zego-zim-web
```

Environment — the App ID is public and safe to expose:

```bash
# .env.local
NEXT_PUBLIC_ZEGO_APP_ID=1234567890
NEXT_PUBLIC_API_BASE_URL=https://api.parentbridge.example
```

> **The ServerSecret must never appear in a `NEXT_PUBLIC_` variable, or anywhere
> in the browser bundle.** `generateKitTokenForTest` needs it, which is exactly
> why that function is for local experiments only and never ships. Production
> uses `generateKitTokenForProduction` with a token from §2.1.

---

## 5. Next.js wiring

### 5.1 Why this needs care

The SDK touches `window` and `document` at import time. In Next.js that means:

- every file that imports it must be a **client component** (`"use client"`)
- the import must be **dynamic**, inside an effect or `next/dynamic({ssr:false})`
  — a static top-level import crashes the server render with
  `ReferenceError: window is not defined`, and in the App Router that breaks the
  whole route, not just the component
- the client is a **singleton**: create it once per signed-in session, not per
  screen. Two live instances for the same user fight over the ZIM login.

### 5.2 `lib/zego/config.ts`

```ts
export const ZEGO_APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID ?? 0);

/** Ring timeout for an outgoing invitation, in seconds (SDK allows 1–600). */
export const ZEGO_CALL_TIMEOUT_SECONDS = 60;

export const isZegoConfigured = ZEGO_APP_ID > 0;
```

### 5.3 `lib/zego/token.ts`

```ts
import { api } from "@/lib/api"; // your existing authed fetch/axios instance

export type ZegoCredentials = {
  userID: string;
  userName: string;
  token: string;
  expiresAt: number;
};

let cached: ZegoCredentials | null = null;

/** Renews five minutes early so a long call never dies on an expired token. */
export async function getZegoCredentials(force = false): Promise<ZegoCredentials> {
  if (!force && cached && cached.expiresAt > Date.now() + 5 * 60_000) return cached;

  const { data } = await api.get("/api/v1/call/zego/token/");
  const payload = data?.data ?? data;

  cached = {
    userID: String(payload.user_id),
    userName: payload.user_name || `User ${payload.user_id}`,
    token: payload.token,
    expiresAt: Date.now() + (payload.expires_in ?? 86400) * 1000,
  };
  return cached;
}

export function clearZegoCredentials() {
  cached = null;
}
```

### 5.4 `lib/zego/callClient.ts` — the singleton

```ts
"use client";

import { ZEGO_APP_ID, isZegoConfigured } from "./config";
import { clearZegoCredentials, getZegoCredentials } from "./token";
import { finishCallLog } from "./callLog";

// Loosely typed on purpose: the package's bundled .d.ts lags the runtime in a
// couple of places (see §9), so we do not let it dictate our call sites.
type CallClient = any;

let client: CallClient | null = null;
let clientUserID: string | null = null;
let creating: Promise<CallClient> | null = null;

/** The element the in-call UI is mounted into. Owned by CallProvider. */
let container: HTMLElement | null = null;
let setCallActive: (active: boolean) => void = () => {};

export function registerCallSurface(
  el: HTMLElement | null,
  onActiveChange: (active: boolean) => void,
) {
  container = el;
  setCallActive = onActiveChange;
}

export function getCallClient(): CallClient | null {
  return client;
}

export async function initCallClient(): Promise<CallClient> {
  if (!isZegoConfigured) throw new Error("NEXT_PUBLIC_ZEGO_APP_ID is not set.");
  if (client) return client;
  if (creating) return creating;

  creating = (async () => {
    // Dynamic: these modules assume a browser and must never run during SSR.
    const [{ ZegoUIKitPrebuilt }, { ZIM }] = await Promise.all([
      import("@zegocloud/zego-uikit-prebuilt"),
      import("zego-zim-web"),
    ]);

    const me = await getZegoCredentials();

    // roomID is empty: with call invitation the room is created by the
    // invitation itself, so there is nothing to name up front.
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
      ZEGO_APP_ID,
      me.token,
      "",
      me.userID,
      me.userName,
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.addPlugins({ ZIM });

    zp.setCallInvitationConfig({
      ringtoneConfig: {
        incomingCallUrl: "/sounds/zego_incoming.mp3",
        outgoingCallUrl: "/sounds/zego_outgoing.mp3",
      },

      // Fires on BOTH sides immediately before joining — the one reliable moment
      // to reveal the call surface, because it happens whether this user placed
      // the call or accepted one.
      onSetRoomConfigBeforeJoining: () => {
        setCallActive(true);
        return VOICE_ROOM_CONFIG();
      },

      // Declined / timed out / cancelled / busy / the other side left.
      onCallInvitationEnded: (reason: string) => {
        setCallActive(false);
        if (reason === "Declined" || reason === "Busy") finishCallLog("failed");
        else if (reason === "Timeout") finishCallLog("missed");
      },

      onIncomingCallTimeout: () => setCallActive(false),
      onOutgoingCallTimeout: () => setCallActive(false),

      // Long calls: the token is short-lived, the call is not.
      onTokenWillExpire: async () => {
        const fresh = await getZegoCredentials(true);
        zp.renewToken(fresh.token);
      },
    });

    client = zp;
    clientUserID = me.userID;
    return zp;
  })();

  try {
    return await creating;
  } finally {
    creating = null;
  }
}

export function destroyCallClient() {
  setCallActive(false);
  try {
    client?.destroy();
  } catch (error) {
    console.warn("[Zego] destroy failed:", error);
  }
  client = null;
  clientUserID = null;
  clearZegoCredentials();
}

/**
 * Voice-only room config. Mirrors ONE_ON_ONE_VOICE_CALL_CONFIG in the app.
 *
 * `showPreJoinView: false` matters — the default web flow shows a device-check
 * screen before joining, which is right for a meeting product and wrong for a
 * phone call: the other person is already waiting.
 */
function VOICE_ROOM_CONFIG() {
  return {
    container,
    scenario: { mode: "OneONoneCall" },

    turnOnMicrophoneWhenJoining: true,
    turnOnCameraWhenJoining: false,

    showPreJoinView: false,
    showLeavingView: false,
    showLeaveRoomConfirmDialog: false,

    showMyCameraToggleButton: false,
    showAudioVideoSettingsButton: true,
    showMyMicrophoneToggleButton: true,
    showScreenSharingButton: false,
    showTextChat: false,
    showUserList: false,
    showRoomTimer: true,
    showNonVideoUser: true,
    showOnlyAudioUser: true,

    onLeaveRoom: () => setCallActive(false),
  };
}
```

### 5.5 `lib/zego/callLog.ts`

A direct port of the app's [zegoCallLog.ts](../lib/zego/zegoCallLog.ts) — same
rule, same endpoints, so history looks identical whichever client placed the call.

```ts
import { api } from "@/lib/api";

let activeCallLogId: number | null = null;

export async function createCallLog(receiverUserId: number | string) {
  try {
    const { data } = await api.post("/logs/create/", {
      receiver_user: Number(receiverUserId),
      call_type: "outgoing",
      call_method: "webrtc",
      status: "pending",
    });
    activeCallLogId = (data?.data ?? data)?.id ?? null;
  } catch (error) {
    console.warn("[Zego] Failed to create call log:", error);
    activeCallLogId = null;
  }
}

export async function finishCallLog(
  status: "completed" | "missed" | "failed",
  durationSeconds = 0,
) {
  const id = activeCallLogId;
  activeCallLogId = null;
  if (id === null) return; // callee side — the caller owns the row

  try {
    await api.patch(`/logs/${id}/update/`, {
      status,
      ...(durationSeconds > 0 ? { duration: Math.round(durationSeconds) } : {}),
    });
    if (status === "completed") await api.post(`/logs/${id}/end/`, {});
  } catch (error) {
    console.warn("[Zego] Failed to finalize call log:", error);
  }
}
```

### 5.6 `components/call/CallProvider.tsx`

Mount once, in the authenticated layout. It owns the surface the in-call UI is
drawn into and ties the client's life to the session.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import { isZegoConfigured } from "@/lib/zego/config";
import {
  destroyCallClient,
  initCallClient,
  registerCallSurface,
} from "@/lib/zego/callClient";
import { useSession } from "@/hooks/useSession"; // your auth hook

export default function CallProvider() {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const { accessToken } = useSession();

  useEffect(() => {
    if (!isZegoConfigured || !accessToken) return;

    registerCallSurface(surfaceRef.current, setIsCallActive);
    initCallClient().catch((error) => {
      console.error("[Zego] Call service init failed:", error);
    });

    return () => {
      destroyCallClient();
      registerCallSurface(null, () => {});
    };
  }, [accessToken]);

  // Always mounted, never unmounted mid-call: the SDK holds a direct reference
  // to this node, so React must not pull it out from under it. Visibility is
  // toggled instead.
  return (
    <div
      ref={surfaceRef}
      aria-hidden={!isCallActive}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: isCallActive ? "block" : "none",
      }}
    />
  );
}
```

Then, in `app/(authenticated)/layout.tsx`:

```tsx
import CallProvider from "@/components/call/CallProvider";

export default function AuthenticatedLayout({ children }) {
  return (
    <>
      {children}
      <CallProvider />
    </>
  );
}
```

### 5.7 `components/call/CallButton.tsx`

```tsx
"use client";

import { useState } from "react";

import { ZEGO_CALL_TIMEOUT_SECONDS } from "@/lib/zego/config";
import { getCallClient } from "@/lib/zego/callClient";
import { createCallLog } from "@/lib/zego/callLog";

type Props = { partnerId: number | string | null; partnerName: string };

export default function CallButton({ partnerId, partnerName }: Props) {
  const [isSending, setIsSending] = useState(false);

  const placeCall = async () => {
    const zp = getCallClient();

    if (!zp) {
      alert("Connecting to the call service — try again in a second.");
      return;
    }
    if (!partnerId) {
      alert("Connect with your co-parent before making a call.");
      return;
    }

    setIsSending(true);
    try {
      const { errorInvitees } = await zp.sendCallInvitation({
        // String(): must match `str(request.user.id)` from the token endpoint.
        callees: [{ userID: String(partnerId), userName: partnerName }],
        callType: 0, // ZegoInvitationType.VoiceCall
        timeout: ZEGO_CALL_TIMEOUT_SECONDS,
      });

      if (errorInvitees?.length) {
        // The everyday case: their app/tab is closed, so there is nothing to
        // ring. Not an error worth a red banner.
        alert(`${partnerName} is unavailable right now. Try a message instead.`);
        return;
      }

      await createCallLog(partnerId);
    } catch (error) {
      console.warn("[Zego] Invitation failed:", error);
      alert("Call could not be placed. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button onClick={placeCall} disabled={isSending}>
      {isSending ? "Calling…" : "Call Now"}
    </button>
  );
}
```

> `callType: 0` is `ZegoInvitationType.VoiceCall`. Prefer
> `ZegoUIKitPrebuilt.InvitationTypeVoiceCall` where you already have the module
> in scope; the literal is here only because this component does not import the
> SDK.

### 5.8 Ringtones

Copy the app's files to the web `public/` folder so both platforms sound alike:

```
public/sounds/zego_incoming.mp3   ← assets/sounds/zego_incoming.mp3
public/sounds/zego_outgoing.mp3   ← assets/sounds/zego_outgoing.mp3
```

---

## 6. Cross-platform: app ↔ web

**This works, and I verified the wire format rather than assuming it.** The web
bundle serialises invitations with `inviter: {id, name}` and
`invitees: [{user_id, user_name}]` — byte-for-byte the shape the React Native
Call Kit reads. The two Call Kits share one invitation protocol over ZIM.

Three things must line up, and all three are things you control:

| Requirement | Why |
| --- | --- |
| Same **App ID** on web and mobile | Different apps cannot see each other |
| Same **auth mode** (Token — §1) | Browser cannot use App Sign |
| `userID === str(user.id)` on both | The invitee ID is how Zego finds the device |

Reachability differs by platform, and that is expected:

- **Web → phone**: rings if the app is open or backgrounded. Not if it is killed
  (that needs offline push — see
  [zego-call-integration.md §8.2](./zego-call-integration.md)).
- **Phone → web**: rings only while the site is **open in a tab** with the user
  signed in. Browsers have no equivalent of a VoIP push, so a closed tab cannot
  be woken. This is a platform limit, not a bug — WhatsApp Web behaves the same.

Set expectations in the UI rather than pretending otherwise: show the co-parent's
online state next to the call button, the way the app's calls screen does.

---

## 7. Presence / online status

Reuse whatever the site already has — the same chat WebSocket that drives
presence in the app. Do not build a Zego-based presence system; the two would
disagree.

One lesson worth carrying over from the mobile fix: **a presence socket that
never reconnects reports everyone as permanently offline** after the first
network blip or tab sleep. If the web client does not already have reconnect
with backoff plus a refresh on `visibilitychange`, add it. See
[lib/chatSocket.ts](../lib/chatSocket.ts) for the shape.

---

## 8. Testing checklist

Two devices, or two browsers with different accounts. Half of these only fail in
one direction, so run them all.

**Web ↔ web**
- [ ] A calls B → B sees the incoming dialog → accept → both hear each other
- [ ] Decline → A's ringing UI closes immediately (not after the 60s timeout)
- [ ] A cancels while ringing → B's dialog disappears
- [ ] Nobody answers → both sides return to the app after the timeout
- [ ] Hang up → both sides leave, mic released (the browser tab's mic indicator goes out)
- [ ] Second call after the first → **not** muted, mic works (the app had exactly this bug)
- [ ] B is already in a call → A gets "busy", not silence

**Web ↔ mobile app** — repeat the above in both directions.

**Web specifics**
- [ ] Mic permission denied → a clear message, not a silent dead call
- [ ] Reload mid-call → the call ends cleanly, no zombie room
- [ ] Two tabs signed in as the same user → understand which one rings (§9)
- [ ] Served over HTTPS (or `localhost`) — `getUserMedia` is blocked otherwise

---

## 9. Gotchas

| Symptom | Cause | Fix |
| --- | --- | --- |
| `ReferenceError: window is not defined` at build/SSR | SDK imported at module scope | `"use client"` + dynamic `import()` inside an effect (§5.1) |
| Call connects, nobody hears anything | Page not on HTTPS | `getUserMedia` requires a secure context; `localhost` is exempt, a LAN IP is not |
| No ringtone on the callee | Browser autoplay policy blocks audio before any user interaction | Expected on a cold tab. Do not fight it — the visual dialog still appears |
| Invitation "sent" but never rings | `userID` mismatch between web and mobile | Both must be `str(user.id)` from the token endpoint (§2.1) |
| `errorInvitees` non-empty every time | Callee never logged into ZIM | Their client must be running and signed in; a closed tab cannot be rung |
| Works on web, not to the app | Project still in App Sign mode | §1 — switch the console *and* the mobile constant together |
| Second tab steals the calls | ZIM allows one web session per user; the newer login wins | Detect and warn, or accept it. Do not create two clients in one tab |
| In-call UI renders nowhere | `container` was `null` when `onSetRoomConfigBeforeJoining` ran | The surface `<div>` must be mounted before init, and never unmounted mid-call (§5.6) |
| Token expires during a long call | No renewal wired | `onTokenWillExpire` → `renewToken(freshToken04)` — pass the raw token04, **not** the kitToken |
| TypeScript rejects `renewToken(token)` | The bundled `.d.ts` declares `renewToken(): boolean`; the runtime takes a token argument | The typings are wrong here — cast the client (`as any`), as §5.4 does |

---

## 10. Not covered

- **Video.** Everything above is deliberately voice-only, matching the app.
  Switching means `InvitationTypeVideoCall`, `turnOnCameraWhenJoining: true`, and
  re-enabling the camera buttons — but do it on both platforms at once.
- **Group calls.** `callees` accepts an array and the SDK supports it, but the
  history model (`receiver_user` is a single ID) does not.
- **Waking a closed tab.** Not possible; see §6.
- **Call recording.** The `/recordings/` endpoints are untouched and are not
  wired to Zego's cloud recording on either platform.

---

## Sources

- [Call Kit (Web) — Quick start with call invitation](https://www.zegocloud.com/docs/uikit/callkit-web/call-invitation/quick-start)
- [`@zegocloud/zego-uikit-prebuilt` on npm](https://www.npmjs.com/package/@zegocloud/zego-uikit-prebuilt) — API surface verified against `index.d.ts` v2.18.1
- [ZEGOCLOUD Prebuilt Web SDK reference](https://zegocloud.github.io/zego_uikit_prebuilt_web/)
- [zego_uikit_prebuilt_web samples](https://github.com/ZEGOCLOUD/zego_uikit_prebuilt_web)
