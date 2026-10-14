"use client";

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCalendar } from '@/hooks/useCalendar';
import { useBridgeChildrenQuery } from '@/hooks/useBridge';
import {
    useCalendarData,
    useCreateEventMutation,
    useDeleteEventMutation,
    useUpdateEventMutation,
    useCreateHolidayMutation,
    useUpdateHolidayMutation,
    useDeleteHolidayMutation,
} from '@/hooks/useEvent';
import { MonthView } from '@/components/modules/calendar/MonthView';
import { WeekView } from '@/components/modules/calendar/WeekView';
import { DayView } from '@/components/modules/calendar/DayView';
import { CustodyView } from '@/components/modules/calendar/CustodyView';
import { HolidayView } from '@/components/modules/calendar/HolidayView';
import { DayEventsList } from '@/components/modules/calendar/DayEventsList';
import { AddEventModal } from '@/components/ui/AddEventModal';
import { AddHolidayModal } from '@/components/ui/AddHolidayModal';
import type { CalendarEvent, EventReadItem, EventUpsertPayload, HolidayItem, HolidayUpsertPayload } from '@/types/calendar.type';

// ── Normalise API items to the UI CalendarEvent shape ──────────────────────
function eventToCalendarEvents(e: EventReadItem): CalendarEvent[] {
    const category: CalendarEvent['category'] =
        e.type === 'activity'
            ? 'Activity'
            : e.type === 'school'
                ? 'School'
                : e.type === 'custody'
                    ? 'Custody'
                    : e.type === 'medical'
                        ? 'Medical'
                        : 'Other';
    const time = e.start_time ? e.start_time.slice(0, 5) : undefined;

    const occurrenceDates = new Set<string>();

    if (e.date) occurrenceDates.add(e.date);
    for (const date of e.previous_occurrences ?? []) {
        if (date) occurrenceDates.add(date);
    }
    for (const date of e.occurrences ?? []) {
        if (date) occurrenceDates.add(date);
    }

    const baseEvent = {
        sourceId: e.id,
        sourceKind: 'event' as const,
        title: e.title,
        category,
        time,
        childId: e.child?.id ?? null,
        type: e.type,
        startTime: e.start_time,
        endTime: e.end_time,
        location: e.location,
        repeat: e.repeat,
        customStartDate: e.custom_start_date,
        customEndDate: e.custom_end_date,
        reminderMinutes: e.reminder_minutes,
        description: e.description,
    };

    if (occurrenceDates.size === 0) {
        return [
            {
                id: String(e.id),
                date: new Date(),
                ...baseEvent,
            },
        ];
    }

    return Array.from(occurrenceDates).map((date) => ({
        id: `${e.id}:${date}`,
        date: new Date(date),
        ...baseEvent,
    }));
}

function holidayToCalendarEvent(h: HolidayItem): CalendarEvent {
    return {
        id: `h-${h.id}`,
        sourceId: h.id,
        sourceKind: 'holiday',
        title: h.name,
        date: new Date(h.start_date),
        category: 'Holiday',
    };
}

