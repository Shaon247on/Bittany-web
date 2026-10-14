"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "How does the AI tone moderation work?",
      answer:
        "Our AI assistant checks messages in real-time. If it flags defensive or tense words, it suggests neutral, factual, and child-focused alternatives before you press send. This keeps communication peaceful and court-ready."
    },
    {
      question: "Is my personal data secure?",
      answer:
        "Security is our top priority. All files, expense sheets, chat histories, and schedule records are encrypted at rest and in transit. Your data is private and is never sold or shared with advertisers."
    },
    {
      question: "Can I use Parent Bridge if the other parent doesn't join?",
      answer:
        "Yes, you can! You can run Parent Bridge in 'Independent Mode' to log child schedules, expenses, notes, and milestones for your own records. If the other parent decides to participate later, you can easily invite them to connect."
    },
    {
      question: "Is there a mobile app version available?",
      answer:
        "Yes, Parent Bridge is optimized for all mobile web browsers, and native applications for iOS and Android are available for download in their respective app stores."
    },
    {
      question: "What is the difference between Bridge Mode and Independent Mode?",
      answer:
        "Bridge Mode links both co-parent accounts for real-time schedule syncing, direct messaging with AI helper suggestions, and mutual expense logs. Independent Mode operates solo, letting you log activities, upload files, and draft calm messages privately."
    }
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white relative">
      {/* Decorative chat shapes */}
      <div
        className="absolute top-12 right-12 w-28 h-28  bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/images/QA.png')",
          backgroundSize: "contain"
        }}
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[#1D2E54] text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Curious Minds Ask!
          </h2>
          <p className="text-[#555555] text-base sm:text-lg leading-relaxed">
            Everything you need to know about our co-parenting app
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:border-slate-200 transition-colors"
              >
                <button
                  onClick={() => handleToggle(idx)}
                  className="w-full px-6 py-5 bg-[#1F2F59] text-white flex items-center justify-between text-left font-bold text-sm sm:text-base hover:opacity-95 transition-opacity"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Expandable Panel */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-[250px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                  <div className="p-6 bg-slate-50 border-t border-slate-100 text-[#555555] text-sm leading-relaxed font-semibold">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
