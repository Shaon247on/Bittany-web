"use client";

import {
  ArrowLeft,
  LifeBuoy,
  Mail,
  PhoneCall,
} from "lucide-react";
import { useRouter } from "next/navigation";

const SUPPORT_EMAIL = "support@parentbridge.app";
const SUPPORT_PHONE = "+1 (555) 201-8890";
const WHATSAPP_NUMBER = "15552018890";

const supportCards = [
  {
    icon: <Mail size={18} />,
    title: "Email Support",
    body: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    accent: "text-sky-600",
    bg: "bg-sky-100",
  },
  {
    icon: <PhoneCall size={18} />,
    title: "WhatsApp Support",
    body: SUPPORT_PHONE,
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    accent: "text-emerald-600",
    bg: "bg-emerald-100",
  },
];

const faqs = [
  {
    question: "How do I reset my password?",
    answer:
      "Go to the sign-in screen and use the Forgot Password flow to request a reset code.",
  },
  {
    question: "How do I update my profile?",
    answer:
      "Open Settings, select Profile Information, and save your updated details.",
  },
  {
    question: "Can I export my records?",
    answer:
      "Some modules support downloads already. Additional export options can be added later if needed.",
  },
];

export default function HelpSupportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#EAF1FF] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-white p-3 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-black text-slate-800">
              Help and Support
            </h1>

            <p className="text-sm text-slate-500">
              Find support channels and quick answers to common questions.
            </p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#80D0FF] via-[#9BC8FF] to-[#B399FF] p-6 shadow-2xl shadow-sky-200/60 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/20 text-white">
              <LifeBuoy size={24} />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">
                We’re here to help
              </h2>

              <p className="mt-1 text-sm font-medium text-white/85">
                Choose the best way to reach support or browse common guidance
                below.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {supportCards.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("https://") ? "_blank" : undefined}
              rel={
                item.href.startsWith("https://")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="block rounded-4xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg} ${item.accent}`}
              >
                {item.icon}
              </div>

              <h3 className="mt-4 text-lg font-black text-slate-800">
                {item.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {item.body}
              </p>
            </a>
          ))}
        </section>

        <section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-800">
            Frequently Asked Questions
          </h3>

          <div className="mt-5 space-y-4">
            {faqs.map((item) => (
              <div
                key={item.question}
                className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <h4 className="text-sm font-black text-slate-800">
                  {item.question}
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}