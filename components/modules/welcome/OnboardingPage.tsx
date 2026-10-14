"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface OnboardingData {
    title: string;
    description: string;
    image: string;
}

const ONBOARDING_STEPS: OnboardingData[] = [
    {
        title: "Smart Communication",
        description: "AI-powered message filtering removes hostility while preserving your message's meaning",
        image: '/illustrations/onboarding-1.png', 
    },
    {
        title: "Legal Protection",
        description: "All conversations are recorded and can be exported for court proceedings when needed",
        image: '/illustrations/onboarding-2.png',
    },
    {
        title: "Shared Planning",
        description: "Coordinate schedules, track expenses, and manage documents in one secure place",
        image: '/illustrations/onboarding-3.png',
    },
    {
        title: "Community Support",
        description: "Connect with other co-parents in our anonymous support forum for advice and encouragement",
        image: '/illustrations/onboarding-4.png',
    },
];

const OnboardingScreen = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const router = useRouter();

    const handleNext = () => {
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            router.replace("/signin");
        }
    };

    const handleSkip = () => {
        router.replace("/signin");
    };

    const currentStep = ONBOARDING_STEPS[currentIndex];

    return (
        <main className="relative flex h-screen w-full flex-col overflow-hidden bg-white font-sans">
            
            {/* --- BACKGROUND DECORATIONS --- */}
            {/* Top Left Light Blue Blob */}
            <div
                className="absolute bg-[#EBF9FB] rounded-full pointer-events-none"
                style={{ width: '110vw', height: '110vw', top: '-30vh', left: '-60vw' }}
            />

            {/* Bottom Right Light Purple Blob */}
            <div
                className="absolute bg-[#F5EEFF] rounded-full pointer-events-none"
                style={{ width: '120vw', height: '120vw', bottom: '-30vh', right: '-50vw' }}
            />

            {/* --- SKIP BUTTON --- */}
            <button
                onClick={handleSkip}
                className="absolute top-10 right-8 z-30 text-[#23335A] font-bold text-lg hover:opacity-70 transition-opacity"
            >
                Skip
            </button>

            {/* --- MAIN CONTENT --- */}
            <div className="relative z-10 flex flex-1 flex-col justify-center px-8 md:px-20 max-w-2xl">
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                        {/* Illustration Container */}
                        <div className="flex items-center justify-center mb-16">
                            <Image
                                src={currentStep.image}
                                alt={currentStep.title}
                                width={320}
                                height={320}
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Text Content Area */}
                        <div className="mb-10">
                            <h1 className="text-[32px] font-bold text-[#23335A] leading-tight">
                                {currentStep.title}
                            </h1>
                            <p className="text-[#707070] text-[18px] mt-4 leading-7">
                                {currentStep.description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* --- PAGINATION DOTS --- */}
                <div className="flex flex-row items-center space-x-2">
                    {ONBOARDING_STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                                currentIndex === index ? 'bg-[#555555] w-6' : 'bg-transparent border border-[#707070]'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* --- SIDE NEXT BUTTON DESIGN --- */}
            <div 
                className="absolute right-0 top-0 h-full w-20 flex items-end justify-center z-20 pb-[30%]"
                style={{
                    backgroundImage: "url('/shapes/navigation-shape.png')",
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center'
                }}
            >
                <button
                    onClick={handleNext}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity z-20"
                    style={{ transform: 'translateX(-10px)' }}
                >
                    <ChevronRight size={28} strokeWidth={2.5} />
                </button>
            </div>

        </main>
    );
};

export default OnboardingScreen;