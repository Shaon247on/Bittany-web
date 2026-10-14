import React from 'react';

type Option = {
  label: string;
  value: string;
};

type EventFormFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'time' | 'number';
  options?: Option[];
  min?: string;
};

export const EventFormField: React.FC<EventFormFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  options,
  min,
}) => {
  const baseClassName =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      {options ? (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={baseClassName}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={baseClassName}
        />
      )}
    </div>
  );
};
