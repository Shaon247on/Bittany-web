"use client";

import {
  ZEGO_APP_ID,
  ZEGO_CALL_TIMEOUT_SECONDS,
  ZEGO_RINGTONES,
  isZegoConfigured,
} from "./config";
import { clearZegoCredentials, getZegoCredentials } from "./token";
import { createCallLog, finishCallLog } from "./callLog";

// Loosely typed on purpose: the package's bundled .d.ts lags the runtime in a
// couple of places (renewToken is declared with no parameters but takes a
// token04 at runtime), so we do not let it dictate our call sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallClient = any;

let client: CallClient | null = null;
let clientUserID: string | null = null;
let creating: Promise<CallClient> | null = null;

/** Wall-clock start of the current in-room call, used to compute duration. */
let callStartedAt: number | null = null;

type Surface = {
  container: HTMLElement | null;
  onActiveChange: (active: boolean) => void;
  onHistoryChange: () => void;
};

// Owned by CallProvider — the DOM node the in-call UI is mounted into plus the
// hooks that let React react to what the SDK does.
let surface: Surface = {
  container: null,
  onActiveChange: () => {},
  onHistoryChange: () => {},
};

export function registerCallSurface(next: Partial<Surface>) {
  surface = {
    container: next.container ?? null,
    onActiveChange: next.onActiveChange ?? (() => {}),
    onHistoryChange: next.onHistoryChange ?? (() => {}),
  };
}

export function getCallClient(): CallClient | null {
  return client;
}

export function getCallClientUserID() {
  return clientUserID;
}

/** Finalize the caller's history row exactly once, whatever ended the call. */
function finalizeCall(status: "completed" | "missed" | "failed") {
  const startedAt = callStartedAt;
  callStartedAt = null;
  const duration = startedAt ? (Date.now() - startedAt) / 1000 : 0;

  void finishCallLog(status, duration).finally(() => {
    surface.onHistoryChange();
  });
}

export async function initCallClient(): Promise<CallClient> {
  if (!isZegoConfigured) throw new Error("NEXT_PUBLIC_ZEGO_APP_ID is not set.");
  if (client) {
    console.log("[Zego] Reusing existing client instance.");
    return client;
  }
  if (creating) {
    console.log("[Zego] Init already in progress; returning the same promise.");
    return creating;
  }

  creating = (async () => {
    console.log("[Zego] Starting initCallClient with appId:", ZEGO_APP_ID);

    try {
      const [{ ZegoUIKitPrebuilt }, { ZIM }] = await Promise.all([
        import("@zegocloud/zego-uikit-prebuilt"),
        import("zego-zim-web"),
      ]);

      console.log("[Zego] Zego SDK and ZIM loaded successfully.");

      const me = await getZegoCredentials();
      console.log("[Zego] Received credentials:", {
        userID: me.userID,
        userName: me.userName,
        expiresAt: me.expiresAt,
      });

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
        ZEGO_APP_ID,
        me.token,
        "",
        me.userID,
        me.userName,
      );

      console.log("[Zego] Generated kit token successfully.");

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      console.log("[Zego] Zego client created.");

      zp.addPlugins({ ZIM });
      console.log("[Zego] ZIM plugin added.");

      zp.setCallInvitationConfig({
        ringtoneConfig: ZEGO_RINGTONES,

        // Fires on BOTH sides immediately before joining — the one reliable moment
        // to reveal the call surface, because it happens whether this user placed
        // the call or accepted one.
        onSetRoomConfigBeforeJoining: () => {
          callStartedAt = Date.now();
          surface.onActiveChange(true);
          return voiceRoomConfig(ZegoUIKitPrebuilt.OneONoneCall);
        },

        // Declined / timed out / cancelled / busy / the other side left the room.
        onCallInvitationEnded: (reason: string) => {
          surface.onActiveChange(false);

          if (reason === "Declined" || reason === "Busy") finalizeCall("failed");
          else if (reason === "Timeout" || reason === "Canceled") finalizeCall("missed");
          // "LeaveRoom": the other party hung up. If we ever joined it was a real
          // conversation; onLeaveRoom usually fires too, but finalizeCall is
          // idempotent so whichever lands first wins.
          else finalizeCall(callStartedAt ? "completed" : "failed");
        },

        onIncomingCallTimeout: () => surface.onActiveChange(false),
        onOutgoingCallTimeout: () => surface.onActiveChange(false),

        // Long calls: the token is short-lived, the call is not. renewToken takes
        // the raw token04, NOT the kitToken.
        onTokenWillExpire: async () => {
          try {
            const fresh = await getZegoCredentials(true);
            // The bundled .d.ts declares renewToken() with no parameters; the
            // runtime takes the raw token04. The typings are wrong here.
            (zp as CallClient).renewToken(fresh.token);
          } catch (error) {
            console.warn("[Zego] Token renewal failed:", error);
          }
        },
      });

      console.log("[Zego] Call invitation config attached.");

      client = zp;
      clientUserID = me.userID;
      return zp;
    } catch (error) {
      console.error("[Zego] initCallClient crashed while setting up Zego:", error);
      throw error;
    }
  })();

  try {
    return await creating;
  } catch (error) {
    // Let a later attempt retry instead of caching the failure forever.
    console.error("[Zego] initCallClient failed; clearing client state.", error);
    client = null;
    clientUserID = null;
    throw error;
  } finally {
    creating = null;
  }
}

