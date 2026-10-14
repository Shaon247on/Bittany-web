"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    BadgeCheck,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Plus,
    Search,
    TrendingUp,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { SummaryCard } from "@/components/modules/expenses/SummaryCard";
import { ExpenseRow } from "@/components/modules/expenses/ExpenseRow";
import { AddExpenseModal } from "@/components/ui/AddExpenseModal";
import { EventFormField } from "@/components/ui/EventFormField";
import { useBridgeChildrenQuery, useBridgeInfoQuery } from "@/hooks/useBridge";
import { useAuthProfileQuery } from "@/hooks/useAuth";
import {
    useApproveExpenseMutation,
    useConfirmAgreementMutation,
    useCreateExpenseMutation,
    useDeleteExpenseMutation,
    useExpenseListQuery,
    useExpenseSummaryQuery,
    useMarkExpensePaidMutation,
    useOfflineAgreementMutation,
    useRejectExpenseMutation,
    useUpdateExpenseMutation,
} from "@/hooks/useExpense";
import type {
    ExpenseApprovalStatus,
    ExpenseCardItem,
    ExpenseListItem,
    ExpenseMarkPaidPayload,
    ExpensePaymentStatus,
    ExpenseUpsertPayload,
} from "@/types/expense.type";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_OPTIONS = [
    { label: "All", value: "All", icon: <TrendingUp size={14} />, active: "bg-slate-800 text-white", base: "bg-white text-slate-500 border border-slate-200" },
    { label: "Waiting", value: "pending", icon: <Clock size={14} />, active: "bg-orange-500 text-white", base: "bg-white text-slate-500 border border-slate-200" },
    { label: "Approved", value: "approved", icon: <CheckCircle2 size={14} />, active: "bg-sky-500 text-white", base: "bg-white text-slate-500 border border-slate-200" },
    { label: "Rejected", value: "rejected", icon: <AlertCircle size={14} />, active: "bg-red-500 text-white", base: "bg-white text-slate-500 border border-slate-200" },
    { label: "No review", value: "not_required", icon: <BadgeCheck size={14} />, active: "bg-slate-600 text-white", base: "bg-white text-slate-500 border border-slate-200" },
];

const PAYMENT_OPTIONS: Array<{ label: string; value: ExpensePaymentStatus | "All" }> = [
    { label: "All", value: "All" },
    { label: "Unpaid", value: "unpaid" },
    { label: "Partially paid", value: "partially_paid" },
    { label: "Paid by you", value: "paid_by_creator" },
    { label: "Paid by partner", value: "paid_by_partner" },
    { label: "Paid by both", value: "paid_by_both" },
];

const CATEGORY_OPTIONS = ["All", "General", "Education", "Medical", "Housing", "Food", "Activities", "Clothing", "Transportation", "Other"];

