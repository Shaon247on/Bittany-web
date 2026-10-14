"use client";

import React from "react";
import Image from "next/image";
import { Mic, MessageSquare, CalendarCheck, Receipt, Brain } from "lucide-react";

// Custom Icon for Expense Tracking (File with Dollar sign)
const ExpenseIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M12 11v6" />
    <path d="M9.5 13h5a1.5 1.5 0 0 0 0-3H11a1.5 1.5 0 0 1 0-3h3" />
  </svg>
);

const Features = () => {
  const featuresList = [
    {
      title: "Tone Monitor & Feedback",
      description: "Ai detects and improves your message tone in real time",
      icon: Mic,
    },
    {
      title: "Secure Messaging",
      description: "Sync parenting schedules, events, and appointments with ease",
      icon: MessageSquare,
    },
    {
      title: "Shared Calendar",
      description: "Sync parenting schedules, events, and appointments with ease",
      icon: CalendarCheck,
    },
    {
      title: "Legal Mode",
      description: "Generate court-ready reports for legal peace of mind.",
      icon: Receipt,
    },
    {
      title: "Expense Tracking",
      description: "Transparent cost sharing and management",
      icon: ExpenseIcon,
    },
    {
      title: "Co-Parenting Tips",
      description: "Personalized advice tailored to your situation.",
      icon: Brain,
    },
  ];

  return (
    <section id="features" className="py-24 bg-[#E5F5FC] relative overflow-hidden">
      {/* Top-Right Decorative Branch Particles */}
      <div className="absolute top-0 right-0 w-[240px] sm:w-[280px] md:w-[320px] h-auto pointer-events-none z-10 select-none">
        <Image
          src="/images/feature-leaf.png"
          alt=""
          width={320}
          height={480}
          className="object-contain"
          priority
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-20">
        {/* Header Block matches screenshot */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-[#1D2E54] text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            How It Helps Your Family
          </h2>
          <p className="text-[#1D2E54]/80 text-sm sm:text-base  leading-relaxed font-semibold max-w-2xl mx-auto">
            Our AI-powered tools are designed to reduce conflict, improve communication,<br className="hidden sm:inline" />
            and keep your children’s wellbeing at the center of every interaction.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={idx}
                className="p-8 bg-white rounded-bl-xl rounded-tr-xl rounded-tl-4xl rounded-br-4xl shadow-[0_15px_40px_rgba(58,149,193,0.06)] border border-slate-100/50 hover:shadow-[0_20px_50px_rgba(58,149,193,0.12)] hover:scale-[1.02] transition-all duration-300 flex flex-col items-start text-left space-y-5"
              >
                {/* Custom circular icon frame */}
                <div className="w-16 h-16 rounded-full bg-[#EBF9FB] flex items-center justify-center text-[#3A95C1] border border-[#3A95C1]/10">
                  <IconComponent className="w-7 h-7 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-[#1D2E54] text-lg sm:text-xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-semibold">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
