"use client";

import React, { useMemo, useState } from 'react';
import { X, CalendarPlus, Edit3, Trash2, Clock, MapPin, CalendarDays, Repeat, Bell } from 'lucide-react';
import { EventFormField } from '@/components/ui/EventFormField';
import type { EventType, EventUpsertPayload, RepeatMode } from '@/types/calendar.type';
import type { BridgeChild } from '@/hooks/useBridge';

export type { EventUpsertPayload };

type AddEventModalMode = 'create' | 'view' | 'edit';

type AddEventModalProps = {
  isOpen: boolean;
  mode?: AddEventModalMode;
  defaultDate: Date;
  childOptions: BridgeChild[];
  defaultChildId?: number | null;
  initialEvent?: EventUpsertPayload | null;
  allowEditing?: boolean;
  allowDeleting?: boolean;
  onClose: () => void;
  onSubmitEvent: (payload: EventUpsertPayload) => void;
  onDeleteEvent?: () => void;
  isPending?: boolean;
};

const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toApiTime = (value: string) => {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
};

const toTimeInputValue = (value?: string | null) => (value ?? '').slice(0, 5);

const getTodayDateValue = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isPastDay = (dateValue: string | null | undefined) => {
  if (!dateValue) return false;
  const candidate = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(candidate.getTime()) ? false : candidate < today;
};

const clampToTodayIfNeeded = (date: Date, mode: AddEventModalMode) => {
  if (mode !== 'create') return date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today ? today : date;
};

const EVENT_TYPES: { label: string; value: EventType }[] = [
  { label: 'Activity', value: 'activity' },
  { label: 'School', value: 'school' },
  { label: 'Custody', value: 'custody' },
  { label: 'Medical', value: 'medical' },
  { label: 'Other', value: 'other' },
];