const PAYMENT_METHOD_OPTIONS = [
    { label: "Cash", value: "cash" },
    { label: "Check", value: "check" },
    { label: "Credit Card", value: "credit_card" },
    { label: "Debit Card", value: "debit_card" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Mobile Payment", value: "mobile_payment" },
    { label: "Other", value: "other" },
] as const;

function parseAmount(value: string | number | null | undefined) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toMonthParam(monthIndex: number) {
    return String(monthIndex + 1).padStart(2, "0");
}

function normalizeApprovalStatus(item: ExpenseListItem): ExpenseApprovalStatus {
    if (item.approval_status) return item.approval_status;
    if (item.status === "pending" || item.status === "approved" || item.status === "rejected") return item.status;
    return item.bridge_mode ? "pending" : "not_required";
}

function formatDisplayName(value: string | null | undefined) {
    if (!value) return "Co-parent";

    const baseValue = value.includes("@") ? value.split("@")[0] : value;
    const withoutTrailingId = baseValue.replace(/([._-]?\d+)$/g, "");
    const normalized = withoutTrailingId.replace(/[._-]+/g, " ").trim();

    if (!normalized) return "Co-parent";

    return normalized
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function formatCurrency(value: number) {
    return `$${value.toFixed(2)}`;
}

function derivePercentage(share: string | number, amount: string) {
    const total = parseAmount(amount);
    if (total <= 0) return "50";
    return ((parseAmount(share) / total) * 100).toFixed(0);
}

function normalizeExpense(item: ExpenseListItem, role?: string): ExpenseCardItem {
    const approvalStatus = normalizeApprovalStatus(item);
    const shareFromRole = role === "mother"
        ? { your: item.mother_share, partner: item.father_share }
        : { your: item.father_share, partner: item.mother_share };
    const paymentStatus = item.payment_status ?? (item.status === "paid" ? "paid_by_creator" : "unpaid");
    return {
        id: item.id,
        title: item.title?.trim() || "Untitled Expense",
        amount: parseAmount(item.amount),
        category: item.category?.trim() || "General",
        visibility: item.visibility ?? (item.bridge_mode ? "shared" : "private"),
        approvalStatus,
        agreementStatus: item.agreement_status ?? "not_discussed",
        paymentStatus,
        settlementStatus: item.settlement_status ?? "not_applicable",
        date: item.paid_date || item.due_date || item.created_at.slice(0, 10),
        paidBy: paymentStatus === "paid_by_partner" ? "Partner" : paymentStatus === "paid_by_both" ? "Both" : "You",
        splitWith: formatDisplayName(item.co_parent?.name || item.co_parent?.email || "Co-parent"),
        childId: item.child,
        dueDate: item.due_date,
        description: item.description,
        yourShare: item.share?.your_share ?? shareFromRole.your ?? "0",
        coParentShare: item.share?.co_parent_share ?? shareFromRole.partner ?? "0",
        rejectionReason: item.rejection_reason ?? null,
        settlementAmount: item.outstanding_from_partner ?? item.outstanding_amount ?? (item.settlement_status === "outstanding" && paymentStatus === "paid_by_creator" ? item.share?.co_parent_share ?? shareFromRole.partner ?? null : null),
    };
}

type MarkPaidModalProps = {
    isOpen: boolean;
    expense: ExpenseCardItem | null;
    isPending: boolean;
    onClose: () => void;
    onSubmit: (payload: ExpenseMarkPaidPayload) => void;
};

function MarkPaidModal({ isOpen, expense, isPending, onClose, onSubmit }: MarkPaidModalProps) {
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<ExpenseMarkPaidPayload["payment_method"]>("bank_transfer");

    useEffect(() => {
        if (!isOpen || !expense) return;
        setAmount(Number(expense.yourShare).toFixed(2));
        setPaymentMethod("bank_transfer");
    }, [expense, isOpen]);

    if (!isOpen || !expense) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Mark Expense as Paid</h3>
                        <p className="text-sm text-slate-500">{expense.title}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!amount.trim() || isPending) return;
                        onSubmit({ amount, payment_method: paymentMethod });
                    }}
                    className="space-y-4"
                >
                    <EventFormField
                        id="mark-paid-amount"
                        label="Payment Amount"
                        value={amount}
                        onChange={setAmount}
                        type="number"
                    />
                    <p className="-mt-2 text-xs font-medium text-slate-500">
                        Prefilled with your share. You can edit this amount.
                    </p>
                    <EventFormField
                        id="mark-paid-method"
                        label="Payment Method"
                        value={paymentMethod}
                        onChange={(value) => setPaymentMethod(value as ExpenseMarkPaidPayload["payment_method"])}
                        options={PAYMENT_METHOD_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
                    />

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-2xl border border-slate-200 py-3 font-bold text-slate-600 transition-all hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!amount.trim() || isPending}
                            className="flex-1 rounded-2xl bg-linear-to-r from-emerald-500 to-sky-500 py-3 font-black text-white shadow-lg shadow-emerald-100 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPending ? "Saving..." : "Confirm Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ExpenseDashboard() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [paymentStatus, setPaymentStatus] = useState<ExpensePaymentStatus | "All">("All");
    const [category, setCategory] = useState("All");
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingExpense, setEditingExpense] = useState<ExpenseListItem | null>(null);
    const [payingExpense, setPayingExpense] = useState<ExpenseCardItem | null>(null);

    const monthParam = toMonthParam(month);
    const yearParam = String(year);

    const { data: expenseItems = [], isLoading, isError } = useExpenseListQuery();
    const { data: summary } = useExpenseSummaryQuery(monthParam, yearParam);
    console.log("summary states:",summary)
    const { data: bridgeChildren = [] } = useBridgeChildrenQuery();
    const { data: bridgeInfo } = useBridgeInfoQuery();
    const { data: profile } = useAuthProfileQuery();
    const viewerId = (profile as (typeof profile & { id?: number }) | undefined)?.id;

    const createExpense = useCreateExpenseMutation();
    const updateExpense = useUpdateExpenseMutation();
    const deleteExpense = useDeleteExpenseMutation();
    const markExpensePaid = useMarkExpensePaidMutation();
    const approveExpense = useApproveExpenseMutation();
    const rejectExpense = useRejectExpenseMutation();
    const reportOfflineAgreement = useOfflineAgreementMutation();
    const confirmAgreement = useConfirmAgreementMutation();
    const bridgeMode = bridgeInfo?.mode === "bridge";

    useEffect(() => {
        function handler(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        }

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const expenses = useMemo(() => expenseItems.map((item) => normalizeExpense(item, profile?.role)), [expenseItems, profile?.role]);

    const visible = useMemo(() => {
        return expenses.filter((expense) => {
            const haystack = `${expense.title} ${expense.category} ${expense.splitWith}`.toLowerCase();
            const matchSearch = haystack.includes(search.toLowerCase());
            const matchStatus = status === "All" || expense.approvalStatus === status;
            const matchPayment = paymentStatus === "All" || expense.paymentStatus === paymentStatus;
            const matchCategory = category === "All" || expense.category === category;
            return matchSearch && matchStatus && matchPayment && matchCategory;
        });
    }, [category, expenses, paymentStatus, search, status]);

    const total = parseAmount(summary?.total_expense ?? expenses.reduce((sum, expense) => sum + parseAmount(expense.amount), 0));
    const pending = parseAmount(summary?.pending_expense ?? expenses.filter((expense) => expense.approvalStatus === "pending").reduce((sum, expense) => sum + parseAmount(expense.amount), 0));
    const yourShare = parseAmount(summary?.your_expense ?? expenses.reduce((sum, expense) => sum + parseAmount(expense.yourShare), 0));
    const partnerShare = bridgeMode ? parseAmount(summary?.partner_total_expense ?? expenses.reduce((sum, expense) => sum + parseAmount(expense.coParentShare), 0)) : 0;
    const totalPaid = parseAmount(summary?.total_paid ?? 0);
    const partnerOutstanding = bridgeMode ? parseAmount(summary?.outstanding_from_partner ?? 0) : 0;

    function prevMonth() {
        if (month === 0) {
            setYear((value) => value - 1);
            setMonth(11);
            return;
        }
        setMonth((value) => value - 1);
    }

    function nextMonth() {
        if (month === 11) {
            setYear((value) => value + 1);
            setMonth(0);
            return;
        }
        setMonth((value) => value + 1);
    }

    function openCreateModal() {
        setEditingExpense(null);
        setModalMode("create");
        setIsExpenseModalOpen(true);
    }

    function openEditModal(expenseId: number) {
        const item = expenseItems.find((expense) => expense.id === expenseId);
        if (!item) return;
        setEditingExpense(item);
        setModalMode("edit");
        setIsExpenseModalOpen(true);
    }

    function handleSubmitExpense(payload: ExpenseUpsertPayload) {
        if (editingExpense) {
            updateExpense.mutate(
                { expenseId: editingExpense.id, payload },
                {
                    onSuccess: () => {
                        toast.success("Expense updated");
                        setEditingExpense(null);
                        setIsExpenseModalOpen(false);
                    },
                    onError: () => toast.error("Could not update expense"),
                },
            );
            return;
        }

        createExpense.mutate(payload, {
            onSuccess: () => {
                toast.success("Expense created");
                setIsExpenseModalOpen(false);
            },
            onError: () => toast.error("Could not create expense"),
        });
    }

    function handleDeleteExpense(expenseId: number) {
        if (!window.confirm("Delete this expense?")) return;

        deleteExpense.mutate(expenseId, {
            onSuccess: () => toast.success("Expense deleted"),
            onError: () => toast.error("Could not delete expense"),
        });
    }

    function handleMarkPaid(payload: ExpenseMarkPaidPayload) {
        if (!payingExpense) return;

        markExpensePaid.mutate(
            { expenseId: payingExpense.id, payload },
            {
                onSuccess: () => {
                    toast.success("Expense payment updated");
                    setPayingExpense(null);
                },
                onError: () => toast.error("Could not update payment status"),
            },
        );
    }

    function handleReviewAction(action: "approve" | "reject" | "confirm", expenseId: number) {
        if (action === "approve") {
            approveExpense.mutate({ expenseId }, { onSuccess: () => toast.success("Expense approved"), onError: () => toast.error("Could not approve expense") });
            return;
        }
        if (action === "confirm") {
            confirmAgreement.mutate({ expenseId }, { onSuccess: () => toast.success("Agreement confirmed"), onError: () => toast.error("Could not confirm agreement") });
            return;
        }
        const reason = window.prompt("Why are you rejecting this expense?");
        if (reason === null || !reason.trim()) return;
        rejectExpense.mutate({ expenseId, payload: { reason: reason.trim() } }, { onSuccess: () => toast.success("Expense rejected"), onError: () => toast.error("Could not reject expense") });
    }

    function handleReportOfflineAgreement(expenseId: number) {
        const note = window.prompt("Add a note about the offline agreement.");
        if (note === null || !note.trim()) return;
        reportOfflineAgreement.mutate({ expenseId, payload: { note: note.trim() } }, { onSuccess: () => toast.success("Agreement reported. Partner confirmation is pending."), onError: () => toast.error("Could not report agreement") });
    }

    const childOptions = useMemo(
        () => bridgeChildren.map((child) => ({ id: child.id, name: child.name })),
        [bridgeChildren],
    );

    const initialExpenseValue = useMemo(() => {
        if (!editingExpense) return undefined;

        return {
            childId: editingExpense.child ? String(editingExpense.child) : "",
            title: editingExpense.title ?? "",
            amount: String(editingExpense.amount),
            category: editingExpense.category ?? "General",
            paidDate: editingExpense.paid_date ?? "",
            dueDate: editingExpense.due_date ?? "",
            fatherPercentage: derivePercentage(editingExpense.father_share ?? editingExpense.share?.your_share ?? "0", String(editingExpense.amount)),
            motherPercentage: derivePercentage(editingExpense.mother_share ?? editingExpense.share?.co_parent_share ?? "0", String(editingExpense.amount)),
            description: editingExpense.description ?? "",
        };
    }, [editingExpense]);

    return (
        <div className="min-h-screen bg-[#EAF1FF]">
            <nav className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800">Expense Tracker</h1>
                        <p className="text-xs font-medium text-slate-400">{MONTH_NAMES[month]} {year}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => toast.info("Export is not wired yet.")}
                            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 sm:flex"
                        >
                            <Download size={16} /> Export
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-sky-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-violet-100 transition-all hover:opacity-90 active:scale-95"
                        >
                            <Plus size={18} /> Add Expense
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
                <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#705ADD] to-[#5BA4F5] p-8 shadow-2xl shadow-violet-200 md:p-10">
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-1/2 h-48 w-48 rounded-full bg-sky-400/20 blur-2xl" />

                    <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">Monthly Summary</p>
                            <h2 className="mt-1 text-4xl font-black text-white">{MONTH_NAMES[month]} {year}</h2>
                        </div>

                        <div className="relative" ref={pickerRef}>
                            <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/20 p-1">
                                <button onClick={prevMonth} className="rounded-xl p-2 text-white transition-colors hover:bg-white/20">
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setShowPicker((value) => !value)}
                                    className="whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
                                >
                                    {MONTH_NAMES[month].slice(0, 3)} {year}
                                </button>
                                <button onClick={nextMonth} className="rounded-xl p-2 text-white transition-colors hover:bg-white/20">
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {showPicker && (
                                <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-full z-20 mt-3 w-72 rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
                                    <div className="mb-4 flex items-center justify-between">
                                        <button onClick={() => setYear((value) => value - 1)} className="rounded-lg p-1.5 hover:bg-slate-100">
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="font-black text-slate-800">{year}</span>
                                        <button onClick={() => setYear((value) => value + 1)} className="rounded-lg p-1.5 hover:bg-slate-100">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MONTH_NAMES.map((name, index) => (
                                            <button
                                                key={name}
                                                onClick={() => {
                                                    setMonth(index);
                                                    setShowPicker(false);
                                                }}
                                                className={`rounded-xl py-2 text-sm font-bold transition-all ${index === month ? "bg-violet-500 text-white shadow-md shadow-violet-200" : "text-slate-600 hover:bg-slate-100"}`}
                                            >
                                                {name.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        <SummaryCard
                            gradient="from-[#7B62EE] via-[#88A9F0] to-[#9DDBF2]"
                            leftValue={formatCurrency(total)}
                            leftLabel="Total Expenses"
                            rightValue={formatCurrency(pending)}
                            rightLabel="Pending"
                            isAlert
                        />
                        <SummaryCard
                            gradient="from-[#C654DD] via-[#BA96F4] to-[#D8EDF8]"
                            leftValue={formatCurrency(yourShare)}
                            leftLabel="Your Share"
                            rightValue={formatCurrency(partnerShare)}
                            rightLabel="Co-parent's Share"
                        />
                        <SummaryCard
                            gradient="from-[#45B79A] via-[#8CCFB5] to-[#D8EDF8]"
                            leftValue={formatCurrency(totalPaid)}
                            leftLabel="Paid So Far"
                            rightValue={formatCurrency(partnerOutstanding)}
                            rightLabel="Partner Outstanding"
                        />
                    </div>
                </section>

                <div className="flex flex-col gap-4">
                    <div className="group relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500" />
                        <input
                            type="text"
                            placeholder="Search by title, category, or co-parent..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div>
                        <p className="mb-2 ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setStatus(option.value)}
                                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${status === option.value ? option.active : option.base}`}
                                >
                                    {option.icon} {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</p>
                        <div className="flex flex-wrap gap-2">
                            {PAYMENT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setPaymentStatus(option.value)}
                                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${paymentStatus === option.value ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600"}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</p>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setCategory(option)}
                                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${category === option ? "border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-100" : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-500"}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Transactions · {visible.length}</h3>
                        {(status !== "All" || paymentStatus !== "All" || category !== "All" || search) && (
                            <button
                                onClick={() => {
                                    setStatus("All");
                                    setPaymentStatus("All");
                                    setCategory("All");
                                    setSearch("");
                                }}
                                className="text-xs font-bold text-violet-500 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="rounded-4xl border border-slate-100 bg-white py-20 text-center text-sm font-semibold text-slate-500 shadow-sm">
                            Loading expenses...
                        </div>
                    ) : isError ? (
                        <div className="rounded-4xl border border-rose-100 bg-white py-20 text-center shadow-sm">
                            <h3 className="text-xl font-bold text-slate-800">Could not load expenses</h3>
                            <p className="mt-1 text-sm text-slate-500">Check your connection and try again.</p>
                        </div>
                    ) : visible.length > 0 ? (
                        <div className="space-y-2">
                            {visible.map((expense) => (
                                <ExpenseRow
                                    key={expense.id}
                                    expense={expense}
                                    isCreator={expenseItems.find((item) => item.id === expense.id)?.user === viewerId}
                                    bridgeMode={bridgeMode}
                                    onEdit={() => openEditModal(expense.id)}
                                    onDelete={() => handleDeleteExpense(expense.id)}
                                    onMarkPaid={() => setPayingExpense(expense)}
                                    onApprove={() => handleReviewAction("approve", expense.id)}
                                    onReject={() => handleReviewAction("reject", expense.id)}
                                    onReportOfflineAgreement={() => handleReportOfflineAgreement(expense.id)}
                                    onConfirmAgreement={() => handleReviewAction("confirm", expense.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-4xl border border-slate-100 bg-white py-20 text-center shadow-sm">
                            <div className="mb-4 text-6xl font-black text-violet-500 opacity-10">$</div>
                            <h3 className="text-xl font-bold text-slate-800">No Expenses Found</h3>
                            <p className="mb-8 mt-1 text-sm text-slate-500">Try adjusting your filters or add a new expense.</p>
                            <button
                                onClick={openCreateModal}
                                className="rounded-2xl bg-linear-to-r from-violet-500 to-sky-500 px-8 py-3 font-bold text-white shadow-xl shadow-violet-100 transition-all hover:opacity-90"
                            >
                                Add Expense
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <AddExpenseModal
                isOpen={isExpenseModalOpen}
                mode={modalMode}
                childOptions={childOptions}
                defaultChildId={bridgeChildren[0]?.id ?? null}
                initialValue={initialExpenseValue}
                isPending={createExpense.isPending || updateExpense.isPending}
                onClose={() => {
                    setEditingExpense(null);
                    setIsExpenseModalOpen(false);
                }}
                onSubmitExpense={handleSubmitExpense}
            />

            <MarkPaidModal
                isOpen={Boolean(payingExpense)}
                expense={payingExpense}
                isPending={markExpensePaid.isPending}
                onClose={() => setPayingExpense(null)}
                onSubmit={handleMarkPaid}
            />
        </div>
    );
}