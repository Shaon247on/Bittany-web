"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, Clock, Heart } from "lucide-react";

const CTA = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
    } else {
      router.push("/signup");
    }
  };

  return (
    <section className="py-24 bg-[#1E3E53] text-white relative overflow-hidden flex items-center justify-center">
      {/* Decorative Assets from Screenshot */}
      
      {/* Top Left Blob */}
      <div className="absolute top-0 left-0 w-[200px] sm:w-[260px] h-auto pointer-events-none select-none z-10">
        <Image
          src="/images/cta-tl.png"
          alt=""
          width={260}
          height={180}
          className="object-contain"
          priority
        />
      </div>

      {/* Top Right Blob */}
      <div className="absolute top-0 right-0 w-[220px] sm:w-[280px] h-auto pointer-events-none select-none z-10">
        <Image
          src="/images/cta-tr.png"
          alt=""
          width={280}
          height={180}
          className="object-contain"
          priority
        />
      </div>

      {/* Bottom Left Leaf Outline */}
      <div className="absolute bottom-0 left-0 w-[160px] sm:w-[220px] h-auto pointer-events-none select-none z-10">
        <Image
          src="/images/cta-bl.png"
          alt=""
          width={220}
          height={220}
          className="object-contain"
          priority
        />
      </div>

      {/* Bottom Right Leaf Solid */}
      <div className="absolute bottom-0 right-0 w-[160px] sm:w-[220px] h-auto pointer-events-none select-none z-10">
        <Image
          src="/images/cta-br.png"
          alt=""
          width={220}
          height={220}
          className="object-contain"
          priority
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-20 w-full space-y-8">
        
        {/* Header Block matches screenshot exactly */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Take the First Step to <br />
            Healthier CoParenting
          </h2>
          <p className="text-slate-200 text-sm sm:text-base font-semibold leading-relaxed max-w-xl mx-auto">
            Join thousands of parents who are creating more peaceful<br className="hidden sm:inline" />
            environments for their children
          </p>
        </div>

        {/* Central waitlist submission card */}
        <div className="bg-[#294B61]/65 border border-slate-600/35 p-8 sm:p-10 rounded-3xl max-w-2xl w-full mx-auto shadow-lg backdrop-blur-xs flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
            <input
              type="email"
              placeholder="Enter Your Email Here"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow h-14 px-5 rounded-xl bg-white text-slate-800 outline-none text-base border-2 border-transparent focus:border-[#88CCE1] placeholder-slate-400 font-semibold"
            />
            <button
              type="submit"
              className="h-14 px-8 rounded-xl text-white text-base font-bold shadow-md bg-[#88CCE1] hover:bg-[#7ac0d5] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shrink-0 flex items-center justify-center gap-2"
            >
              Join Waitlist
              <svg className="w-5 h-5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>

          {/* Bullet checkpoints */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300 font-semibold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#88CCE1]" />
              100% Secure
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#88CCE1]" />
              Early Access
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={14} className="text-[#88CCE1]" />
              No Spam
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CTA;
