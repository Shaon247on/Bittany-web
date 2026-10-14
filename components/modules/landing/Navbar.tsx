"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { getStoredAccessToken } from "@/hooks/useAuth";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check auth status
    const token = getStoredAccessToken();
    setIsLoggedIn(!!token);

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact Us", href: "#contact" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 py-1"
        : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative size-20 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/images/logo.png"
              alt="Parent Bridge Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* <span className="text-[#1D2E54] text-xl font-bold tracking-tight bg-gradient-to-r from-[#1D2E54] to-[#4c6394] bg-clip-text text-transparent">
            Parent Bridge
          </span> */}
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#555555] text-sm font-semibold hover:text-[#88CCE1] transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/home"
              className="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg shadow-sky-100 transition-all hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-[#555555] text-sm font-bold hover:text-[#88CCE1] transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg shadow-sky-100 transition-all hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-[#1D2E54] hover:bg-slate-50 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-lg px-6 py-6 flex flex-col gap-5 transition-all duration-300 ease-in-out">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#555555] text-base font-semibold hover:text-[#88CCE1] transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
          </div>

          <hr className="border-slate-100" />

          <div className="flex flex-col gap-3">
            {isLoggedIn ? (
              <Link
                href="/home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 rounded-full text-center text-white text-base font-bold"
                style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 rounded-full text-center text-[#555555] border border-gray-200 text-base font-bold hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 rounded-full text-center text-white text-base font-bold shadow-md"
                  style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
