"use client";

import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const sections = [
  {
    title: "Use of Service",
    body: "ParentBridge is intended to support family coordination, communication, and record management. You agree to use the platform responsibly and in compliance with applicable law.",
  },
  {
    title: "Account Responsibility",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity performed through your account.",
  },
  {
    title: "Content and Records",
    body: "You retain responsibility for the content you upload, including messages, documents, and shared information. Do not upload unlawful or harmful material.",
  },
  {
    title: "Payments and Plans",
    body: "Subscription or wallet-related features may require billing details and may be updated over time. Plan features and pricing may vary by release.",
  },
  {
    title: "Service Availability",
    body: "We aim to keep the platform available and reliable, but temporary maintenance, service interruption, or feature changes may occur.",
  },
];

export default function TermsAndConditionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#EAF1FF] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-white p-3 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Terms and Conditions</h1>
            <p className="text-sm text-slate-500">Important rules and expectations for using ParentBridge.</p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#7FBCFF] via-[#A7C2FF] to-[#BFA7FF] p-6 shadow-2xl shadow-sky-200/50 sm:p-8">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/20 text-white">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">Read before using</h2>
              <p className="mt-1 text-sm font-medium text-white/85">These terms describe your responsibilities and our service expectations.</p>
            </div>
          </div>
        </section>

        <section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.title} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                <h3 className="text-base font-black text-slate-800">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{section.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
