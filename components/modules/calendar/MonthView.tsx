import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar.type';

type MonthViewProps = {
  calendarDays: Array<Date | null>;
  monthName: string;
  year: number;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
};

export const MonthView: React.FC<MonthViewProps> = ({
  calendarDays,
  monthName,
  year,
  selectedDate,
  events,
  onSelectDate,
  onPrev,
  onNext,
}) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventCount = (date: Date) => {
    return events.filter((event) => event.date.toDateString() === date.toDateString()).length;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-800">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            className="rounded-full bg-white/80 p-2 text-slate-700 shadow-sm border border-slate-100 transition-all hover:bg-white hover:scale-105 active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onNext}
            className="rounded-full bg-white/80 p-2 text-slate-700 shadow-sm border border-slate-100 transition-all hover:bg-white hover:scale-105 active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-500 pb-2">{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          const eventCount = day ? getEventCount(day) : 0;
          const isSelected = day && day.toDateString() === selectedDate.toDateString();
          const isToday = day && day.toDateString() === new Date().toDateString();

          return (
            <div
              key={i}
              onClick={() => day && onSelectDate(day)}
              className={`relative h-14 md:h-24 border rounded-2xl flex flex-col items-start p-2.5 transition-all
                ${day ? 'cursor-pointer bg-white/50 hover:bg-white/90 border-white/40' : 'bg-transparent border-transparent'}
                ${isToday && !isSelected ? 'bg-indigo-50/40 border-indigo-200/50 hover:bg-indigo-50/70' : ''}
                ${isSelected ? 'ring-2 ring-indigo-500 bg-white' : ''}
                ${isToday && isSelected ? 'ring-2 ring-indigo-600 bg-indigo-50/80 border-indigo-300' : ''}
              `}
            >
              {day && (
                <>
                  <span
                    className={`text-sm font-bold flex items-center justify-center rounded-full
                      ${isToday
                        ? 'w-7 h-7 bg-indigo-600 text-white shadow-sm -mt-1 -ml-1'
                        : 'text-slate-700'
                      }`}
                  >
                    {day.getDate()}
                  </span>
                  {eventCount > 0 && (
                    <>
                      <div className="absolute right-2 top-2">
                        <img src="/icons/calendar-pin.png" alt="Event pin" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="mt-auto text-[10px] font-bold text-slate-500 hidden md:block">
                        {eventCount} event{eventCount > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};