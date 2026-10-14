"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const JoinAccountPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accountCode, setAccountCode] = useState("");

  const validatePartnerCode = (code: string) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(code);
  };

  const handleNext = () => {
    const normalizedCode = accountCode.trim();

    if (!normalizedCode) {
      toast.error("Please enter your co-parent's account code.");
      return;
    }

    if (!validatePartnerCode(normalizedCode)) {
      toast.error("Partner code must be a valid UUID.");
      return;
    }

    const option = searchParams.get("option") === "connect" ? "connect" : "invite";
    router.push(
      `/basic-info?option=${option}&partnerCode=${encodeURIComponent(normalizedCode)}`,
    );
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white px-6 py-4">
      <div
        className="absolute rounded-full bg-[#EBF9FB] pointer-events-none"
        style={{ width: "110vw", height: "110vw", top: "-30vh", left: "-60vw" }}
      />
      <div
        className="absolute rounded-full bg-[#F5EEFF] pointer-events-none"
        style={{ width: "120vw", height: "120vw", bottom: "-30vh", right: "-50vw" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-md pb-10">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-[#1D2E54]"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-[#1D2E54]">Join Account</h1>
          <div className="w-10" />
        </div>

        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={120}
            className="object-contain"
            priority
          />
        </div>

        <div className="mb-8 text-center">
          <h2 className="px-2 text-[30px] font-bold leading-10 text-[#1D2E54]">
            Join Your Co-Parent&apos;s
            <br />
            Account
          </h2>
          <p className="mt-4 text-[15px] leading-6 text-[#B0B0B0]">
            Your co-parent can share their account code with you. Enter it below
            to connect and start co-parenting together without needing to provide
            additional information.
          </p>
        </div>

        <div className="mb-8 w-full">
          <label className="ml-1 mb-3 block text-lg font-semibold text-[#1D2E54]">
            Account Code
          </label>
          <div className="flex h-16 items-center rounded-2xl bg-[#F1F1F1] px-5">
            <input
              type="text"
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
              autoCapitalize="none"
              placeholder="Enter Your Partner's ID To Connect"
              className="w-full bg-transparent text-base text-[#1D2E54] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="mt-2 h-16 w-full rounded-full text-lg font-bold text-white"
          style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
        >
          Next
        </button>
      </div>
    </main>
  );
};

export default JoinAccountPage;
