"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-24 lg:py-32 px-6 sm:px-12 bg-slate-950"
    >
      {/* Background Image of Family on Beach */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: "url('/images/hero_family.jpg')",
        }}
      />

      {/* Dark Slate-Blue Overlay to Match Screenshot and Enable Readability */}
      <div className="absolute inset-0 bg-[#162747]/45 mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/15 pointer-events-none" />

      {/* Embedded CSS for Floating Phone Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Side: Content & Actions */}
        <div className="lg:col-span-7 text-left space-y-8 max-w-2xl">

          {/* Custom Store Pill with Splash Paint Particles */}
          <div className="relative inline-block">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
              <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 24 24">
                <path d="M17.5 12a1.5 1.5 0 1 1-1.5-1.5 1.5 1.5 0 0 1 1.5 1.5zM8 10.5A1.5 1.5 0 1 0 9.5 12 1.5 1.5 0 0 0 8 10.5zm11.2-5.4l1.3-2.2a.5.5 0 0 0-.2-.7.5.5 0 0 0-.7.2l-1.4 2.4A9.9 9.9 0 0 0 12 4a9.9 9.9 0 0 0-6.2.8L4.4 2.4a.5.5 0 0 0-.7-.2.5.5 0 0 0-.2.7l1.3 2.2A10 10 0 0 0 2 13h20a10 10 0 0 0-2.8-7.9zM7 10h1v1H7zm9 0h1v1h-1z" />
              </svg>
              Coming to iOS & Android
            </div>

            {/* Particles Splash Image */}
            <Image
              src="/images/hero-particles.png"
              alt=""
              width={80}
              height={64}
              className="absolute -top-10 -right-16 w-20 h-16 object-contain pointer-events-none select-none"
              priority
            />
          </div>

          {/* Headline matches screenshot exactly */}
          <h1 className="text-white text-4xl sm:text-5xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            AI-Powered <br />
            <span className="text-[#C4A1FF]">Peaceful Co-Parenting</span> <br />
            Starts Here...
          </h1>

          {/* Subtitle */}
          <p className="text-slate-200 text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-xl">
            Reduce conflict, stay organized, and focus on what matters most — your child&apos;s well-being. Designed for separated or divorced parents.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#contact"
              className="px-8 py-4 rounded-xl text-white text-base font-extrabold shadow-lg shadow-sky-950/20 bg-[#88CCE1] hover:bg-[#7ac0d5] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 duration-300"
            >
              Join The Waitlist
              <ArrowRight size={18} />
            </a>

            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl text-[#1D2E54] text-base font-extrabold bg-[#C4A1FF] hover:bg-[#b490f2] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              How It Works
            </a>
          </div>

          {/* Bullet checkpoints */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-slate-300 font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#88CCE1]"></span>
              Data Safe & Secure
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#88CCE1]"></span>
              Backed by Family Experts
            </div>
          </div>
        </div>

        {/* Right Side: Visual Mockup (Two floating phones as single image) */}
        <div className="lg:col-span-5 flex justify-center items-center mt-12 lg:mt-0 relative w-full h-[400px] lg:h-[500px]">
          <div className="relative w-full h-full max-w-[460px] animate-float">
            <Image
              src="/images/hero-phone.png"
              alt="Parent Bridge App Mockups"
              fill
              className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
