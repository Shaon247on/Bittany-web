"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getStoredAccessToken } from "@/hooks/useAuth";
import { useChatRoomsQuery, useChatRoomSocket } from "@/hooks/useChat";
import { useBridgeInfoQuery } from "@/hooks/useBridge";
import { clearPartnerPresence, setPartnerOnline } from "@/lib/presence";

const PUBLIC_ROUTES = [
  "/",
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/password-reset-success",
  "/otp",
  "/privacy-policy",
  "/terms-conditions",
  "/checkout/success",
  "/subscription",
];

const ONLY_UNAUTH_ROUTES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/password-reset-success",
  "/otp",
];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = getStoredAccessToken();
    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isOnlyUnauth = ONLY_UNAUTH_ROUTES.includes(pathname);

    if (!token && !isPublic) {
      router.replace("/signin");
    } else if (token && isOnlyUnauth) {
      router.replace("/home");
    }
  }, [mounted, pathname, router]);

  if (!mounted) {
    return null;
  }

  const token = getStoredAccessToken();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isOnlyUnauth = ONLY_UNAUTH_ROUTES.includes(pathname);

  // If redirecting, show a beautiful loader instead of content flash
  const shouldRedirectToLogin = !token && !isPublic;
  const shouldRedirectToHome = token && isOnlyUnauth;

  if (shouldRedirectToLogin || shouldRedirectToHome) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-white overflow-hidden px-6 py-12">
        {/* Background blobs */}
        <div
          className="absolute bg-[#EBF9FB] rounded-full pointer-events-none"
          style={{ width: "110vw", height: "110vw", top: "-30vh", left: "-60vw" }}
        />
        <div
          className="absolute bg-[#F5EEFF] rounded-full pointer-events-none"
          style={{ width: "120vw", height: "120vw", bottom: "-30vh", right: "-50vw" }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-[0_8px_30px_rgb(196,161,255,0.15)] border border-purple-50">
            <Loader2 className="h-7 w-7 animate-spin text-[#99D1E8]" />
          </div>
          <span className="text-[#1D2E54] text-base font-bold tracking-wide animate-pulse">
            Verifying access...
          </span>
        </div>
      </div>
    );
  }

  const showOnlineSocket = Boolean(token && !shouldRedirectToHome && !shouldRedirectToLogin);

  return (
    <>
      {showOnlineSocket && <OnlineSocketManager />}
      {children}
    </>
  );
}

/**
 * Opened for the whole signed-in session: entering the site connects this socket,
 * which is what marks the user online to the backend. It also publishes the
 * co-parent's status into lib/presence so any screen — the calls page included —
 * can read it without opening a socket of its own.
 */
function OnlineSocketManager() {
  const { data: rooms = [] } = useChatRoomsQuery();
  const { data: bridgeInfo } = useBridgeInfoQuery();
  const firstRoomId = rooms[0]?.room_id ?? null;
  const partner = bridgeInfo?.partner ?? null;

  const handlePresence = useCallback(
    (event: { type: "user_joined" | "user_left"; user_id: number; username: string }) => {
      if (!partner) return;

      const isPartnerEvent =
        Number(event.user_id) === Number(partner.id) ||
        event.username?.toLowerCase() === partner.username?.toLowerCase();

      if (!isPartnerEvent) return;
      setPartnerOnline(event.type === "user_joined");
    },
    [partner],
  );

  useChatRoomSocket({
    roomId: firstRoomId,
    enabled: Boolean(firstRoomId),
    onPresence: handlePresence,
    // partner_status is the authoritative snapshot the server pushes on connect.
    onPartnerStatus: (event) => setPartnerOnline(event.is_online),
    // Socket down means we no longer know — better "checking" than a stale dot.
    onDisconnected: clearPartnerPresence,
  });

  return null;
}
