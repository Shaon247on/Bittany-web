"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Loader2, LogOut, ShieldAlert } from "lucide-react";
import Sidebar from "@/components/global/Sidebar";
import BottomNav from "@/components/global/BottomNav";
import { CallProvider } from "@/components/global/CallProvider";
import { clearAuthStorage, getStoredAccessToken, useAuthProfileQuery } from "@/hooks/useAuth";
import { useActiveSubscriptionQuery } from "@/hooks/usePayment";

type DashboardGateProps = {
  children: ReactNode;
};

export default function DashboardGate({ children }: DashboardGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const token = getStoredAccessToken();

  const handleLogout = () => {
    clearAuthStorage();
    router.replace("/");
  };

  const { data: profile, isLoading: isProfileLoading } = useAuthProfileQuery();

  const isOnboarded = Boolean(
    profile &&
    (profile.onboarding_completed ??
      (profile.role === "mother" || profile.role === "father"))
  );

  const {
    data: subscriptionData,
    isLoading,
    isFetching,
  } = useActiveSubscriptionQuery(Boolean(token) && isOnboarded);
console.log("data::",subscriptionData)
  const subscription = subscriptionData?.subscription ?? null;
  const hasActiveSubscription = Boolean(subscription?.is_active && subscription.status === "premium");

  useEffect(() => {
    if (!token) {
      router.replace("/");
    } else if (profile && !isProfileLoading && !isOnboarded) {
      router.replace("/account-setup");
    }
  }, [router, token, profile, isProfileLoading, isOnboarded]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF1FF] px-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span className="text-sm font-medium">Checking your session...</span>
        </div>
      </div>
    );
  }

  if (isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF1FF] px-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span className="text-sm font-medium">Checking your profile...</span>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF1FF] px-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span className="text-sm font-medium">Redirecting to setup...</span>
        </div>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF1FF] px-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span className="text-sm font-medium">Verifying subscription access...</span>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-[#EAF1FF] px-4 py-8 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-4xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-600">
              <ShieldAlert size={14} /> Subscription required
            </div>
            <h1 className="mt-4 text-3xl font-black text-slate-900">Your dashboard is locked</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              You need an active subscription before accessing dashboard features like chats, calls, calendar, documents,
              and expenses. Choose a plan to continue.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push(`/subscription?redirect=${encodeURIComponent(pathname)}`)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition-all hover:opacity-95"
              >
                Choose a plan <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Refresh access
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-5 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#EAF1FF] lg:pl-72">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col border-r border-[#D2DCF5] bg-linear-to-b from-[#1C2E57] via-[#27427D] to-[#34579F] shadow-xl shadow-[#1C2E57]/30">
        <Sidebar />
      </aside>

      <CallProvider>
        <div className="min-h-screen min-w-0 bg-[#EAF1FF]">
          <div className="min-h-screen pb-20 lg:pb-0 bg-linear-to-br from-[#80D0FF] via-[#B399FF] to-[#E0B0FF] lg:rounded-l-4xl lg:border-l lg:border-white/30 lg:shadow-[-18px_0_40px_rgba(28,46,87,0.08)]">
            {children}
          </div>
        </div>

        <BottomNav />
      </CallProvider>
    </div>
  );
}
