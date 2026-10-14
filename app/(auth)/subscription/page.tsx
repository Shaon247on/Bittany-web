"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredAccessToken } from "@/hooks/useAuth";
import {
  useActiveSubscriptionQuery,
  useCreateSubscriptionCheckoutMutation,
  useRetrieveCheckoutSessionQuery,
  useSubscriptionPlansQuery,
} from "@/hooks/usePayment";
import type { SubscriptionPlan } from "@/types/payment.type";

type BillingCycle = "monthly" | "yearly";

const billingLabels: Record<BillingCycle, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

function formatPrice(value: string | null | undefined): string {
  if (!value) return "0.00";
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : value;
}

function planFeatures(plan: SubscriptionPlan): string[] {
  const descriptions = plan.descriptions
    .map((item) => item.text.trim())
    .filter(Boolean);

  if (descriptions.length > 0) {
    return descriptions;
  }

  return ["Premium subscription access"];
}

function PlanCard({
  plan,
  cycle,
  isActive,
  onCycleChange,
  onBuy,
  isLoading,
}: {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  isActive: boolean;
  onCycleChange: (nextCycle: BillingCycle) => void;
  onBuy: () => void;
  isLoading: boolean;
}) {
  const monthly = formatPrice(plan.monthly_price);
  const yearly = formatPrice(plan.yearly_price);
  const price = cycle === "yearly" ? yearly : monthly;
  const accentClass = isActive
    ? "from-emerald-500 to-teal-500"
    : plan.current_subscribed
      ? "from-sky-500 to-indigo-500"
      : plan.name.toLowerCase().includes("plus")
        ? "from-[#D633FF] to-[#FF5CEF]"
        : "from-[#6A11CB] to-[#9D50BB]";

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-4xl border border-white/60 bg-white shadow-2xl shadow-slate-200/70">
      <div className={`relative flex h-40 items-center justify-center bg-linear-to-br ${accentClass}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32),transparent_55%)]" />
        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-sm">
          {isActive || plan.current_subscribed ? "Current plan" : "Available plan"}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-14">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-black text-slate-900">{plan.name}</h2>
          <div className="mt-3 flex items-center justify-center gap-3">
            {["monthly", "yearly"].map((label) => {
              const nextCycle = label as BillingCycle;
              const active = cycle === nextCycle;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onCycleChange(nextCycle)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {billingLabels[nextCycle]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 text-center">
          <div className="flex items-end justify-center gap-1">
            <span className="text-4xl font-black text-slate-900">${price}</span>
            <span className="pb-1 text-xs font-medium text-slate-500">
              /{cycle === "yearly" ? "year" : "month"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {cycle === "yearly"
              ? "Annual billing with a lower average monthly cost."
              : "Billed monthly for flexible access."}
          </p>
        </div>

        <ul className="flex-1 space-y-3">
          {planFeatures(plan).map((feature, index) => (
            <li key={`${plan.id}-${index}`} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check size={12} strokeWidth={4} />
              </div>
              <span className="text-sm leading-6 text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onBuy}
          disabled={isLoading}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isActive || plan.current_subscribed ? "Current plan" : "Buy Now"}
        </button>
      </div>
    </div>
  );
}

function SubscriptionPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = getStoredAccessToken();
  const [billingCycles, setBillingCycles] = useState<Record<number, BillingCycle>>({});

  const redirectTarget = searchParams.get("redirect") ?? "/home";
  const sessionId = searchParams.get("session_id") ?? undefined;

  const { data: plans = [], isLoading: isPlansLoading } = useSubscriptionPlansQuery();
  const {
    data: activeSubscriptionData,
    isLoading: isSubscriptionLoading,
    refetch: refetchSubscription,
  } = useActiveSubscriptionQuery(Boolean(token));
  const { data: checkoutSession } = useRetrieveCheckoutSessionQuery(sessionId);
  const createCheckout = useCreateSubscriptionCheckoutMutation();

  const activeSubscription = activeSubscriptionData?.subscription ?? null;
  const activePlanId = activeSubscription?.plan ?? null;
  const hasActiveSubscription = Boolean(activeSubscription?.is_active && activeSubscription.status === "premium");

  const selectedPlans = useMemo(() => {
    return plans.map((plan) => ({
      plan,
      cycle: billingCycles[plan.id] ?? "monthly",
      isActive: plan.id === activePlanId || plan.current_subscribed,
    }));
  }, [activePlanId, billingCycles, plans]);

  useEffect(() => {
    if (sessionId && checkoutSession?.payment_status === "paid") {
      void refetchSubscription();
      toast.success("Subscription payment confirmed. Refreshing access.");
      router.replace(redirectTarget);
    }
  }, [checkoutSession?.payment_status, redirectTarget, refetchSubscription, router, sessionId]);

  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [router, token]);

  const handleBuy = (planId: number, cycle: BillingCycle) => {
    createCheckout.mutate(
      {
        plan_id: planId,
        plan_duration: cycle,
        auto_renew: true,
        payment_platform: "stripe",
      },
      {
        onSuccess: (result) => {
          if (!result.checkout_url) {
            toast.error("Checkout URL was not returned by the server.");
            return;
          }

          toast.success("Redirecting to secure checkout...");
          window.location.href = result.checkout_url;
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Could not start checkout.");
        },
      },
    );
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF1FF] px-4">
        <div className="w-full max-w-xl rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
            <ShieldCheck size={14} /> Sign in required
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-900">Choose a subscription to continue</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Please sign in before viewing subscription plans and activating access to the dashboard.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/signin?redirect=${encodeURIComponent(redirectTarget)}`)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all hover:opacity-95"
          >
            Go to sign in <ArrowLeft size={16} className="rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  if (isPlansLoading || isSubscriptionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAF1FF] px-4">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <span className="text-sm font-medium">Loading subscription plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#A5C9E9] bg-linear-to-b from-[#A5C9E9] to-[#D1B3FF] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-white p-3 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Subscription</h1>
            <p className="text-sm font-medium text-slate-600">
              Pick a plan to unlock the dashboard, calls, chats, documents, and more.
            </p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#4586F6] via-[#6E68F5] to-[#A03CE8] p-6 text-white shadow-2xl shadow-violet-200 sm:p-8">
          <div className="absolute -right-16 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 top-20 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white ring-1 ring-white/20">
                <Crown size={12} className="fill-white" /> Live billing
              </div>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                {hasActiveSubscription ? "Your subscription is active" : "Select your subscription plan"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                {hasActiveSubscription
                  ? "Your account can access the dashboard now. You can still review and manage your active plan below."
                  : "Choose monthly or yearly billing. Stripe checkout will activate the plan once payment completes."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/90">Current Status</p>
              <p className="mt-2 text-3xl font-black">{hasActiveSubscription ? "Active" : "Not active"}</p>
              <p className="mt-1 text-xs text-blue-50/90">
                {hasActiveSubscription
                  ? `Plan ID ${activePlanId ?? "-"} is valid until ${activeSubscription?.end_date ?? "renewal"}`
                  : "No active subscription is detected for this account."}
              </p>
            </div>
          </div>
        </section>

        {hasActiveSubscription ? (
          <section className="rounded-4xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black">Access granted</h3>
                <p className="text-sm leading-6 text-emerald-800/90">
                  Your dashboard is unlocked. Use the button below to open the dashboard or update your subscription.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push(redirectTarget)}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-emerald-700"
              >
                Go to dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                window.location.reload()
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Refresh status
              </button>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          {selectedPlans.map(({ plan, cycle, isActive }) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              cycle={cycle}
              isActive={isActive}
              onCycleChange={(nextCycle) =>
                setBillingCycles((current) => ({
                  ...current,
                  [plan.id]: nextCycle,
                }))
              }
              onBuy={() => handleBuy(plan.id, cycle)}
              isLoading={createCheckout.isPending && createCheckout.variables?.plan_id === plan.id}
            />
          ))}
        </div>

        {!plans.length ? (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-600">
            No subscription plans are available right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SubscriptionPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAF1FF] px-4">
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
        <span className="text-sm font-medium">Loading subscription plans...</span>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionPageFallback />}>
      <SubscriptionPageContent />
    </Suspense>
  );
}
