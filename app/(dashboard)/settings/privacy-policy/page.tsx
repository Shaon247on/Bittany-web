"use client";

import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const privacySections = [
  {
    title: "Information We Collect",
    body: "We may collect account details, profile information, communication records, voice call logs, uploaded documents, and service usage data needed to operate the platform.",
  },
  {
    title: "How Information Is Used",
    body: "Your information is used to provide ParentBridge features, improve reliability, support communication flows (including SMS and voice call routing via Twilio and ZEGOCLOUD), and maintain account security.",
  },
  {
    title: "Sharing and Third-Party Services",
    body: "We work with trusted third-party service providers including Twilio for SMS and phone-based voice communications, and ZEGOCLOUD for real-time in-app audio and voice calls. Shared family information may be visible to connected co-parents or linked participants. We do not share or sell your personal information. No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.",
  },
  {
    title: "Storage and Security",
    body: "We use reasonable safeguards to protect stored data, but no online platform can guarantee absolute security. Users should also protect their own devices and credentials.",
  },
  {
    title: "Your Choices",
    body: "You can update profile details, adjust notification preferences, and manage certain uploaded records through the application experience.",
  },
];

export default function PrivacyPolicyPage() {
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
            <h1 className="text-2xl font-black text-slate-800">Privacy and Policy</h1>
            <p className="text-sm text-slate-500">How your information is handled, stored, and protected.</p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#88D7C2] via-[#8EC5FF] to-[#B399FF] p-6 shadow-2xl shadow-emerald-200/50 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/20 text-white">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">Your privacy matters</h2>
              <p className="mt-1 text-sm font-medium text-white/85">Understand what data is used and how ParentBridge protects it.</p>
            </div>
          </div>
        </section>

        <section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            {privacySections.map((section) => (
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
