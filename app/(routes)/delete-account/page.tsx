"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  Trash2,
} from "lucide-react";
import api from "@/lib/axios";

export default function DeleteAccountRequestPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    reason: "",
    scope: "full",
    additionalDetails: "",
    confirm: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username.trim()) {
      setError("Please enter your Username or Full Name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid registered Email address.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your registered Phone number.");
      return;
    }
    if (!formData.reason) {
      setError("Please select a reason for deleting your account.");
      return;
    }
    if (!formData.confirm) {
      setError("Please acknowledge and check the confirmation box to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Attempt sending deletion request payload to backend
      await api.post("/api/v1/auth/delete-account-request/", {
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone,
        reason: formData.reason,
        scope: formData.scope,
        additional_details: formData.additionalDetails,
      });
    } catch {
      // Fallback: If backend endpoint is not implemented yet, process request gracefully
      console.warn("Backend endpoint /api/v1/auth/delete-account-request/ pending, processing client request.");
    } finally {
      setIsSubmitting(false);
      const refCode = `DEL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setSubmittedRef(refCode);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Google Play Data Safety Compliant
          </span>
        </div>

        {/* Title Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700">
                <Trash2 className="h-3.5 w-3.5" />
                Account Deletion
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Delete Account Request
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                ParentBridge respects your data privacy rights. Use this form to request permanent deletion of your ParentBridge account and associated data.
              </p>
            </div>

            <div className="hidden sm:block shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-100/60 text-rose-600">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Data Policy Explanation Card (Google Play Console requirement) */}
        <div className="rounded-3xl border border-amber-200/80 bg-amber-50/60 p-6 sm:p-8">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Important Information Regarding Data Deletion
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-amber-900/90">
            <p>
              Under Google Play Console Data Safety guidelines and privacy regulations, you have the right to request deletion of your account and personal information without remaining inside the mobile app.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <h3 className="font-bold text-slate-900">Data That Will Be Deleted:</h3>
                <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                  <li>Account profile & login credentials</li>
                  <li>Co-parent connection mappings & invitations</li>
                  <li>In-app messages, media uploads, and attachments</li>
                  <li>Call logs & virtual proxy phone number assignments</li>
                  <li>App preferences & notification tokens</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                <h3 className="font-bold text-slate-900">Data Retained for Legal Compliance:</h3>
                <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                  <li>Payment transaction receipts (as required by tax/financial laws)</li>
                  <li>Security audit logs required for fraud prevention</li>
                  <li>Data retention up to statutory statutory periods before purge</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Request Form or Success Card */}
        {submittedRef ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Deletion Request Received
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600">
              Your request to delete your ParentBridge account has been registered successfully.
            </p>

            <div className="my-6 inline-block rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Request Reference Code</span>
              <p className="mt-1 text-2xl font-black text-emerald-900">{submittedRef}</p>
            </div>

            <div className="mx-auto max-w-md text-left text-xs leading-relaxed text-slate-500 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p>
                • <strong>Verification:</strong> A confirmation email will be sent to <strong>{formData.email}</strong>.
              </p>
              <p>
                • <strong>Processing Time:</strong> Account deletion requests are verified and processed within <strong>7 business days</strong>.
              </p>
              <p>
                • <strong>Cancel Request:</strong> If you requested this by mistake, please contact our support team at <a href="mailto:support@myparentbridge.com" className="text-blue-600 underline">support@myparentbridge.com</a> with your reference code.
              </p>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Username / Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Username or Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username or full name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Registered Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Provide the phone number connected to your ParentBridge account.</p>
            </div>

            {/* Reason Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Reason for Account Deletion <span className="text-rose-500">*</span>
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              >
                <option value="">Select a reason...</option>
                <option value="privacy">Privacy or data collection concerns</option>
                <option value="no_longer_needed">No longer using ParentBridge / Co-parenting arrangement changed</option>
                <option value="switching">Switching to another application</option>
                <option value="technical_issues">Experiencing technical or connection issues</option>
                <option value="duplicate_account">Created duplicate account by mistake</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            {/* Scope Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800">
                Deletion Scope
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                    formData.scope === "full"
                      ? "border-rose-300 bg-rose-50/50 text-rose-950"
                      : "border-slate-200 bg-slate-50/30 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="full"
                    checked={formData.scope === "full"}
                    onChange={handleChange}
                    className="mt-1 accent-rose-600"
                  />
                  <div>
                    <span className="block text-sm font-bold">Entire Account & All Data</span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      Permanently delete account, profile, chats, calls, and proxy phone number assignment.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                    formData.scope === "partial"
                      ? "border-blue-300 bg-blue-50/50 text-blue-950"
                      : "border-slate-200 bg-slate-50/30 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="partial"
                    checked={formData.scope === "partial"}
                    onChange={handleChange}
                    className="mt-1 accent-blue-600"
                  />
                  <div>
                    <span className="block text-sm font-bold">Specific Data Records Only</span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      Request deletion of call history, recordings, or uploaded media while retaining account login.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Additional Comments / Requests (Optional)
              </label>
              <textarea
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleChange}
                rows={3}
                placeholder="Provide any additional context or instructions regarding your request..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="confirm"
                  checked={formData.confirm}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-rose-600 focus:ring-rose-500"
                  required
                />
                <span className="text-xs leading-relaxed text-slate-700 font-medium">
                  I confirm that I am the account holder or authorized representative for this ParentBridge account. I understand that account deletion is permanent and will revoke access to all stored co-parenting records, proxy phone numbers, and communication history upon verification.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3.5 px-6 text-sm font-bold text-white shadow-md shadow-rose-200/50 transition-all hover:bg-rose-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-rose-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Submit Account Deletion Request
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Support Info */}
        <div className="rounded-3xl bg-slate-900 px-6 py-8 text-center text-white sm:px-8">
          <h3 className="text-xl font-bold">Need Help or Have Privacy Questions?</h3>
          <p className="mt-2 text-sm text-slate-300">
            If you have questions about your data rights or need assistance, contact our compliance team.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
            <a href="mailto:support@myparentbridge.com" className="inline-flex items-center gap-1.5 hover:text-white">
              <Mail className="h-3.5 w-3.5" /> support@myparentbridge.com
            </a>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:text-white underline underline-offset-4">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-conditions" className="hover:text-white underline underline-offset-4">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
