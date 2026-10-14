"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useBridgeInfoQuery } from "@/hooks/useBridge";
import { callKeys, useWebRTCHistoryQuery } from "@/hooks/useCall";
import { getStoredAccessToken } from "@/hooks/useAuth";
import { isZegoConfigured } from "@/lib/zego/config";
import {
  destroyCallClient,
  initCallClient,
  registerCallSurface,
  sendVoiceCallInvitation,
} from "@/lib/zego/callClient";

export type CallServiceStatus = "idle" | "connecting" | "ready" | "error";

interface CallContextValue {
  /** Readiness of the ZEGOCLOUD client (ringing/accept/in-call UI is the SDK's). */
  serviceStatus: CallServiceStatus;
  /** Why the service is unusable, when serviceStatus is "error". */
  serviceError: string | null;
  /** True while the in-call surface is on screen. */
  isCallActive: boolean;
  /** True while an outgoing invitation is being sent. */
  isSending: boolean;
  canCall: boolean;
  partnerName: string;
  startCall: () => Promise<void>;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

/**
 * Init fails for a handful of distinct reasons and they need distinct fixes —
 * a single "call service unavailable" sends you hunting for the wrong thing.
 */
function describeInitError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (status === 404) {
    return "Call token endpoint (/api/v1/call/zego/token/) is not available on the backend yet.";
  }
  if (status === 401 || status === 403) {
    return "Not authorized for the call token endpoint. Try signing in again.";
  }
  if (status && status >= 500) {
    return "The call token endpoint returned a server error.";
  }

  const message = (error as { message?: string })?.message;
  return message ? `Call service failed to start: ${message}` : "Call service failed to start.";
}

function isSecureEnough() {
  if (typeof window === "undefined") return true;
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return window.isSecureContext || isLocalhost;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: bridgeInfo } = useBridgeInfoQuery();
  // Keep the history query subscribed so invalidateQueries() after a call
  // triggers a background refetch wherever the call log is shown.
  useWebRTCHistoryQuery();

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<CallServiceStatus>("idle");
  const [serviceError, setServiceError] = useState<string | null>(null);

  const token = getStoredAccessToken();
  const partner = bridgeInfo?.partner ?? null;
  const partnerId = partner?.id ?? null;
  const partnerName = partner?.name || partner?.username || "Co-parent";

  const invalidateHistory = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: callKeys.webrtcHistory() });
  }, [queryClient]);

  useEffect(() => {
    console.log("[Zego] CallProvider effect fired.", {
      isZegoConfigured,
      token: !!token,
      tokenValue: token ? token.slice(0, 12) + "..." : null,
    });

    if (!isZegoConfigured) {
      console.warn("[Zego] NEXT_PUBLIC_ZEGO_APP_ID is not set — calling is disabled.");
      setServiceStatus("error");
      setServiceError("Call service is not configured. Set NEXT_PUBLIC_ZEGO_APP_ID and reload.");
      return;
    }
    if (!token) {
      console.warn("[Zego] Token missing in browser storage; skipping Zego init.");
      return;
    }

    let cancelled = false;

    registerCallSurface({
      container: surfaceRef.current,
      onActiveChange: setIsCallActive,
      onHistoryChange: invalidateHistory,
    });

    setServiceStatus("connecting");
    setServiceError(null);
    console.log("[Zego] Starting initCallClient()...");

    initCallClient()
      .then(() => {
        if (cancelled) return;
        console.log("[Zego] initCallClient() succeeded; service ready.");
        setServiceStatus("ready");
        setServiceError(null);
      })
      .catch((error) => {
        console.error("[Zego] Call service init failed:", error);
        if (cancelled) return;
        setServiceStatus("error");
        setServiceError(describeInitError(error));
      });

    return () => {
      cancelled = true;
      destroyCallClient();
      registerCallSurface({});
      setServiceStatus("idle");
      setServiceError(null);
    };
  }, [token, invalidateHistory]);

  const startCall = useCallback(async () => {
    console.log("[Zego] startCall invoked.", {
      serviceStatus,
      partnerId,
      partnerName,
      isSecureEnough: isSecureEnough(),
    });

    if (serviceStatus !== "ready") {
      toast.error(
        serviceStatus === "error"
          ? (serviceError ?? "Call service is unavailable. Please reload and try again.")
          : "Connecting to the call service — try again in a second.",
      );
      return;
    }
    if (!partnerId) {
      toast.error("Connect with your co-parent before making a call.");
      return;
    }
    if (!isSecureEnough()) {
      toast.error("Calls need a secure (HTTPS) connection to use your microphone.");
      return;
    }

    setIsSending(true);
    try {
      // String(): must match str(request.user.id) from the token endpoint, which
      // is also what the mobile app logs in with.
      const result = await sendVoiceCallInvitation({
        userID: String(partnerId),
        userName: partnerName,
      });

      console.log("[Zego] sendVoiceCallInvitation result:", result);

      if (!result.ok) {
        if (result.reason === "unavailable") {
          toast.info(`${partnerName} is unavailable right now. Try a message instead.`);
        } else if (result.reason === "not-ready") {
          toast.error("Connecting to the call service — try again in a second.");
        } else {
          toast.error("Call could not be placed. Please try again.");
        }
      }
    } finally {
      setIsSending(false);
    }
  }, [partnerId, partnerName, serviceError, serviceStatus]);

  const value = useMemo<CallContextValue>(
    () => ({
      serviceStatus,
      serviceError,
      isCallActive,
      isSending,
      canCall: serviceStatus === "ready" && Boolean(partnerId) && !isCallActive && !isSending,
      partnerName,
      startCall,
    }),
    [serviceStatus, serviceError, isCallActive, isSending, partnerId, partnerName, startCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}

      {/*
        Always mounted, never unmounted mid-call: the SDK holds a direct
        reference to this node, so React must not pull it out from under it.
        Visibility is toggled instead.
      */}
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
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCallContext must be used within CallProvider");
  }
  return context;
}
