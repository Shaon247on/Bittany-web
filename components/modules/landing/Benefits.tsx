"use client";

import React from "react";
import Image from "next/image";
import { Check, FileText, Users, Heart } from "lucide-react";

const Benefits = () => {
  const benefitsList = [
    {
      title: "Built-in tone support to avoid unnecessary conflict",
      description: "AI guidance helps you express yourself clearly while keeping conversations positive and productive.",
      icon: Check,
    },
    {
      title: "Clear, documented communication for legal confidence",
      description: "Court-admissible records and expert-backed communication tools protect your family's interests.",
      icon: FileText,
    },
    {
      title: "Shared tools for managing parenting logistics",
      description: "Transparent scheduling, expense sharing, and documentation ensure both parents stay informed and involved.",
      icon: Users,
    },
    {
      title: "Trusted by therapists, legal professionals, and families",
      description: "Developed with input from family therapists, legal professionals, and experienced co-parents.",
      icon: Heart,
    },
  ];

  return (
    <section id="benefits" className="py-24 bg-[#FEFCFF] relative overflow-hidden">

      {/* Bottom-Right Leaf Decoration Particles */}
      <div className="absolute bottom-0 right-0 w-[280px] sm:w-[340px] md:w-[400px] h-auto pointer-events-none z-10 select-none opacity-90">
        <Image
          src="/images/benefits-objects.png"
          alt=""
          width={400}
          height={400}
          className="object-contain"
          priority
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-20">
        {/* Left Column: Image */}
        <div className="lg:col-span-5 relative h-[520px] w-full rounded-[32px] overflow-hidden shadow-xl shadow-slate-100 border border-slate-100">
          <Image
            src="/images/benefits_family.png"
            alt="Family walking on a forest path"
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority
          />
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-7 space-y-8 text-left">
          {/* Header */}
          <div className="space-y-3">
            <h2 className="text-[#1D2E54] text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              Designed to Make Life Easier-<br />
              for You and Your Child
            </h2>
            <p className="text-slate-500 text-sm sm:text-base font-semibold max-w-xl">
              Trusted by therapists, legal professionals, and families who need reliable co-parenting support.
            </p>
          </div>

          {/* Checklist of benefits */}
          <div className="space-y-6 max-w-2xl">
            {benefitsList.map((benefit, idx) => {
              const IconComponent = benefit.icon;
              return (
                <div key={idx} className="flex items-start gap-4">
                  {/* Circular Outline Badge */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-full border-2 border-[#88CCE1] flex items-center justify-center text-[#3A95C1] mt-1 bg-white shadow-xs">
                    <IconComponent className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[#1D2E54] text-base sm:text-lg font-bold leading-snug">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-400 text-sm font-semibold leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Testimonial Quote block */}
          <div className="bg-[#F5EEFF]/25 backdrop-blur-xs p-6 rounded-2xl border border-[#F5EEFF] shadow-[0_8px_30px_rgba(196,161,255,0.02)] text-left max-w-xl relative z-20">
            <p className="text-[#1D2E54] font-extrabold text-sm sm:text-base italic leading-relaxed">
              &quot;Finally, a co-parenting tool that understands both my stress and my schedule.&quot;
            </p>
            <p className="text-slate-400 text-xs sm:text-sm font-bold mt-2">
              — Sarah M., Parent
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