export function destroyCallClient() {
  surface.onActiveChange(false);
  callStartedAt = null;
  try {
    client?.destroy();
  } catch (error) {
    console.warn("[Zego] destroy failed:", error);
  }
  client = null;
  clientUserID = null;
  clearZegoCredentials();
}

export type SendInvitationResult =
  | { ok: true }
  | { ok: false; reason: "not-ready" | "unavailable" | "error" };

/**
 * Place a one-to-one voice call. Writes the history row on success — the caller
 * owns that row, and finalizeCall() closes it out however the call ends.
 */
export async function sendVoiceCallInvitation(callee: {
  userID: string;
  userName: string;
}): Promise<SendInvitationResult> {
  const zp = getCallClient();
  console.log("[Zego] sendVoiceCallInvitation called with:", callee, "clientExists:", !!zp);

  if (!zp) return { ok: false, reason: "not-ready" };

  try {
    const payload = {
      callees: [callee],
      callType: 0, // ZegoUIKitPrebuilt.InvitationTypeVoiceCall
      timeout: ZEGO_CALL_TIMEOUT_SECONDS,
    };

    console.log("[Zego] Sending call invitation payload:", payload);

    const { errorInvitees } = await zp.sendCallInvitation(payload);
    console.log("[Zego] sendCallInvitation result:", { errorInvitees });

    if (errorInvitees?.length) {
      console.warn("[Zego] Invitation was rejected by SDK for callee(s):", errorInvitees);
      // The everyday case: their app/tab is closed, so there is nothing to ring.
      return { ok: false, reason: "unavailable" };
    }

    await createCallLog(callee.userID);
    surface.onHistoryChange();
    console.log("[Zego] Call log created and invitation sent successfully.");
    return { ok: true };
  } catch (error) {
    console.error("[Zego] Invitation failed with SDK error:", error);
    return { ok: false, reason: "error" };
  }
}

/**
 * Voice-only room config. Mirrors the mobile app's one-on-one voice setup.
 *
 * showPreJoinView: false matters — the default web flow shows a device-check
 * screen before joining, which is right for a meeting product and wrong for a
 * phone call: the other person is already waiting.
 */
function voiceRoomConfig(scenarioMode: CallClient) {
  return {
    container: surface.container,
    scenario: { mode: scenarioMode },

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

    onLeaveRoom: () => {
      surface.onActiveChange(false);
      finalizeCall(callStartedAt ? "completed" : "failed");
    },
  };
}