export default function SharedCalendar() {
    const {
        activeTab, setActiveTab, selectedDate, setSelectedDate, calendarDays,
        handleNextMonth, handlePrevMonth, handleNextDay, handlePrevDay,
        monthName, year,
    } = useCalendar();

    const [isAddEventOpen, setIsAddEventOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create');
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
    const [holidayModalMode, setHolidayModalMode] = useState<'create' | 'view' | 'edit'>('create');
    const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
    const { data: bridgeChildren = [] } = useBridgeChildrenQuery();

    const { events: apiEvents, holidays: apiHolidays, isLoading } = useCalendarData();

    const createEvent = useCreateEventMutation();
    const updateEvent = useUpdateEventMutation();
    const deleteEvent = useDeleteEventMutation();

    const createHoliday = useCreateHolidayMutation();
    const updateHoliday = useUpdateHolidayMutation();
    const deleteHoliday = useDeleteHolidayMutation();
    const primaryChildId = bridgeChildren[0]?.id ?? null;

    const events: CalendarEvent[] = useMemo(
        () => [
            ...apiEvents.flatMap(eventToCalendarEvents),
            ...apiHolidays.map(holidayToCalendarEvent),
        ],
        [apiEvents, apiHolidays],
    );

    const filteredEvents = useMemo(
        () => events.filter((e) => e.date.toDateString() === selectedDate.toDateString()),
        [events, selectedDate],
    );

    const custodyEvents = useMemo(
        () => events.filter((e) => e.category === 'Custody'),
        [events],
    );

    const filteredCustodyEvents = useMemo(
        () => custodyEvents.filter((e) => e.date.toDateString() === selectedDate.toDateString()),
        [custodyEvents, selectedDate],
    );

    const holidayEvents = useMemo(
        () => events.filter((e) => e.category === 'Holiday'),
        [events],
    );

    const filteredHolidayEvents = useMemo(
        () => holidayEvents.filter((e) => e.date.toDateString() === selectedDate.toDateString()),
        [holidayEvents, selectedDate],
    );

    const isPastDate = (date: Date) => {
        const candidate = new Date(date);
        candidate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return candidate < today;
    };

    const handleCreateEventClick = () => {
        if (isPastDate(selectedDate)) {
            toast.error("Events can't be on previous or past days.");
            return;
        }

        setEditingEvent(null);
        setModalMode('create');
        setIsAddEventOpen(true);
    };

    const handleDeleteEvent = (event: CalendarEvent) => {
        if (event.sourceKind === 'holiday') {
            deleteHoliday.mutate(event.sourceId);
            return;
        }
        if (event.sourceKind !== 'event') return;
        deleteEvent.mutate(event.sourceId);
    };

    const handleOpenEvent = (event: CalendarEvent) => {
        if (event.sourceKind === 'holiday') {
            const hol = apiHolidays.find(h => h.id === event.sourceId);
            if (hol) {
                setEditingHoliday(hol);
                setHolidayModalMode('view');
                setIsAddHolidayOpen(true);
            }
            return;
        }
        setEditingEvent(event);
        setModalMode('view');
        setIsAddEventOpen(true);
    };

    const handleEditEvent = (event: CalendarEvent) => {
        if (event.sourceKind === 'holiday') {
            const hol = apiHolidays.find(h => h.id === event.sourceId);
            if (hol) {
                setEditingHoliday(hol);
                setHolidayModalMode('edit');
                setIsAddHolidayOpen(true);
            }
            return;
        }
        if (event.sourceKind !== 'event') return;
        setEditingEvent(event);
        setModalMode('edit');
        setIsAddEventOpen(true);
    };

    const handleSubmitEvent = (payload: EventUpsertPayload) => {
        if (editingEvent?.sourceKind === 'event') {
            updateEvent.mutate(
                { id: editingEvent.sourceId, payload },
                {
                    onSuccess: () => {
                        if (payload.date) setSelectedDate(new Date(payload.date));
                        setEditingEvent(null);
                        setIsAddEventOpen(false);
                    },
                },
            );
            return;
        }

        createEvent.mutate(payload, {
            onSuccess: () => {
                if (payload.date) setSelectedDate(new Date(payload.date));
                setEditingEvent(null);
                setModalMode('create');
                setIsAddEventOpen(false);
            },
        });
    };

    const handleSubmitHoliday = (payload: HolidayUpsertPayload) => {
        if (editingHoliday) {
            updateHoliday.mutate(
                { id: editingHoliday.id, payload },
                {
                    onSuccess: () => {
                        setEditingHoliday(null);
                        setIsAddHolidayOpen(false);
                    },
                },
            );
            return;
        }

        createHoliday.mutate(payload, {
            onSuccess: () => {
                setEditingHoliday(null);
                setHolidayModalMode('create');
                setIsAddHolidayOpen(false);
            },
        });
    };

    const handleNextWeek = () =>
        setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });

    const handlePrevWeek = () =>
        setSelectedDate((d) => { const p = new Date(d); p.setDate(p.getDate() - 7); return p; });

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── HEADER ── */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-800">Shared Calendar</h1>
                        <p className="text-xs text-slate-400 font-medium">Family Planner</p>
                    </div>
                    <div className="flex gap-3">
                        {activeTab === 'Holidays' ? (
                            <button
                                onClick={() => {
                                    setEditingHoliday(null);
                                    setHolidayModalMode('create');
                                    setIsAddHolidayOpen(true);
                                }}
                                className="flex items-center gap-2 bg-linear-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-100 transition-all active:scale-95 hover:opacity-90"
                            >
                                <Plus size={18} /> Add Holiday
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateEventClick}
                                className="flex items-center gap-2 bg-linear-to-r from-violet-500 to-sky-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-100 transition-all active:scale-95 hover:opacity-90"
                            >
                                <Plus size={18} /> Add Event
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* MAIN CALENDAR CONTENT */}
            <main className="mx-auto px-6 mt-5 pb-5">
                {isLoading && (
                    <div className="flex items-center justify-center py-10 text-slate-500 text-sm font-semibold">
                        Loading calendar…
                    </div>
                )}

                <div className="bg-[#E0F7FA] rounded-[3rem] p-4 md:p-7 shadow-xl border border-white/60">
                    {/* TABS */}
                    <div className="mx-auto mb-5 flex w-full max-w-2xl gap-1 rounded-2xl border border-white/50 bg-white/35 p-1.5 backdrop-blur-sm">
                        {['Month', 'Week', 'Day', 'Custody', 'Holidays'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-bold tracking-wide transition-all md:text-sm ${activeTab === tab
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:bg-white/40 hover:text-slate-800'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'Month' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
                                <div className="min-w-0 flex-1 rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6">
                                    <MonthView
                                        calendarDays={calendarDays}
                                        monthName={monthName}
                                        year={year}
                                        selectedDate={selectedDate}
                                        events={events}
                                        onSelectDate={setSelectedDate}
                                        onPrev={handlePrevMonth}
                                        onNext={handleNextMonth}
                                    />
                                </div>
                                <DayEventsList
                                    events={filteredEvents}
                                    onOpen={handleOpenEvent}
                                    onEdit={handleEditEvent}
                                    onDelete={handleDeleteEvent}
                                    className="mt-0 w-full max-w-none rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6 xl:sticky xl:top-6 xl:w-[24rem] xl:min-w-[24rem]"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Week' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
                                <div className="min-w-0 flex-1 rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6">
                                    <WeekView
                                        selectedDate={selectedDate}
                                        events={events}
                                        onSelectDate={setSelectedDate}
                                        onPrevWeek={handlePrevWeek}
                                        onNextWeek={handleNextWeek}
                                    />
                                </div>
                                <DayEventsList
                                    events={filteredEvents}
                                    onOpen={handleOpenEvent}
                                    onEdit={handleEditEvent}
                                    onDelete={handleDeleteEvent}
                                    className="mt-0 w-full max-w-none rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6 xl:sticky xl:top-6 xl:w-[24rem] xl:min-w-[24rem]"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Day' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
                                <div className="min-w-0 flex-1 rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6">
                                    <DayView
                                        selectedDate={selectedDate}
                                        eventsCount={filteredEvents.length}
                                        onPrev={handlePrevDay}
                                        onNext={handleNextDay}
                                    />
                                </div>
                                <DayEventsList
                                    events={filteredEvents}
                                    onOpen={handleOpenEvent}
                                    onEdit={handleEditEvent}
                                    onDelete={handleDeleteEvent}
                                    className="mt-0 w-full max-w-none rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6 xl:sticky xl:top-6 xl:w-[24rem] xl:min-w-[24rem]"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Custody' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
                                <div className="min-w-0 flex-1 rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6">
                                    <CustodyView
                                        selectedDate={selectedDate}
                                        events={custodyEvents}
                                        onSelectDate={setSelectedDate}
                                        onPrevWeek={handlePrevWeek}
                                        onNextWeek={handleNextWeek}
                                    />
                                </div>
                                <DayEventsList
                                    events={filteredCustodyEvents}
                                    onOpen={handleOpenEvent}
                                    onEdit={handleEditEvent}
                                    onDelete={handleDeleteEvent}
                                    className="mt-0 w-full max-w-none rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6 xl:sticky xl:top-6 xl:w-[24rem] xl:min-w-[24rem]"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Holidays' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
                                <div className="min-w-0 flex-1 rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6">
                                    <HolidayView
                                        selectedDate={selectedDate}
                                        events={holidayEvents}
                                        onSelectDate={setSelectedDate}
                                        onPrevWeek={handlePrevWeek}
                                        onNextWeek={handleNextWeek}
                                    />
                                </div>
                                <DayEventsList
                                    events={filteredHolidayEvents}
                                    onOpen={handleOpenEvent}
                                    onEdit={handleEditEvent}
                                    onDelete={handleDeleteEvent}
                                    className="mt-0 w-full max-w-none rounded-[2.25rem] border border-white/60 bg-white/35 p-4 md:p-6 xl:sticky xl:top-6 xl:w-[24rem] xl:min-w-[24rem]"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <AddEventModal
                key={editingEvent ? `${modalMode}-${editingEvent.id}` : `add-${selectedDate.toDateString()}`}
                isOpen={isAddEventOpen}
                mode={modalMode}
                defaultDate={editingEvent?.date ?? selectedDate}
                childOptions={bridgeChildren}
                defaultChildId={primaryChildId}
                initialEvent={editingEvent ? {
                    child: editingEvent.childId ?? primaryChildId ?? 0,
                    title: editingEvent.title,
                    type: editingEvent.type ?? 'other',
                    date: editingEvent.date.toISOString().slice(0, 10),
                    start_time: editingEvent.startTime ?? null,
                    end_time: editingEvent.endTime ?? null,
                    location: editingEvent.location ?? null,
                    repeat: editingEvent.repeat ?? 'once',
                    custom_start_date: editingEvent.customStartDate ?? null,
                    custom_end_date: editingEvent.customEndDate ?? null,
                    reminder_minutes: editingEvent.reminderMinutes ?? 30,
                    description: editingEvent.description ?? null,
                } : null}
                onClose={() => {
                    setIsAddEventOpen(false);
                    setEditingEvent(null);
                    setModalMode('create');
                }}
                onSubmitEvent={handleSubmitEvent}
                onDeleteEvent={editingEvent ? () => {
                    handleDeleteEvent(editingEvent);
                    setIsAddEventOpen(false);
                    setEditingEvent(null);
                    setModalMode('create');
                } : undefined}
                allowEditing={editingEvent?.sourceKind === 'event'}
                allowDeleting={editingEvent?.sourceKind === 'event'}
                isPending={createEvent.isPending || updateEvent.isPending}
            />

            <AddHolidayModal
                key={editingHoliday ? `${holidayModalMode}-${editingHoliday.id}` : `add-holiday-${selectedDate.toDateString()}`}
                isOpen={isAddHolidayOpen}
                mode={holidayModalMode}
                defaultDate={editingHoliday ? new Date(editingHoliday.start_date) : selectedDate}
                childOptions={bridgeChildren}
                initialHoliday={editingHoliday}
                onClose={() => {
                    setIsAddHolidayOpen(false);
                    setEditingHoliday(null);
                    setHolidayModalMode('create');
                }}
                onSubmitHoliday={handleSubmitHoliday}
                onDeleteHoliday={editingHoliday ? () => {
                    deleteHoliday.mutate(editingHoliday.id);
                    setIsAddHolidayOpen(false);
                    setEditingHoliday(null);
                    setHolidayModalMode('create');
                } : undefined}
                allowEditing={true}
                allowDeleting={true}
                isPending={createHoliday.isPending || updateHoliday.isPending}
            />
        </div>
    );
}
