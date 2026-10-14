import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar.type';

type CustodyViewProps = {
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

export const CustodyView: React.FC<CustodyViewProps> = ({
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
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
            <ShieldCheck size={14} />
            Custody Planner
          </div>
          <h3 className="mt-3 text-2xl font-black text-slate-800">Custody Schedule</h3>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {weekDays.map((day) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const count = getEventCount(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all min-h-[110px] ${
                isSelected
                  ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                  : 'border-white/50 bg-white/60 hover:bg-white'
              }`}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {day.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="mt-1 text-lg font-black text-slate-800">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-1.5 mt-3">
                {count > 0 ? (
                  <>
                    <img src="/icons/calendar-pin.png" alt="Event pin" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-bold text-slate-500">
                      {count} event{count > 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400 opacity-0 select-none">
                    None
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
