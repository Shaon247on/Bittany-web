import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DayViewProps {
  selectedDate: Date;
  eventsCount?: number;
  onPrev: () => void;
  onNext: () => void;
}

export const DayView: React.FC<DayViewProps> = ({ selectedDate, eventsCount = 0, onPrev, onNext }) => {
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = selectedDate.getDate();
  const monthYear = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fullDate = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex h-full flex-col">
      {/* Navigation Header */}
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={onPrev}
          className="p-3 bg-white/80 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-95"
        >
          <ChevronLeft className="text-slate-700" size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{dayName}</h2>
          <p className="text-slate-500 font-medium">{monthYear}</p>
        </div>

        <button 
          onClick={onNext}
          className="p-3 bg-white/80 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-95"
        >
          <ChevronRight className="text-slate-700" size={24} />
        </button>
      </div>

      <div className="grid flex-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-3xl border border-white/60 bg-white/55 p-6 backdrop-blur-sm md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Selected Date</p>
          <h3 className="mt-3 text-3xl font-black text-slate-800 md:text-4xl">{fullDate}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">Keep updates, pickups, and schedule changes documented for this day.</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">
              <CalendarIcon size={16} />
              {eventsCount} event{eventsCount === 1 ? '' : 's'} planned
            </div>
            {eventsCount > 0 && (
              <img src="/icons/calendar-pin.png" alt="Event pin" className="w-6 h-6 object-contain" />
            )}
          </div>
        </div>

        {/* Large Date Display */}
        <div className="relative mx-auto group lg:mx-0">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-[2.5rem] border border-white bg-white shadow-xl transition-transform group-hover:rotate-3 md:h-40 md:w-40">
            <span className="text-5xl font-black text-indigo-600 md:text-6xl">{dayNumber}</span>
            <div className="mt-1 rounded-lg bg-indigo-50 p-1.5">
              <CalendarIcon size={16} className="text-indigo-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};