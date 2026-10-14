"use client";

import React from "react";
import Image from "next/image";

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-[#F4EBFC] relative overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Decorative Assets */}

      {/* Top Left: Concentric Circles Object */}
      <div className="absolute top-10 left-6 sm:left-12 md:left-20 w-24 sm:w-32 md:w-36 h-auto pointer-events-none select-none z-10">
        <Image
          src="/images/htw-pie-obj.png"
          alt=""
          width={144}
          height={144}
          className="object-contain"
          priority
        />
      </div>

      {/* Top Right: Two Purple Stars */}
      <div className="absolute top-16 right-16 sm:right-24 md:right-36 w-24 sm:w-28 md:w-32 h-auto pointer-events-none z-10 select-none">
        <Image
          src="/images/htw-stars.png"
          alt=""
          width={128}
          height={64}
          className="object-contain"
          priority
        />
      </div>

      {/* Right Edge: Curved Parallel Wave Lines */}
      <div className="absolute right-0 top-1/4 h-3/5 w-24 sm:w-32 md:w-36 pointer-events-none z-10 select-none flex items-center justify-end">
        <Image
          src="/images/htw-lines.png"
          alt=""
          width={144}
          height={480}
          className="object-contain object-right"
          priority
        />
      </div>

      {/* Bottom Left: Sparkles & Stars */}
      <div className="absolute bottom-10 left-6 sm:left-12 md:left-20 w-20 sm:w-24 md:w-28 h-auto pointer-events-none z-10 select-none">
        <Image
          src="/images/htw-sparkles.png"
          alt=""
          width={112}
          height={112}
          className="object-contain"
          priority
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-20 w-full text-center">
        {/* Header Block matches screenshot exactly */}
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-[#1D2E54] text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            See How It Works
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-semibold leading-relaxed max-w-xl mx-auto">
            Watch how CoParent AI transforms a typical co-parenting day from stressful to seamless.
          </p>
        </div>

        {/* Three Phone Mockups Layout */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 mt-10">

          {/* Phone 1: Chat (Left) */}
          <div className="relative w-[260px] sm:w-[280px] lg:w-[310px] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] hover:scale-[1.03] transition-transform duration-500">
            <Image
              src="/images/htw-chat.png"
              alt="Co-parenting Chat Mockup"
              width={310}
              height={630}
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 30vw"
              priority
            />
          </div>

          {/* Phone 2: Home Dashboard (Middle) */}
          <div className="relative w-[260px] sm:w-[280px] lg:w-[400px] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] hover:scale-[1.03] transition-transform duration-500">
            <Image
              src="/images/htw-home.png"
              alt="App Dashboard Mockup"
              width={310}
              height={630}
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 30vw"
              priority
            />
          </div>

          {/* Phone 3: Calling UI (Right) */}
          <div className="relative w-[260px] sm:w-[280px] lg:w-[280px] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] hover:scale-[1.03] transition-transform duration-500">
            <Image
              src="/images/htw-call.png"
              alt="Incoming Call UI Mockup"
              width={310}
              height={630}
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 30vw"
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
