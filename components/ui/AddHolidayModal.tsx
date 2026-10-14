"use client";

import React, { useMemo, useState } from 'react';
import { X, CalendarPlus, Edit3, Trash2, MapPin, CalendarDays, Bell } from 'lucide-react';
import { EventFormField } from '@/components/ui/EventFormField';
import type { HolidayItem, HolidayUpsertPayload } from '@/types/calendar.type';
import type { BridgeChild } from '@/hooks/useBridge';

type AddHolidayModalMode = 'create' | 'view' | 'edit';

type AddHolidayModalProps = {
  isOpen: boolean;
  mode?: AddHolidayModalMode;
  defaultDate: Date;
  childOptions: BridgeChild[];
  initialHoliday?: HolidayItem | null;
  allowEditing?: boolean;
  allowDeleting?: boolean;
  onClose: () => void;
  onSubmitHoliday: (payload: HolidayUpsertPayload) => void;
  onDeleteHoliday?: () => void;
  isPending?: boolean;
};

const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function getChildLabel(childOptions: BridgeChild[], childId: number | null) {
  if (!childId) return 'All Children';
  return childOptions.find((child) => child.id === childId)?.name ?? 'Unknown Child';
}

type HolidayFormState = {
  selectedChildId: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  assignedTo: string;
  description: string;
};

function buildInitialState(
  initialHoliday: HolidayItem | null,
  defaultDate: Date,
): HolidayFormState {
  return {
    selectedChildId: initialHoliday?.child ? String(initialHoliday.child) : '',
    name: initialHoliday?.name ?? '',
    startDate: initialHoliday?.start_date ?? toDateInputValue(defaultDate),
    endDate: initialHoliday?.end_date ?? toDateInputValue(defaultDate),
    location: initialHoliday?.location ?? '',
    assignedTo: initialHoliday?.assigned_to ?? '',
    description: initialHoliday?.description ?? '',
  };
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

export const AddHolidayModal: React.FC<AddHolidayModalProps> = ({
  isOpen,
  mode = 'create',
  defaultDate,
  childOptions,
  initialHoliday = null,
  allowEditing = true,
  allowDeleting = false,
  onClose,
  onSubmitHoliday,
  onDeleteHoliday,
  isPending = false,
}) => {
  const [formState, setFormState] = useState(() =>
    buildInitialState(initialHoliday, defaultDate),
  );
  const [isEditing, setIsEditing] = useState(mode !== 'view');

  const canSubmit = useMemo(() => {
    return Boolean(formState.name.trim() && formState.startDate && formState.endDate);
  }, [formState]);

  const resetToInitialState = () => {
    setFormState(buildInitialState(initialHoliday, defaultDate));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || isPending) return;

    const payload: HolidayUpsertPayload = {
      child: formState.selectedChildId ? parseInt(formState.selectedChildId, 10) : null,
      name: formState.name.trim(),
      start_date: formState.startDate,
      end_date: formState.endDate,
      assigned_to: formState.assignedTo.trim() || null,
      location: formState.location.trim() || null,
      description: formState.description.trim() || null,
    };

    onSubmitHoliday(payload);
  };

  if (!isOpen) return null;

  const headerTitle = mode === 'create' ? 'Add Holiday' : isEditing ? 'Edit Holiday' : 'Holiday Details';
  const headerText = mode === 'create'
    ? 'Add a holiday to your family calendar'
    : isEditing
      ? 'Update this holiday details'
      : 'Review this holiday detail';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/70 bg-linear-to-br from-white via-[#FFFDF9] to-[#FFF9EE] shadow-2xl shadow-slate-900/20">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
              <CalendarPlus size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">{headerTitle}</h3>
              <p className="text-xs font-medium text-slate-500">{headerText}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close holiday modal"
          >
            <X size={18} />
          </button>
        </div>

        {!isEditing && initialHoliday ? (
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-3xl bg-white/80 p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Holiday Name</p>
              <h4 className="mt-2 text-2xl font-black text-slate-800">{formState.name}</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
                  {getChildLabel(childOptions, initialHoliday.child)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow icon={<CalendarDays size={16} />} label="Start Date" value={formState.startDate} />
              <DetailRow icon={<CalendarDays size={16} />} label="End Date" value={formState.endDate} />
              <DetailRow icon={<MapPin size={16} />} label="Location" value={formState.location || 'No location'} />
              <DetailRow icon={<Bell size={16} />} label="Assigned To" value={formState.assignedTo || 'Unassigned'} />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white/70 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Description</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{formState.description || 'No description provided.'}</p>
            </div>

            <div className="mt-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
              {allowDeleting && (
                <button
                  type="button"
                  onClick={onDeleteHoliday}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
                >
                  <span className="inline-flex items-center gap-2"><Trash2 size={15} /> Delete</span>
                </button>
              )}
              {allowEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-600"
                >
                  <span className="inline-flex items-center gap-2"><Edit3 size={15} /> Edit</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            <EventFormField
              id="holiday-child"
              label="Child (Optional)"
              value={formState.selectedChildId}
              onChange={(value) => setFormState((current) => ({ ...current, selectedChildId: value }))}
              options={[
                { label: 'All Children', value: '' },
                ...childOptions.map((child) => ({ label: child.name, value: String(child.id) }))
              ]}
            />

            <EventFormField
              id="holiday-name"
              label="Holiday Name"
              value={formState.name}
              onChange={(value) => setFormState((current) => ({ ...current, name: value }))}
              placeholder="e.g., Summer Vacation"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EventFormField
                id="holiday-start-date"
                label="Start Date"
                type="date"
                value={formState.startDate}
                onChange={(value) => setFormState((current) => ({ ...current, startDate: value }))}
              />
              <EventFormField
                id="holiday-end-date"
                label="End Date"
                type="date"
                value={formState.endDate}
                onChange={(value) => setFormState((current) => ({ ...current, endDate: value }))}
              />
            </div>

            <EventFormField
              id="holiday-location"
              label="Location"
              value={formState.location}
              onChange={(value) => setFormState((current) => ({ ...current, location: value }))}
              placeholder="e.g., Grand Canyon"
            />

            <EventFormField
              id="holiday-assigned"
              label="Assigned To (Optional)"
              value={formState.assignedTo}
              onChange={(value) => setFormState((current) => ({ ...current, assignedTo: value }))}
              placeholder="e.g., Mom / Dad"
            />

            <EventFormField
              id="holiday-description"
              label="Description"
              value={formState.description}
              onChange={(value) => setFormState((current) => ({ ...current, description: value }))}
              placeholder="Optional notes..."
            />

            <div className="mt-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'view' && initialHoliday) {
                    resetToInitialState();
                    setIsEditing(false);
                    return;
                  }
                  onClose();
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                {mode === 'view' && initialHoliday ? 'Back' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isPending}
                className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all enabled:hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isPending ? 'Saving…' : mode === 'create' ? 'Save Holiday' : 'Update Holiday'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
