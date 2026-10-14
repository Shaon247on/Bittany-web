import React from 'react';

interface SummaryCardProps {
  gradient: string;
  leftValue: string;
  leftLabel: string;
  rightValue: string;
  rightLabel: string;
  isAlert?: boolean;
}

export const SummaryCard = ({ gradient, leftValue, leftLabel, rightValue, rightLabel, isAlert }: SummaryCardProps) => (
  <div className={`h-24 rounded-3xl p-1 bg-gradient-to-r ${gradient} shadow-lg transition-transform hover:scale-[1.02]`}>
    <div className="flex h-full w-full items-center bg-white/10 backdrop-blur-md rounded-[1.4rem] px-6">
      <div className="flex-1 text-center">
        <p className="text-xl font-black text-[#111C44]">{leftValue}</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#111C44]/70">{leftLabel}</p>
      </div>
      <div className="h-10 w-px bg-[#111C44]/20" />
      <div className="flex-1 text-center">
        <p className={`text-xl font-black ${isAlert ? 'text-red-600' : 'text-[#111C44]'}`}>{rightValue}</p>
        <p className={`text-[11px] font-bold uppercase tracking-wider ${isAlert ? 'text-red-600/70' : 'text-[#111C44]/70'}`}>{rightLabel}</p>
      </div>
    </div>
  </div>
);