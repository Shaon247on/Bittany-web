import React from 'react';
import { Clock, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar.type';

interface DayEventCardProps {
  event: CalendarEvent;
  onOpen?: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

export const DayEventCard: React.FC<DayEventCardProps> = ({ event, onOpen, onEdit, onDelete }) => {
  const accentClass =
    event.category === 'Custody'
      ? 'bg-orange-400'
      : event.category === 'School'
        ? 'bg-blue-400'
        : event.category === 'Medical'
          ? 'bg-emerald-400'
          : event.category === 'Holiday'
            ? 'bg-amber-400'
            : event.category === 'Activity'
              ? 'bg-violet-400'
              : 'bg-sky-400';

  const badgeClass =
    event.category === 'Custody'
      ? 'bg-orange-50 text-orange-500'
      : event.category === 'School'
        ? 'bg-blue-50 text-blue-600'
        : event.category === 'Medical'
          ? 'bg-emerald-50 text-emerald-600'
          : event.category === 'Holiday'
            ? 'bg-amber-50 text-amber-600'
            : event.category === 'Activity'
              ? 'bg-violet-50 text-violet-600'
              : 'bg-sky-50 text-sky-500';

  return (
    <button
      type="button"
      onClick={() => onOpen?.(event)}
      className="group w-full bg-white border border-slate-100 p-5 rounded-[2rem] flex items-center justify-between hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all text-left"
    >
      <div className="flex items-center gap-5">
        {/* Category Color Indicator */}
        <div className={`w-1.5 h-12 rounded-full ${accentClass}`} />
        
        <div>
          <h4 className="text-lg font-bold text-slate-800 tracking-tight">{event.title}</h4>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-slate-400 text-sm font-medium">
              <Clock size={14} />
              <span>{event.time || "All Day"}</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md
              ${badgeClass}
            `}>
              {event.category}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons (visible on hover for web) */}
      {(event.sourceKind === 'event' || event.sourceKind === 'holiday') && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(actionEvent) => {
              actionEvent.stopPropagation();
              onEdit?.(event);
            }}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 size={18} />
          </button>
          <button 
            type="button"
            onClick={(actionEvent) => {
              actionEvent.stopPropagation();
              onDelete?.(event);
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </button>
  );
};