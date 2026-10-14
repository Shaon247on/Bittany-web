"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const BridgeModePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawCode = searchParams.get("inviteCode") ?? "";
  const inviteCode = rawCode.trim() ? rawCode : "Unavailable";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied to clipboard.");
    } catch {
      toast.error("Unable to copy. Please copy it manually.");
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

      <div className="relative z-10 mx-auto w-full max-w-md">
        <section
          className="w-full rounded-[30px] p-8 text-center shadow-[0_12px_24px_rgba(196,161,255,0.25)]"
          style={{ background: "linear-gradient(to right, #8ECCE3, #C4A1FF)" }}
        >
          <div className="mb-4 flex justify-center">
            <Image
              src="/illustrations/bridge.png"
              alt="Bridge mode"
              width={96}
              height={56}
              className="h-14 w-24 object-contain"
              priority
            />
          </div>

          <h1 className="mb-3 text-3xl font-bold text-white">Bridge Mode</h1>

          <p className="px-2 text-[13px] leading-5 text-white/90">
            Add your co-parent to start communicating. You can call them right
            away, and they&apos;ll get an invitation to join for full app features
            like shared calendars and filtered messaging.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="ml-1 mb-4 text-xl font-bold text-[#1D2E54]">
            Share Invite code:
          </h2>

          <div className="flex items-center justify-between">
            <div className="mr-4 flex h-16 flex-1 items-center rounded-2xl bg-[#F1F1F1] px-5">
              <p className="truncate text-sm font-medium text-[#1D2E54]">
                {inviteCode}
              </p>
            </div>

            <button
              type="button"
              onClick={copyToClipboard}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C4A1FF] text-white shadow-[0_6px_16px_rgba(196,161,255,0.45)]"
              aria-label="Copy invite code"
            >
              <Copy size={22} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#C4A1FF] px-5 py-3 text-white shadow-[0_6px_16px_rgba(196,161,255,0.45)]"
          >
            Continue
          </button>
        </section>
      </div>
    </main>
  );
};

export default BridgeModePage;
