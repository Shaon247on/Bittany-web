import React from 'react';
import { BadgeCheck, CheckCircle2, Pencil, ReceiptText, Trash2, XCircle } from 'lucide-react';
import type { ExpenseCardItem } from '@/types/expense.type';

type ExpenseRowProps = {
  expense: ExpenseCardItem;
  isCreator: boolean;
  bridgeMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReportOfflineAgreement: () => void;
  onConfirmAgreement: () => void;
};

function label(value: string) {
  return value.replaceAll('_', ' ');
}

function approvalLabel(expense: ExpenseCardItem) {
  if (expense.approvalStatus === 'pending') {
    return expense.agreementStatus === 'reported_agreed_offline'
      ? 'Agreement reported offline'
      : 'Waiting for partner';
  }
  if (expense.approvalStatus === 'not_required') return null;
  return label(expense.approvalStatus);
}

function paymentLabel(paymentStatus: ExpenseCardItem['paymentStatus']) {
  const labels: Record<ExpenseCardItem['paymentStatus'], string> = {
    unpaid: 'Unpaid',
    partially_paid: 'Partially paid',
    paid_by_creator: 'Paid by you',
    paid_by_partner: 'Paid by partner',
    paid_by_both: 'Paid by both',
  };
  return labels[paymentStatus];
}

export const ExpenseRow = ({
  expense,
  isCreator,
  bridgeMode,
  onEdit,
  onDelete,
  onMarkPaid,
  onApprove,
  onReject,
  onReportOfflineAgreement,
  onConfirmAgreement,
}: ExpenseRowProps) => {
  const hasOutstandingBalance = expense.settlementStatus === 'outstanding' || expense.settlementStatus === 'partially_settled';
  const needsPayment = expense.paymentStatus === 'unpaid' || expense.paymentStatus === 'partially_paid';
  const pendingReview = expense.approvalStatus === 'pending';
  const reportedOffline = expense.agreementStatus === 'reported_agreed_offline';

  return (
  <div className="group mb-3 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-sky-100 hover:shadow-xl lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-start gap-4">
      <div className="rounded-xl bg-sky-50 p-3 text-sky-500 transition-colors group-hover:bg-sky-500 group-hover:text-white">
        <ReceiptText size={24} />
      </div>
      <div className="min-w-0">
        <h4 className="truncate font-bold text-slate-800">{expense.title}</h4>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {expense.category} • {expense.date}
          {expense.dueDate ? ` • Due ${expense.dueDate}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{expense.visibility === 'private' ? 'Private' : 'Shared'}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Co-parent: {expense.splitWith}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Your share: ${Number(expense.yourShare || 0).toFixed(2)}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Partner share: ${Number(expense.coParentShare || 0).toFixed(2)}</span>
          {approvalLabel(expense) && (
            <span className={`rounded-full px-2.5 py-1 ${expense.approvalStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : expense.approvalStatus === 'approved' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
              Review: {approvalLabel(expense)}
            </span>
          )}
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Payment: {paymentLabel(expense.paymentStatus)}</span>
          {expense.settlementStatus !== 'not_applicable' && (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
              Settlement: {expense.settlementAmount != null ? `Partner owes $${Number(expense.settlementAmount).toFixed(2)}` : label(expense.settlementStatus)}
            </span>
          )}
        </div>
        {reportedOffline && (
          <p className="mt-2 text-xs font-semibold text-amber-700">Partner confirmation pending</p>
        )}
        {expense.rejectionReason && (
          <p className="mt-2 text-xs text-rose-700">Reason: {expense.rejectionReason}</p>
        )}
      </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:gap-6">
      <div className="text-left sm:text-right">
        <p className="text-lg font-black text-slate-900">${Number(expense.amount).toFixed(2)}</p>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${expense.visibility === 'private' ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-sky-700'}`}>
          {expense.visibility}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {bridgeMode && !isCreator && pendingReview && !reportedOffline && (
          <>
            <button type="button" onClick={onApprove} className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100">
              <BadgeCheck size={14} /> Approve
            </button>
            <button type="button" onClick={onReject} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
              <XCircle size={14} /> Reject
            </button>
          </>
        )}
        {bridgeMode && !isCreator && reportedOffline && (
          <button type="button" onClick={onConfirmAgreement} className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100">
            <BadgeCheck size={14} /> Confirm agreement
          </button>
        )}
        {bridgeMode && isCreator && pendingReview && !reportedOffline && (
          <button type="button" onClick={onReportOfflineAgreement} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100">
            Report offline agreement
          </button>
        )}
        {needsPayment && (hasOutstandingBalance || expense.settlementStatus === 'not_applicable' || expense.visibility === 'private') && (
          <button
            type="button"
            onClick={onMarkPaid}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <CheckCircle2 size={14} /> Mark Paid
          </button>
        )}
        {isCreator && (
          <>
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50">
              <Pencil size={14} /> Edit
            </button>
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100">
              <Trash2 size={14} /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  </div>
  );
};