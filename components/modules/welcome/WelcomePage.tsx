"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface WelcomePage {
  onFinish: () => void;
}

const WelcomePage: React.FC<WelcomePage> = ({ onFinish }) => {
  
  useEffect(() => {
    // Automatically transition after 1.5 seconds
    const timer = setTimeout(() => {
      // In web, we usually use localStorage or a cookie for session persistence
      localStorage.setItem('welcomeScreenShown', 'true');
      onFinish();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white">
      
      {/* --- BACKGROUND BLOBS --- */}
      {/* Top Left Light Blue Blob */}
      <div 
        className="absolute -left-[10%] -top-[10%] rounded-full bg-[#EBF9FB] blur-3xl"
        style={{ 
          width: '60vw', 
          height: '60vw', 
          maxWidth: '800px',
          maxHeight: '800px'
        }} 
      />

      {/* Bottom Right Light Purple Blob */}
      <div 
        className="absolute -right-[15%] -bottom-[15%] rounded-full bg-[#F5EEFF] blur-3xl"
        style={{ 
          width: '70vw', 
          height: '70vw', 
          maxWidth: '1000px',
          maxHeight: '1000px'
        }} 
      />

      {/* --- DECORATIVE FLOATING DOTS (Hidden on small mobile for cleaner web look) --- */}
      <div className="absolute top-[48%] right-[15%] h-5 w-5 rounded-full bg-[#B1E1E9] opacity-80 animate-pulse" />
      <div className="absolute top-[38%] right-[18%] h-2 w-2 rounded-full border border-[#89D5E2]" />
      <div className="absolute top-[55%] left-[15%] h-3 w-3 rounded-full bg-[#C5A3FF] opacity-60 animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute top-[62%] left-[16%] h-2 w-2 rounded-full border border-[#00E5FF]" />

      {/* --- MAIN CONTENT --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        {/* LOGO SECTION */}
        <div className="relative mb-8 h-48 w-48 md:h-64 md:w-64">
          <Image
            src="/images/logo.png" // Place your logo in /public/images/logo.png
            alt="Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* SUBTITLE */}
        <h2 className="max-w-md text-lg md:text-xl font-medium text-[#707070] leading-relaxed">
          Communication Bridge for Healthy <br className="hidden md:block" /> 
          Co-Parenting
        </h2>
        
        {/* Optional: Add a small loading indicator for web UX */}
        <div className="mt-8 h-1 w-12 overflow-hidden rounded-full bg-gray-100">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="h-full w-full bg-[#89D5E2]"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomePage;