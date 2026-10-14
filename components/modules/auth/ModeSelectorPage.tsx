"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OnboardingPayload, parseApiError, useOnboardingMutation } from "@/hooks/useAuth";

type Mode = "independent" | "bridge";

const ModeSelectorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboardingMutation = useOnboardingMutation();

  const [selectedMode, setSelectedMode] = useState<Mode>("bridge");

  const onboardingDraftParam = searchParams.get("onboardingDraft");

  const onboardingDraft = useMemo(() => {
    if (!onboardingDraftParam) return null;

    try {
      return JSON.parse(onboardingDraftParam) as Omit<OnboardingPayload, "mode">;
    } catch {
      return null;
    }
  }, [onboardingDraftParam]);

  const handleSetUp = async () => {
    if (!onboardingDraftParam) {
      toast.error("Please complete basic information first.");
      router.replace("/basic-info");
      return;
    }

    if (!onboardingDraft) {
      toast.error("Invalid setup data. Please fill your basic info again.");
      router.replace("/basic-info");
      return;
    }

    if (selectedMode === "independent") {
      // Go to independent-mode screen for number input
      router.replace(
        `/independent-mode?onboardingDraft=${encodeURIComponent(onboardingDraftParam)}`
      );
      return;
    }

    try {
      const response = await onboardingMutation.mutateAsync({
        ...onboardingDraft,
        mode: selectedMode,
        operation_type: "continue",
      });

      toast.success(response?.message ?? "Account setup completed.");

      if (selectedMode === "bridge") {
        router.replace(
          `/bridge-mode?inviteCode=${encodeURIComponent(
            response?.data?.share_invite_code ?? response?.data?.shareable_code ?? "",
          )}`,
        );
        return;
      }
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      toast.error(apiError.message ?? "Unable to complete onboarding right now.");
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

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col justify-center">
        <div className="mb-10 text-center">
          <h1 className="text-[32px] font-bold leading-10 text-[#1D2E54]">
            Choose How You Want to
            <br />
            Use the App
          </h1>
          <p className="mx-auto mt-6 max-w-2xl px-4 text-base leading-6 text-[#9E9E9E]">
            Select the option that best fits your co-parenting situation. You can
            always change it later.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSelectedMode("independent")}
            className={`rounded-2xl border bg-white px-4 py-3 text-left shadow-[0_4px_10px_rgba(196,161,255,0.05)] ${
              selectedMode === "independent"
                ? "border-[#99D1E8]"
                : "border-gray-100"
            }`}
          >
            <div className="flex h-full flex-col items-center justify-center p-2">
              <Image
                src="/illustrations/heart.png"
                alt="Independent mode"
                width={40}
                height={40}
                className="mb-3 h-10 w-10 object-contain"
              />
              <h2 className="mb-2 text-center text-lg font-bold text-[#1D2E54]">
                Independent mode
              </h2>
              <p className="text-center text-[11px] leading-4 text-[#9E9E9E]">
                Use the app on your own to stay organized, track important
                information, and prepare for better communication. You&apos;ll
                receive a secure number to connect with our support team when
                needed.<br />
                <span className="block mt-2 text-[#1D2E54] font-semibold">
                  You will be asked to enter your phone number. This number will be used to contact you via a Twilio number for secure communication.
                </span>
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode("bridge")}
            className="rounded-2xl px-4 py-3 text-left"
            style={{
              background: "linear-gradient(to right, #99D1E8, #C4A1FF)",
            }}
          >
            <div className="flex h-full flex-col items-center justify-center p-2">
              <Image
                src="/illustrations/bridge.png"
                alt="Bridge mode"
                width={80}
                height={40}
                className="mb-3 h-10 w-20 object-cover"
              />
              <h2 className="mb-2 text-center text-lg font-bold text-white">
                Bridge mode
              </h2>
              <p className="text-center text-[11px] leading-4 text-white/90">
                Invite your co-parent to join the app so you can both
                communicate, coordinate schedules, and manage responsibilities in
                one place.
              </p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSetUp}
          disabled={onboardingMutation.isPending}
          className="mx-auto flex h-16 w-full max-w-xl items-center justify-center gap-2 rounded-full text-xl font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
        >
          {onboardingMutation.isPending ? (
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Setting up...
            </>
          ) : (
            "Set Up Together"
          )}
        </button>
      </div>
    </main>
  );
};

export default ModeSelectorPage;