const REPEAT_MODES: { label: string; value: RepeatMode }[] = [
  { label: 'Once', value: 'once' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
];

function getChildLabel(childOptions: BridgeChild[], childId: string) {
  return childOptions.find((child) => String(child.id) === childId)?.name ?? 'Unknown Child';
}

type EventFormState = {
  selectedChildId: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  repeat: RepeatMode;
  customStart: string;
  customEnd: string;
  reminderMinutes: string;
  description: string;
};

function buildInitialState(
  initialEvent: EventUpsertPayload | null,
  defaultDate: Date,
  childOptions: BridgeChild[],
  defaultChildId: number | null,
  mode: AddEventModalMode,
): EventFormState {
  const fallbackChildId = initialEvent?.child ?? null;
  const safeDefaultDate = clampToTodayIfNeeded(defaultDate, mode);
  return {
    selectedChildId: fallbackChildId ? String(fallbackChildId) : '',
    title: initialEvent?.title ?? '',
    type: initialEvent?.type ?? 'activity',
    date: initialEvent?.date ?? toDateInputValue(safeDefaultDate),
    startTime: toTimeInputValue(initialEvent?.start_time),
    endTime: toTimeInputValue(initialEvent?.end_time),
    allDay: initialEvent ? !(initialEvent.start_time || initialEvent.end_time) : false,
    location: initialEvent?.location ?? '',
    repeat: initialEvent?.repeat ?? 'once',
    customStart: initialEvent?.custom_start_date ?? '',
    customEnd: initialEvent?.custom_end_date ?? '',
    reminderMinutes: String(initialEvent?.reminder_minutes ?? 30),
    description: initialEvent?.description ?? '',
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

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  mode = 'create',
  defaultDate,
  childOptions,
  defaultChildId = null,
  initialEvent = null,
  allowEditing = true,
  allowDeleting = false,
  onClose,
  onSubmitEvent,
  onDeleteEvent,
  isPending = false,
}) => {
  const [formState, setFormState] = useState(() =>
    buildInitialState(initialEvent, defaultDate, childOptions, defaultChildId, mode),
  );
  const [isEditing, setIsEditing] = useState(mode !== 'view');
  const minDate = getTodayDateValue();
  const hasPastDate = isPastDay(formState.date);

  const canSubmit = useMemo(() => {
    if (!formState.title.trim() || !formState.date || !formState.selectedChildId) return false;
    if (hasPastDate) return false;
    if (formState.repeat === 'custom') return Boolean(formState.customStart && formState.customEnd);
    return true;
  }, [formState, hasPastDate]);

  const resetToInitialState = () => {
    setFormState(buildInitialState(initialEvent, defaultDate, childOptions, defaultChildId, mode));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasPastDate || !canSubmit || isPending) return;

    const payload: EventUpsertPayload = {
      child: parseInt(formState.selectedChildId, 10),
      title: formState.title.trim(),
      type: formState.type,
      date: formState.date || null,
      start_time: formState.allDay ? null : toApiTime(formState.startTime),
      end_time: formState.allDay ? null : toApiTime(formState.endTime),
      location: formState.location.trim() || null,
      repeat: formState.repeat,
      custom_start_date: formState.repeat === 'custom' ? formState.customStart || null : null,
      custom_end_date: formState.repeat === 'custom' ? formState.customEnd || null : null,
      reminder_minutes: parseInt(formState.reminderMinutes, 10) || 0,
      description: formState.description.trim() || null,
    };

    onSubmitEvent(payload);
  };

  if (!isOpen) return null;

  const headerTitle = mode === 'create' ? 'Add Event' : isEditing ? 'Edit Event' : 'Event Details';
  const headerText = mode === 'create'
    ? 'Add to your family calendar'
    : isEditing
      ? 'Update this calendar event'
      : 'Review this calendar event before editing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/70 bg-linear-to-br from-white via-[#F8FAFF] to-[#EEF6FF] shadow-2xl shadow-slate-900/20">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
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
            aria-label="Close event modal"
          >
            <X size={18} />
          </button>
        </div>

        {!isEditing && initialEvent ? (
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-3xl bg-white/80 p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Title</p>
              <h4 className="mt-2 text-2xl font-black text-slate-800">{formState.title}</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
                  {formState.type}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {formState.repeat}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow icon={<CalendarDays size={16} />} label="Date" value={formState.date || 'Not set'} />
              <DetailRow icon={<Clock size={16} />} label="Time" value={formState.startTime || formState.endTime ? `${formState.startTime || '--:--'} - ${formState.endTime || '--:--'}` : 'All Day'} />
              <DetailRow icon={<MapPin size={16} />} label="Location" value={formState.location || 'No location'} />
              <DetailRow icon={<Bell size={16} />} label="Reminder" value={`${formState.reminderMinutes || '0'} minutes before`} />
              <DetailRow icon={<Repeat size={16} />} label="Child" value={getChildLabel(childOptions, formState.selectedChildId)} />
              <DetailRow icon={<Repeat size={16} />} label="Repeat" value={formState.repeat} />
            </div>

            {formState.repeat === 'custom' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailRow icon={<CalendarDays size={16} />} label="Custom Start" value={formState.customStart || 'Not set'} />
                <DetailRow icon={<CalendarDays size={16} />} label="Custom End" value={formState.customEnd || 'Not set'} />
              </div>
            )}

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
                  onClick={onDeleteEvent}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
                >
                  <span className="inline-flex items-center gap-2"><Trash2 size={15} /> Delete</span>
                </button>
              )}
              {allowEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-600"
                >
                  <span className="inline-flex items-center gap-2"><Edit3 size={15} /> Edit</span>
                </button>
              )}
            </div>
          </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <EventFormField
                id="event-child"
                label="Child"
                value={formState.selectedChildId}
                onChange={(value) => setFormState((current) => ({ ...current, selectedChildId: value }))}
                options={[
                  { label: 'Select Child', value: '' },
                  ...childOptions.map((child) => ({ label: child.name, value: String(child.id) }))
                ]}
              />

              <EventFormField
                id="event-title"
                label="Event Title"
                value={formState.title}
                onChange={(value) => setFormState((current) => ({ ...current, title: value }))}
                placeholder="e.g., Pickup at School"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <EventFormField
                  id="event-type"
                  label="Type"
                  value={formState.type}
                  onChange={(value) => setFormState((current) => ({ ...current, type: value as EventType }))}
                  options={EVENT_TYPES}
                />
                <EventFormField
                  id="event-repeat"
                  label="Repeat"
                  value={formState.repeat}
                  onChange={(value) => setFormState((current) => ({ ...current, repeat: value as RepeatMode }))}
                  options={REPEAT_MODES}
                />
              </div>

              <EventFormField
                id="event-date"
                label="Date"
                type="date"
                value={formState.date}
                min={minDate}
                onChange={(value) => setFormState((current) => ({ ...current, date: value }))}
              />
              {hasPastDate && (
                <p className="text-xs font-semibold text-rose-500">Please choose today or a future date.</p>
              )}

              <div className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  id="event-all-day"
                  onClick={() => setFormState((current) => ({ ...current, allDay: !current.allDay }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    formState.allDay ? 'bg-indigo-500' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={formState.allDay}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formState.allDay ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <label htmlFor="event-all-day" className="text-sm font-bold text-slate-600 cursor-pointer select-none">
                  All Day Event
                </label>
              </div>

              {!formState.allDay && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EventFormField
                    id="event-start-time"
                    label="Start Time"
                    type="time"
                    value={formState.startTime}
                    onChange={(value) => setFormState((current) => ({ ...current, startTime: value }))}
                  />
                  <EventFormField
                    id="event-end-time"
                    label="End Time"
                    type="time"
                    value={formState.endTime}
                    onChange={(value) => setFormState((current) => ({ ...current, endTime: value }))}
                  />
                </div>
              )}

              {formState.repeat === 'custom' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EventFormField
                    id="event-custom-start"
                    label="Custom Start"
                    type="date"
                    value={formState.customStart}
                    onChange={(value) => setFormState((current) => ({ ...current, customStart: value }))}
                  />
                  <EventFormField
                    id="event-custom-end"
                    label="Custom End"
                    type="date"
                    value={formState.customEnd}
                    onChange={(value) => setFormState((current) => ({ ...current, customEnd: value }))}
                  />
                </div>
              )}

              <EventFormField
                id="event-location"
                label="Location"
                value={formState.location}
                onChange={(value) => setFormState((current) => ({ ...current, location: value }))}
                placeholder="e.g., School Hall"
              />

              <EventFormField
                id="event-reminder"
                label="Reminder (minutes before)"
                type="number"
                value={formState.reminderMinutes}
                onChange={(value) => setFormState((current) => ({ ...current, reminderMinutes: value }))}
                placeholder="30"
              />

              <EventFormField
                id="event-description"
                label="Description"
                value={formState.description}
                onChange={(value) => setFormState((current) => ({ ...current, description: value }))}
                placeholder="Optional notes..."
              />

              <div className="mt-2 flex items-center justify-end gap-3 pt-2">
                {!childOptions.length && (
                  <p className="mr-auto text-xs font-semibold text-rose-500">
                    Add a child in Bridge mode first to create events.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'view' && initialEvent) {
                      resetToInitialState();
                      setIsEditing(false);
                      return;
                    }
                    onClose();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {mode === 'view' && initialEvent ? 'Back' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || isPending}
                  className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all enabled:hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isPending ? 'Saving…' : mode === 'create' ? 'Save Event' : 'Update Event'}
                </button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
};
