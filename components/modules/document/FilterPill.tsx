import { ChevronDown } from "lucide-react";

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterPill({ label, active = false, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 flex items-center gap-2 px-4 rounded-xl border transition-all ${
        active 
          ? "bg-[#90C6E7] border-transparent text-[#1E4E74] font-semibold" 
          : "bg-white border-[#90C6E7] text-[#90C6E7] hover:bg-[#90C6E7]/10"
      }`}
    >
      <span className="text-sm">{label}</span>
      {!active && <ChevronDown size={16} />}
    </button>
  );
}