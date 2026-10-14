import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar.type';

type WeekViewProps = {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

const getStartOfWeek = (date: Date) => {
  const day = date.getDay();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start;
};

export const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  events,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}) => {
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [selectedDate]);

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];

    const startText = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endText = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `${startText} - ${endText}`;
  }, [weekDays]);

  const getEventCount = (date: Date) => {
    return events.filter((event) => event.date.toDateString() === date.toDateString()).length;
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Week View</h3>
          <p className="text-sm font-medium text-slate-500">{weekRangeLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPrevWeek}
            className="rounded-full bg-white/80 p-2 text-slate-700 transition-colors hover:bg-white"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onNextWeek}
            className="rounded-full bg-white/80 p-2 text-slate-700 transition-colors hover:bg-white"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {weekDays.map((day) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const eventsCount = getEventCount(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative rounded-2xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                  : 'border-white/50 bg-white/60 hover:bg-white'
              }`}
            >
              {eventsCount > 0 && (
                <div className="absolute right-3 top-2.5">
                  <img src="/icons/calendar-pin.png" alt="Event pin" className="w-5 h-5 object-contain" />
                </div>
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-800">{day.getDate()}</p>
              {eventsCount > 0 ? (
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {eventsCount} event{eventsCount > 1 ? 's' : ''}
                </p>
              ) : (
                <p className="mt-1 text-xs font-medium text-slate-500 opacity-0 select-none">
                  No events
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
