"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { parseApiError, useOnboardingMutation } from "@/hooks/useAuth";
import { Copy } from "lucide-react";

const IndependentModePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();


  const onboardingDraftParam = searchParams.get("onboardingDraft");
  const rawNumber = searchParams.get("assignedNumber") ?? "";
  const assignedNumber = rawNumber.trim() ? rawNumber : "Unavailable";

  const [userPhone, setUserPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onboardingMutation = useOnboardingMutation();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(assignedNumber);
      toast.success("Phone number copied to clipboard.");
    } catch {
      toast.error("Unable to copy. Please copy it manually.");
    }
  };

  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPhone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!onboardingDraftParam) {
      toast.error("Missing onboarding data. Please start again.");
      router.replace("/basic-info");
      return;
    }
    setIsSubmitting(true);
    try {
      const onboardingDraft = JSON.parse(onboardingDraftParam);
      const response = await onboardingMutation.mutateAsync({
        ...onboardingDraft,
        partner_phone: userPhone,
        mode: "independent",
        operation_type: "continue",
      });
      toast.success(response?.message ?? "Account setup completed.");
      router.replace(
        `/home`
      );
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      toast.error(apiError.message ?? "Unable to complete onboarding right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white px-6 py-10">
      <div
        className="absolute rounded-full bg-[#EBF9FB] pointer-events-none"
        style={{ width: "110vw", height: "110vw", top: "-30vh", left: "-60vw" }}
      />
      <div
        className="absolute rounded-full bg-[#F5EEFF] pointer-events-none"
        style={{ width: "120vw", height: "120vw", bottom: "-30vh", right: "-50vw" }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col">
        <section
          className="w-full rounded-[30px] p-8 text-center shadow-[0_12px_24px_rgba(196,161,255,0.18)]"
          style={{ background: "linear-gradient(to right, #8ECCE3, #C4A1FF)" }}
        >
          <div className="mb-4 flex justify-center">
            <Image
              src="/illustrations/heart.png"
              alt="Independent mode"
              width={80}
              height={64}
              className="h-16 w-20 object-contain"
              priority
            />
          </div>

          <h1 className="mb-3 text-[28px] font-bold text-white">Independent mode</h1>

          <p className="px-2 text-[13px] leading-5 text-white/90">
            Use the app on your own to stay organized, track important information, and prepare for better communication.<br />
            <span className="block mt-2 text-[#FFF] font-semibold">
              Your phone number will be used to contact you via a secure Twilio number for all communications.
            </span>
          </p>
        </section>

        {onboardingDraftParam ? (
          <section className="mt-12 rounded-3xl bg-[#E6F7FD] p-6">
            <h2 className="mb-5 text-xl font-bold text-[#1D2E54]">Enter Your Phone Number</h2>
            <form onSubmit={handleSubmitPhone} className="flex flex-col gap-4">
              <input
                type="tel"
                className="rounded-xl border border-[#99D1E8] px-4 py-3 text-base text-[#1D2E54] focus:outline-none focus:ring-2 focus:ring-[#99D1E8]"
                placeholder="Your phone number"
                value={userPhone}
                onChange={e => setUserPhone(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-full bg-linear-to-r from-[#99D1E8] to-[#C4A1FF] text-lg font-bold text-white transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
            <p className="mt-4 text-[11px] leading-4 text-[#1D2E54]/70">
              Your number will be used to contact you via a secure Twilio number. You can change this later in settings.
            </p>
          </section>
        ) : (
          <section className="mt-12 rounded-3xl bg-[#E6F7FD] p-6">
            <h2 className="mb-5 text-xl font-bold text-[#1D2E54]">Your Assigned Number:</h2>
              <div className="mb-5 flex items-center justify-between">
                <div className="mr-3 flex h-14 flex-1 items-center rounded-xl bg-[#99D1E8] px-5">
                  <p className="truncate text-base font-semibold text-[#1D2E54]">{assignedNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#99D1E8] bg-[#99D1E8]/60 text-[#1D2E54]"
                  aria-label="Copy assigned number"
                >
                  <Copy size={22} />
                </button>
              </div>
              <p className="text-[11px] leading-4 text-[#1D2E54]/70">
                This is your secure Twilio number for all communications. All communication will be filtered and recorded through the app for your protection.
              </p>
            </section>
        )}

        {!onboardingDraftParam && (
          <div className="mt-auto pt-10">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="h-16 w-full rounded-full text-xl font-bold text-white"
              style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default IndependentModePage;
