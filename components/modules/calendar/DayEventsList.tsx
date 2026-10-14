import React from 'react';
import { DayEventCard } from './DayEventCard';
import { CalendarEvent } from '@/types/calendar.type';

interface DayEventsListProps {
  events: CalendarEvent[];
  onOpen: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  className?: string;
}

export const DayEventsList: React.FC<DayEventsListProps> = ({ events, onOpen, onEdit, onDelete, className = '' }) => {
  return (
    <div className={`mt-12 px-2 max-w-4xl mx-auto ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-800">Day&apos;s Schedule</h3>
        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {events.length} Events
        </span>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <DayEventCard key={event.id} event={event} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <p className="text-slate-400 font-medium">No events for this day.</p>
          </div>
        )}
      </div>
    </div>
  );
};