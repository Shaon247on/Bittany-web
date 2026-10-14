import { Download, User, Users, FileText, Calendar } from "lucide-react";
import { DocumentCardItem } from "@/types/document.type";

interface DocumentCardProps {
  item: DocumentCardItem;
  onDownload?: (id: string) => void;
  onSelect?: (id: string) => void;
}

export function DocumentCard({ item, onDownload, onSelect }: DocumentCardProps) {
  return (
    <div
      onClick={() => onSelect?.(item.id)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl"
      style={{
        backgroundColor: item.cardBg,
        borderLeft: `6px solid ${item.accentColor}`,
      }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-lg font-bold text-[#213B5F] leading-tight group-hover:text-blue-900">
            {item.title}
          </h3>
          
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDownload?.(item.id);
            }}
            className="shrink-0 p-2 bg-white rounded-lg shadow-sm hover:shadow-md text-[#7EB5DB] hover:text-blue-500 transition-all"
            title="Download Document"
          >
            <Download size={20} />
          </button>
        </div>

        <div 
          className="mt-3 inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: item.categoryBg, color: item.categoryColor }}
        >
          {item.category}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-y-3">
          <div className="flex items-center gap-2 text-sm text-[#213B5F]">
            <User size={14} className="text-slate-400" />
            <span>{item.owner}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[#42BA64] font-medium">
            <Users size={14} />
            <span>{item.childName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#5E667A]">
            <Calendar size={14} />
            <span>{item.uploadedAt}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#213B5F]">
            <FileText size={14} className="text-slate-400" />
            <span className="truncate">{item.fileTypesLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}