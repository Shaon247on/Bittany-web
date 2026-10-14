"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
    useActiveSubscriptionQuery,
    useCancelSubscriptionMutation,
    useSubscriptionPlansQuery,
} from "@/hooks/usePayment";
import { getStoredAccessToken } from "@/hooks/useAuth";

function formatDate(value: string | null | undefined): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

export default function SubscriptionPage() {
  const router = useRouter();
    const token = getStoredAccessToken();

    const { data: activeSubscriptionData, isLoading } = useActiveSubscriptionQuery(Boolean(token));
    const { data: plans = [] } = useSubscriptionPlansQuery();
    const cancelSubscription = useCancelSubscriptionMutation();

    const subscription = activeSubscriptionData?.subscription ?? null;
    const activePlan = useMemo(() => {
        return plans.find((plan) => plan.id === subscription?.plan) ?? null;
    }, [plans, subscription?.plan]);

    if (!token) {
        return (
            <div className="min-h-screen bg-[#F4F7FF] px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-3xl rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-black text-slate-900">Sign in required</h1>
                    <p className="mt-3 text-sm text-slate-600">Please sign in to view your subscription details.</p>
                    <button
                        type="button"
                        onClick={() => router.push("/signin")}
                        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white"
                    >
                        Go to sign in
                    </button>
                </div>
            </div>
        );
    }

  return (
    <div className="min-h-screen bg-[#F4F7FF] px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-6">
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
            <p className="text-sm font-medium text-slate-500">Review your current plan and billing details.</p>
          </div>
        </div>

              <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#60A5FA] via-[#818CF8] to-[#A78BFA] p-6 shadow-xl shadow-blue-200/50 sm:p-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/15 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white ring-1 ring-white/30">
                <Crown size={12} className="fill-white" /> Active Plan
              </div>
                          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                              {subscription ? `${activePlan?.name ?? "Subscription"}` : "No active subscription"}
                          </h2>
                          <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-blue-50/90">
                              {subscription
                                  ? "Your billing state is managed through Stripe and kept in sync with the active subscription history endpoint."
                                  : "There is no active subscription on this account yet."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/30 bg-white/10 px-6 py-5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/80">Monthly Price</p>
                          <p className="mt-1 text-4xl font-black text-white">{subscription ? `$${Number(subscription.price).toFixed(2)}` : "-"}</p>
            </div>
          </div>
        </section>

              <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Subscription Details</h3>
              <p className="text-sm text-slate-500">Current billing and plan information.</p>
            </div>
            <div className="hidden rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-500/20 sm:block">
                          {subscription?.is_active ? "Auto-renew enabled" : "Inactive"}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="divide-y divide-slate-100">
                          {[
                              { label: "User Name", value: subscription?.user?.name ?? subscription?.user?.username ?? "-" },
                              { label: "Plan", value: activePlan?.name ?? subscription?.plan?.toString() ?? "-" },
                              { label: "Billing Cycle", value: subscription?.duration_type ?? "-" },
                              { label: "Price", value: subscription ? `$${Number(subscription.price).toFixed(2)}` : "-" },
                              { label: "Start Date", value: formatDate(subscription?.start_date) },
                              { label: "End Date", value: formatDate(subscription?.end_date) },
                              { label: "Provider", value: subscription?.provider ?? "-" },
                              { label: "Payment Status", value: subscription?.status ?? "-" },
                          ].map((item) => (
                              <div
                                  key={item.label}
                                  className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                              >
                  <p className="text-sm font-bold text-slate-500">{item.label}</p>
                  <p className="text-sm font-bold text-slate-900 sm:text-right">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Next Renewal</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(subscription?.end_date)}</p>
                          <p className="mt-1 text-xs text-slate-500">Plan remains active until cancellation or expiry.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Payment Status</p>
                          <p className="mt-1 text-sm font-bold text-emerald-600">{subscription?.is_active ? "Secure & Active" : "Inactive"}</p>
                          <p className="mt-1 text-xs text-slate-500">Last payment and subscription state are read from payment history.</p>
            </div>
          </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <button
                          type="button"
                          onClick={() => router.push("/subscription")}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#60A5FA] to-[#818CF8] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.98]"
                      >
                          <RefreshCcw size={18} /> Manage Plans
                      </button>
            <button
              type="button"
                          disabled={!subscription?.is_active || cancelSubscription.isPending}
                          onClick={() => {
                              if (!window.confirm("Cancel your active subscription?")) return;
                              cancelSubscription.mutate(undefined, {
                                  onSuccess: () => {
                                      toast.success("Subscription cancelled.");
                                  },
                                  onError: (error) => {
                                      toast.error(error instanceof Error ? error.message : "Could not cancel subscription.");
                                  },
                              });
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                          <ShieldCheck size={18} />
                          {cancelSubscription.isPending ? "Cancelling..." : "Cancel Subscription"}
            </button>
          </div>

                  {isLoading ? (
                      <p className="mt-4 text-xs text-slate-500">Loading subscription status...</p>
                  ) : null}
        </section>
      </div>
    </div>
  );
}
