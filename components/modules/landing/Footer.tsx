"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

// Inline SVG components for social media icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success("Thank you for joining the waitlist!");
      setEmail("");
    }
  };

  return (
    <footer className="w-full flex flex-col">
      {/* Main Footer Block (Light Blue Background) */}
      <div className="bg-[#F5F8FC] text-slate-800 py-16 px-6 sm:px-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">

          {/* Brand/Logo Column */}
          <div className="md:col-span-5 space-y-4 text-left">
            <Link href="/" className="inline-block group">
              <div className="relative w-40 h-30 transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src="/images/logo.png"
                  alt="ParentBridge Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
            <p className="text-[#1D2E54]/80 text-sm leading-relaxed max-w-sm font-semibold">
              Parent Bridge helps co-parents stay connected, organized, and focused on their children — with tools like secure messaging, shared calendars, and expense tracking.
            </p>
          </div>

          {/* Explore Us Column */}
          <div className="md:col-span-3 space-y-4 text-left md:pl-8">
            <h4 className="text-base font-extrabold text-[#1D2E54]">Explore Us</h4>
            <ul className="space-y-3 text-sm text-[#1D2E54]/80 font-semibold">
              <li>
                <a href="#features" className="hover:text-[#3A95C1] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#3A95C1] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#3A95C1] transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#stats" className="hover:text-[#3A95C1] transition-colors">
                  Stories
                </a>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-[#3A95C1] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="hover:text-[#3A95C1] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/delete-account" className="hover:text-[#3A95C1] transition-colors">
                  Delete Account Request
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Social Column */}
          <div className="md:col-span-4 space-y-5 text-left">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <input
                type="email"
                placeholder="Enter Your Email Here"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow h-12 px-4 rounded-xl bg-white text-slate-800 outline-none text-sm border border-slate-300 placeholder-slate-400 font-semibold"
              />
              <button
                type="submit"
                className="h-12 px-6 rounded-xl text-white font-bold text-sm bg-[#88CCE1] hover:bg-[#7ac0d5] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shrink-0 flex items-center justify-center gap-1.5"
              >
                Join Waitlist
                <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>

            <div className="space-y-2">
              <h5 className="text-sm font-extrabold text-[#1D2E54]">Connect With Us !</h5>
              <div className="flex gap-4 items-center">
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#1D2E54] hover:text-[#88CCE1] hover:scale-110 transition-all"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#1D2E54] hover:text-[#88CCE1] hover:scale-110 transition-all"
                  aria-label="Twitter"
                >
                  <TwitterIcon className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#1D2E54] hover:text-[#88CCE1] hover:scale-110 transition-all"
                  aria-label="YouTube"
                >
                  <YoutubeIcon className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sub-Footer Copyright Strip (Dark Navy Background) */}
      <div className="bg-[#10223E] text-slate-400 py-4 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-semibold">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/terms-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/delete-account" className="hover:text-white transition-colors">
              Delete Account Request
            </Link>
          </div>
          <p className="text-xs sm:text-sm font-semibold tracking-wide">
            &copy; 2026 Parent Bridge. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
