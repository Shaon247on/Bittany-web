"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onFinish: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFinish }) => {
  
  useEffect(() => {
    // Automatically transition after 1.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-white">
      
      {/* --- BACKGROUND BLOBS --- */}
      {/* Top Left Light Blue Blob */}
      <div 
        className="absolute bg-[#EBF9FB] rounded-full"
        style={{ 
          width: '120vw', 
          height: '120vw', 
          top: '-15vh', 
          left: '-40vw' 
        }} 
      />

      {/* Bottom Right Light Purple Blob */}
      <div 
        className="absolute bg-[#F5EEFF] rounded-full"
        style={{ 
          width: '150vw', 
          height: '150vw', 
          bottom: '-30vh', 
          right: '-50vw' 
        }} 
      />

      {/* --- DECORATIVE FLOATING DOTS --- */}
      <div className="absolute w-5 h-5 rounded-full bg-[#B1E1E9] opacity-80" style={{ top: '48%', right: '15%' }} />
      <div className="absolute w-2 h-2 rounded-full border border-[#89D5E2]" style={{ top: '38%', right: '18%' }} />
      <div className="absolute w-3 h-3 rounded-full bg-[#C5A3FF] opacity-60" style={{ top: '55%', left: '15%' }} />
      <div className="absolute w-2 h-2 rounded-full border border-[#00E5FF]" style={{ top: '62%', left: '16%' }} />

      {/* --- MAIN CONTENT (ANIMATED) --- */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
            duration: 1, 
            type: "spring", 
            stiffness: 100 
        }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* LOGO SECTION */}
        <div className="mb-6">
          <Image
            src="/images/logo.png" // Ensure your logo is in the /public folder
            alt="Logo"
            width={240} // Equivalent to size-60 (60 * 4px)
            height={240}
            priority
            className="object-contain"
          />
        </div>

        {/* SUBTITLE */}
        <p className="text-center text-[#707070] text-[17px] mt-4 px-12 leading-6 whitespace-pre-line">
          Communication Bridge for Healthy{"\n"}Co-Parenting
        </p>
      </motion.div>
    </main>
  );
};

export default WelcomeScreen;