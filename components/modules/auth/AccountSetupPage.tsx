"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type AccountSetupOption = "connect" | "invite" | null;

const AccountSetupPage = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] =
    useState<AccountSetupOption>(null);

  const handleNext = () => {
    if (!selectedOption) {
      toast.error("Please choose how you want to continue.");
      return;
    }

    if (selectedOption === "connect") {
      router.push("/join-account?option=connect");
      return;
    }

    router.push("/basic-info?option=invite");
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
          <h1 className="text-xl font-bold text-[#1D2E54]">Account Setup</h1>
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
          <h2 className="text-[28px] font-bold leading-9 text-[#1D2E54]">
            Connect with Your
            <br />
            Co-Parent
          </h2>
          <p className="mt-4 text-[15px] leading-6 text-[#B0B0B0]">
            We make it easy for co-parents to connect. If your co-parent has
            already created an account, you can join theirs directly without
            entering additional information. Otherwise, create your own account
            profile.
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedOption("connect")}
            className={`flex w-full items-center rounded-2xl border bg-white p-4 text-left shadow-[0_4px_10px_rgba(0,0,0,0.05)] ${
              selectedOption === "connect"
                ? "border-[#88CCE1]"
                : "border-gray-100"
            }`}
          >
            <div className="mr-4 flex h-14 w-14 items-center justify-center">
              <Image
                src="/images/couple-pink.png"
                alt="Connect to a partner"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-[17px] font-bold text-[#004D40]">
                Connect To A Partner
              </p>
              <p className="text-[13px] text-[#004D40]/70">
                Enter your co-parent&apos;s code to connect.
              </p>
            </div>
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                selectedOption === "connect"
                  ? "border-[#88CCE1]"
                  : "border-gray-300"
              }`}
            >
              {selectedOption === "connect" && (
                <div className="h-3 w-3 rounded-full bg-[#88CCE1]" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOption("invite")}
            className={`flex w-full items-center rounded-2xl border bg-white p-4 text-left shadow-[0_4px_10px_rgba(0,0,0,0.05)] ${
              selectedOption === "invite" ? "border-[#88CCE1]" : "border-gray-100"
            }`}
          >
            <div className="mr-4 flex h-14 w-14 items-center justify-center">
              <Image
                src="/images/info.png"
                alt="Continue and invite"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-[17px] font-bold text-[#004D40]">
                Continue And Invite Them
              </p>
              <p className="text-[13px] text-[#004D40]/70">
                I&apos;ll set up my profile first
              </p>
            </div>
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                selectedOption === "invite" ? "border-[#88CCE1]" : "border-gray-300"
              }`}
            >
              {selectedOption === "invite" && (
                <div className="h-3 w-3 rounded-full bg-[#88CCE1]" />
              )}
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedOption}
          className="mt-12 h-16 w-full rounded-full text-lg font-bold text-white transition-opacity disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(to right, #99D1E8, #C4A1FF)",
            opacity: selectedOption ? 1 : 0.5,
          }}
        >
          Next
        </button>
      </div>
    </main>
  );
};

export default AccountSetupPage;
