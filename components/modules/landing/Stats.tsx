"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

const Stats = () => {
  const statsList = [
    {
      metric: "87%",
      title: "Reduction in Conflict",
      description: "Parents report an immediate decrease in verbal friction and scheduling tension.",
      linkText: "Read our impact study",
      href: "#"
    },
    {
      metric: "78%",
      title: "Better Communication",
      description: "AI-assisted tone suggestions keep messaging polite, constructive, and child-focused.",
      linkText: "How our AI helps",
      href: "#how-it-works"
    },
    {
      metric: "91%",
      title: "Improved Child Happiness",
      description: "Children thrive when parents coordinate transfers and activities without arguments.",
      linkText: "See parent reviews",
      href: "#"
    }
  ];

  return (
    <section id="stats" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-[#1D2E54] text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            What Parents Really Want
          </h2>
          <p className="text-[#555555] text-base sm:text-lg md:text-xl leading-relaxed">
            We surveyed 500+ co-parents to understand their biggest challenges. Here’s
            what we found.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statsList.map((stat, idx) => (
            <div
              key={idx}
              className="p-8 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center justify-between text-center transition-all duration-300 hover:shadow-lg hover:shadow-slate-100 hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <p className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-[#99D1E8] to-[#C4A1FF] bg-clip-text text-transparent">
                  {stat.metric}
                </p>
                <h3 className="text-[#1D2E54] text-lg sm:text-xl font-bold">
                  {stat.title}
                </h3>
                <p className="text-[#555555] text-sm leading-relaxed font-medium">
                  {stat.description}
                </p>
              </div>

              <a
                href={stat.href}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#88CCE1] hover:text-[#C4A1FF] transition-colors"
              >
                {stat.linkText}
                <ArrowUpRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
