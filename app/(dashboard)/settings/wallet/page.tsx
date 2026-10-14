"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  CreditCard,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  WalletCards,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreateWalletTopupCheckoutMutation,
  useWalletBalanceQuery,
  useWalletHistoryQuery,
  useWalletTopupPackagesQuery,
} from "@/hooks/useWallet";
import type {
  WalletTopupPackage,
  WalletTransaction as ApiWalletTransaction,
} from "@/types/wallet.type";

type PackageCard = {
  id: number;
  amount: string;
  subtitle: string;
  gradient: string;
  bonus: string | null;
  footer: string;
};

type WalletTransaction = {
  id: string;
  title: string;
  time: string;
  amount: string;
  type: "credit" | "debit";
  iconBg: string;
  iconColor: string;
  amountColor: string;
  icon: "credit" | "call" | "message";
};

const packageGradients = [
  "from-[#607089] to-[#4A5971]",
  "from-[#5D9AF4] to-[#4D87E0]",
  "from-[#B66DFF] to-[#8E40E0]",
  "from-[#FFAE3B] to-[#FF7A2E]",
];

function parseAmount(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatTransactionTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toWalletTransaction(item: ApiWalletTransaction): WalletTransaction {
  const isCredit = item.transaction_type === "credit";
  const amount = parseAmount(item.amount);

  const icon = isCredit
    ? "credit"
    : item.cost_type === "call"
      ? "call"
      : "message";

  const iconBg =
    icon === "credit"
      ? "bg-emerald-100"
      : icon === "call"
        ? "bg-violet-100"
        : "bg-rose-100";

  const iconColor =
    icon === "credit"
      ? "text-emerald-600"
      : icon === "call"
        ? "text-violet-600"
        : "text-rose-500";

  return {
    id: String(item.id),
    title:
      item.description?.trim() ||
      item.cost_type_display ||
      item.transaction_type_display ||
      (isCredit ? "Wallet Top-up" : "Wallet Charge"),
    time: formatTransactionTime(item.created_at),
    amount: `${isCredit ? "+" : "-"}${formatCurrency(amount)}`,
    type: isCredit ? "credit" : "debit",
    iconBg,
    iconColor,
    amountColor: isCredit ? "text-emerald-600" : "text-rose-500",
    icon,
  };
}

function toPackageCard(item: WalletTopupPackage, index: number): PackageCard {
  const amount = parseAmount(item.amount);
  const bonus = parseAmount(item.bonus);

  return {
    id: item.id,
    amount: formatCurrency(amount),
    subtitle: item.description?.trim() || "Top-up package",
    gradient: packageGradients[index % packageGradients.length],
    bonus: bonus > 0 ? `+${formatCurrency(bonus)}` : null,
    footer: bonus > 0 ? `Get ${formatCurrency(bonus)} bonus credit` : "Simple recharge",
  };
}

function TransactionIcon({ icon }: { icon: WalletTransaction["icon"] }) {
  if (icon === "credit") return <ArrowDownLeft size={18} />;
  if (icon === "call") return <Phone size={18} />;
  return <MessageCircle size={18} />;
}

export default function WalletPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"all" | "credit" | "debit">("all");
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isTopUpInputVisible, setIsTopUpInputVisible] = useState(false);

  const {
    data: walletBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    error: balanceError,
    refetch: refetchBalance,
  } = useWalletBalanceQuery();

  const {
    data: walletHistory,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useWalletHistoryQuery(!isBalanceLoading && !isBalanceError);

  const {
    data: walletPackages = [],
    isLoading: isPackagesLoading,
    isError: isPackagesError,
    error: packagesError,
  } = useWalletTopupPackagesQuery();

  const packageList = useMemo(
    () => (Array.isArray(walletPackages) ? walletPackages : []),
    [walletPackages],
  );

  const createCheckoutSession = useCreateWalletTopupCheckoutMutation();

  const balance = walletBalance?.balance ?? walletHistory?.balance ?? 0;

  const packageCards = useMemo(() => {
    return packageList.map(toPackageCard);
  }, [packageList]);

  const selectedPackage = useMemo(() => {
    if (packageList.length === 0) return null;
    return (
      packageList.find((item) => item.id === selectedPackageId) ??
      packageList[0]
    );
  }, [selectedPackageId, packageList]);

  const transactions = useMemo(() => {
    return (walletHistory?.transactions ?? []).map(toWalletTransaction);
  }, [walletHistory?.transactions]);

  const weeklySpent = useMemo(() => {
    const timestamps = (walletHistory?.transactions ?? [])
      .map((item) => new Date(item.created_at).getTime())
      .filter((value) => Number.isFinite(value));

    const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
    if (!latestTimestamp) return 0;

    const sevenDaysAgo = latestTimestamp - 7 * 24 * 60 * 60 * 1000;

    return (walletHistory?.transactions ?? [])
      .filter((item) => {
        if (item.transaction_type !== "debit") return false;
        const createdAt = new Date(item.created_at).getTime();
        return Number.isFinite(createdAt) && createdAt >= sevenDaysAgo;
      })
      .reduce((sum, item) => sum + parseAmount(item.amount), 0);
  }, [walletHistory?.transactions]);

  const availableBonus = useMemo(() => {
    return packageList.reduce((sum, item) => sum + parseAmount(item.bonus), 0);
  }, [packageList]);

  useEffect(() => {
    if (isBalanceError && balanceError instanceof Error) {
      toast.error(balanceError.message);
    }
  }, [balanceError, isBalanceError]);

  useEffect(() => {
    if (isHistoryError && historyError instanceof Error) {
      toast.error(historyError.message);
    }
  }, [historyError, isHistoryError]);

  useEffect(() => {
    if (isPackagesError && packagesError instanceof Error) {
      toast.error(packagesError.message);
    }
  }, [isPackagesError, packagesError]);

  useEffect(() => {
    const status =
      searchParams.get("wallet_topup") ??
      searchParams.get("topup") ??
      searchParams.get("payment_status");
    const hasSessionId = Boolean(searchParams.get("session_id"));

    if (status !== "success" && !hasSessionId) {
      return;
    }

    void refetchBalance();
    void refetchHistory();
    toast.success("Wallet updated. Latest balance loaded.");

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("wallet_topup");
    nextParams.delete("topup");
    nextParams.delete("payment_status");
    nextParams.delete("session_id");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [pathname, refetchBalance, refetchHistory, router, searchParams]);

  const startTopupCheckout = (pkg?: WalletTopupPackage | null) => {
    const targetPackage = pkg ?? selectedPackage;

    if (!targetPackage) return;

    const amount = parseAmount(targetPackage.amount);
    if (amount <= 0) {
      toast.error("Invalid package amount.");
      return;
    }

    createCheckoutSession.mutate(
      {
        package_id: targetPackage.id,
        amount,
      },
      {
        onSuccess: (result) => {
          if (!result.checkout_url) {
            toast.error("Checkout URL is missing from server response.");
            return;
          }

          toast.success("Redirecting to secure checkout...");
          window.location.href = result.checkout_url;
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to start checkout right now.";
          toast.error(message);
        },
      },
    );
  };

  const startCustomTopupCheckout = () => {
    const amount = parseAmount(customAmount);

    if (amount <= 0) {
      toast.error("Enter a valid amount greater than zero.");
      return;
    }

    createCheckoutSession.mutate(
      {
        amount,
      },
      {
        onSuccess: (result) => {
          if (!result.checkout_url) {
            toast.error("Checkout URL is missing from server response.");
            return;
          }

          toast.success("Redirecting to secure checkout...");
          window.location.href = result.checkout_url;
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to start checkout right now.";
          toast.error(message);
        },
      },
    );
  };

  const filteredTransactions = useMemo(() => {
    if (activeTab === "all") return transactions;
    return transactions.filter((item) => item.type === activeTab);
  }, [activeTab, transactions]);

  return (
    <div className="min-h-screen bg-[#EAF1FF] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-white p-3 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">My Wallet</h1>
            <p className="text-sm text-slate-500">Top up balance and review your recent activity.</p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#4586F6] via-[#6E68F5] to-[#A03CE8] p-6 shadow-2xl shadow-violet-200 sm:p-8">
          <div className="absolute -right-16 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 top-20 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="rounded-[1.75rem] bg-white p-6 shadow-xl shadow-slate-900/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sky-600">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Current Balance</p>
                  <p className="text-xs text-slate-500">Available to spend across calls and messages</p>
                </div>
              </div>

              <p className="text-4xl font-black text-slate-900 sm:text-5xl">
                {isBalanceLoading ? "Loading..." : formatCurrency(balance)}
              </p>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {isBalanceLoading ? "Syncing wallet..." : "Ready for top-up"}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:min-w-80 sm:items-end">
                  {isTopUpInputVisible ? (
                    <div className="flex w-full flex-col gap-2 sm:max-w-sm">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={customAmount}
                        onChange={(event) => setCustomAmount(event.target.value)}
                        placeholder="Enter amount"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none ring-sky-200 transition focus:ring"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            startCustomTopupCheckout();
                          }}
                          disabled={createCheckoutSession.isPending}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {createCheckoutSession.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Plus size={16} />
                          )}
                          {createCheckoutSession.isPending ? "Opening..." : "Top Up"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsTopUpInputVisible(false);
                            setCustomAmount("");
                          }}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTopUpInputVisible(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition-all hover:opacity-95"
                    >
                      <Plus size={16} />
                      Top Up
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">This Week</p>
                <p className="mt-2 text-2xl font-black text-white">{formatCurrency(weeklySpent)}</p>
                <p className="mt-1 text-xs font-medium text-white/75">Spent on calls and messages</p>
              </div>
              <div className="rounded-3xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Bonus Credit</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {isPackagesLoading ? "..." : formatCurrency(availableBonus)}
                </p>
                <p className="mt-1 text-xs font-medium text-white/75">Available with selected packages</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-4xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-800">Quick Top-up</h2>
                <p className="text-sm text-slate-500">Choose a package to start checkout right away.</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 sm:inline-flex">
                <Zap size={14} className="text-amber-500" /> Bonus included on selected packs
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {packageCards.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const target = packageList.find((pkg) => pkg.id === item.id);
                    setSelectedPackageId(item.id);
                    if (target) {
                      toast.info(`${item.amount} package selected. Starting checkout...`);
                      startTopupCheckout(target);
                    }
                  }}
                  className={`group relative overflow-hidden rounded-[1.75rem] bg-linear-to-br ${item.gradient} p-5 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Package</span>
                    {item.bonus ? <Zap size={16} className="text-white" /> : null}
                  </div>
                  <p className="mt-2 text-3xl font-black text-white">{item.amount}</p>
                  <p className="mt-1 text-sm font-medium text-white/80">{item.subtitle}</p>
                  {item.bonus ? (
                    <div className="mt-4 inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white">
                      {item.bonus} Bonus
                    </div>
                  ) : null}
                  {selectedPackage?.id === item.id ? (
                    <div className="mt-3 inline-flex rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-black text-white">
                      Selected
                    </div>
                  ) : null}
                  <p className="mt-6 text-[11px] font-bold uppercase tracking-wide text-white/90">{item.footer}</p>
                </button>
              ))}
            </div>

            {!isPackagesLoading && packageList.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Top-up packages are not available right now.
              </div>
            ) : null}
          </section>

          <section className="rounded-4xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-800">Transaction History</h2>
                <p className="text-sm text-slate-500">Keep track of credit and usage.</p>
              </div>
              <div className="flex rounded-2xl bg-slate-100 p-1">
                {[
                  { label: "All", value: "all" },
                  { label: "Credit", value: "credit" },
                  { label: "Debit", value: "debit" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value as "all" | "credit" | "debit")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === tab.value
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {isHistoryLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Loading transactions...
                </div>
              ) : null}

              {filteredTransactions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.iconBg} ${item.iconColor}`}>
                      <TransactionIcon icon={item.icon} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.time}</p>
                    </div>
                  </div>
                  <p className={`shrink-0 text-sm font-black ${item.amountColor}`}>{item.amount}</p>
                </div>
              ))}
            </div>

            {!isHistoryLoading && filteredTransactions.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No transactions in this tab.
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <WalletCards size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Wallet usage tip</p>
                  <p className="text-xs text-white/70">Choose higher bundles to unlock extra bonus credit.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
