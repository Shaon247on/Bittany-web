"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DollarSign, X } from "lucide-react";
import { EventFormField } from "./EventFormField";
import type { ExpenseUpsertPayload } from "@/types/expense.type";

export type ExpenseModalMode = "create" | "edit";

type ChildOption = {
  id: number;
  name: string;
};

type ExpenseFormState = {
  childId: string;
  title: string;
  amount: string;
  category: string;
  paidDate: string;
  dueDate: string;
  fatherPercentage: string;
  motherPercentage: string;
  description: string;
};

interface Props {
  isOpen: boolean;
  mode?: ExpenseModalMode;
  childOptions?: ChildOption[];
  defaultChildId?: number | null;
  initialValue?: Partial<ExpenseFormState>;
  isPending?: boolean;
  onClose: () => void;
  onSubmitExpense: (payload: ExpenseUpsertPayload) => void;
}

const CATEGORIES = [
  "General",
  "Education",
  "Medical",
  "Housing",
  "Food",
  "Activities",
  "Clothing",
  "Transportation",
  "Other",
];

function buildInitialState(defaultChildId?: number | null, initialValue?: Partial<ExpenseFormState>): ExpenseFormState {
  return {
    childId:
      initialValue?.childId ??
      (typeof defaultChildId === "number" ? String(defaultChildId) : ""),
    title: initialValue?.title ?? "",
    amount: initialValue?.amount ?? "",
    category: initialValue?.category ?? "General",
    paidDate: initialValue?.paidDate ?? new Date().toISOString().slice(0, 10),
    dueDate: initialValue?.dueDate ?? "",
    fatherPercentage: initialValue?.fatherPercentage ?? "50",
    motherPercentage: initialValue?.motherPercentage ?? "50",
    description: initialValue?.description ?? "",
  };
}

export function AddExpenseModal({
  isOpen,
  mode = "create",
  childOptions = [],
  defaultChildId = null,
  initialValue,
  isPending = false,
  onClose,
  onSubmitExpense,
}: Props) {
  const [form, setForm] = useState<ExpenseFormState>(() => buildInitialState(defaultChildId, initialValue));

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialState(defaultChildId, initialValue));
  }, [defaultChildId, initialValue, isOpen]);

  const childSelectOptions = useMemo(
    () => [
      { label: childOptions.length > 0 ? "Select child" : "No child available", value: "" },
      ...childOptions.map((child) => ({ label: child.name, value: String(child.id) })),
    ],
    [childOptions],
  );

  if (!isOpen) return null;

  const set = (field: keyof ExpenseFormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePercentageChange = (field: "fatherPercentage" | "motherPercentage") => (value: string) => {
    const parsed = parseFloat(value);
    const otherField = field === "fatherPercentage" ? "motherPercentage" : "fatherPercentage";
    
    if (isNaN(parsed)) {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
      return;
    }

    const otherVal = 100 - parsed;
    const boundedOther = Math.min(100, Math.max(0, otherVal));
    const roundedOther = Math.round(boundedOther * 100) / 100;

    setForm((prev) => ({
      ...prev,
      [field]: value,
      [otherField]: String(roundedOther),
    }));
  };

  const canSubmit =
    Boolean(form.title.trim()) &&
    Boolean(form.amount.trim()) &&
    Number(form.amount) > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || isPending) return;

    onSubmitExpense({
      child: form.childId ? Number(form.childId) : null,
      title: form.title.trim(),
      paid_date: form.paidDate || null,
      due_date: form.dueDate || null,
      amount: form.amount.trim(),
      category: form.category || null,
      father_percentage: form.fatherPercentage.trim() || "0",
      mother_percentage: form.motherPercentage.trim() || "0",
      description: form.description.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-linear-to-r from-violet-500 to-sky-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2">
              <DollarSign size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {mode === "edit" ? "Edit Expense" : "Add Expense"}
              </h2>
              <p className="text-xs text-white/70">
                {mode === "edit" ? "Update the shared expense details" : "Log a new shared expense"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <EventFormField
              id="expense-child"
              label="Child"
              value={form.childId}
              onChange={set("childId")}
              options={childSelectOptions}
            />
            <EventFormField
              id="expense-title"
              label="Expense Title"
              value={form.title}
              onChange={set("title")}
              placeholder="School fee, doctor visit..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EventFormField
              id="expense-amount"
              label="Amount"
              value={form.amount}
              onChange={set("amount")}
              placeholder="0.00"
              type="number"
            />
            <EventFormField
              id="expense-category"
              label="Category"
              value={form.category}
              onChange={set("category")}
              options={CATEGORIES.map((category) => ({ label: category, value: category }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EventFormField
              id="expense-paid-date"
              label="Paid Date"
              value={form.paidDate}
              onChange={set("paidDate")}
              type="date"
            />
            <EventFormField
              id="expense-due-date"
              label="Due Date"
              value={form.dueDate}
              onChange={set("dueDate")}
              type="date"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EventFormField
              id="expense-father-share"
              label="Father %"
              value={form.fatherPercentage}
              onChange={handlePercentageChange("fatherPercentage")}
              type="number"
            />
            <EventFormField
              id="expense-mother-share"
              label="Mother %"
              value={form.motherPercentage}
              onChange={handlePercentageChange("motherPercentage")}
              type="number"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) => set("description")(event.target.value)}
              placeholder="Add any supporting details for this expense..."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>

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
              disabled={!canSubmit || isPending}
              className="flex-1 rounded-2xl bg-linear-to-r from-violet-500 to-sky-500 py-3 font-black text-white shadow-lg shadow-violet-100 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving..." : mode === "edit" ? "Update Expense" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
