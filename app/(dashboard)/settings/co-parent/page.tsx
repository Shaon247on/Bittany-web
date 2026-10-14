"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Mail, Phone, User, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { useAuthProfileQuery } from "@/hooks/useAuth";
import { useBridgeInfoQuery, useCoParentContactsQuery } from "@/hooks/useBridge";

function formatDisplayName(value: string | null | undefined) {
  if (!value) return "Co-parent";

  const baseValue = value.includes("@") ? value.split("@")[0] : value;
  const normalized = baseValue.replace(/[._-]+/g, " ").trim();
  if (!normalized) return "Co-parent";

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function InfoRow({
  icon,
  label,
  value,
  copyValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
    copyValue?: string;
}) {
  const handleCopy = async () => {
    if (!copyValue) return;

    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success("Connection code copied to clipboard.");
    } catch {
      toast.error("Could not copy connection code.");
    }
  };

  return (
    <div>
      <p className="mb-3 ml-1 text-lg font-semibold text-[#1A3558]">{label}</p>
      <div className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          {icon}
        </div>
        <p className="text-sm font-medium text-slate-700 sm:text-base">{value}</p>
        {copyValue ? (
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="Copy connection code"
          >
            <Copy size={14} /> Copy
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function CoParentInfoPage() {
  const router = useRouter();
  const { data: profile } = useAuthProfileQuery();
  const bridgeInfoQuery = useBridgeInfoQuery();
  const coParentContactsQuery = useCoParentContactsQuery();

  const coParentInfo = useMemo(() => {
    const bridgeInfo = bridgeInfoQuery.data;
    const firstContact = coParentContactsQuery.data?.[0];
    const currentRole = profile?.role;

    const partnerEmail =
      currentRole === "father"
        ? bridgeInfo?.mother ?? firstContact?.email ?? "No email available"
        : currentRole === "mother"
          ? bridgeInfo?.father ?? firstContact?.email ?? "No email available"
          : firstContact?.email ?? bridgeInfo?.mother ?? bridgeInfo?.father ?? "No email available";

    const partnerName = firstContact?.name?.trim()
      ? firstContact.name
      : formatDisplayName(partnerEmail && partnerEmail !== "No email available" ? partnerEmail : null);

    const partnerPhone = firstContact?.phone_number?.trim() || firstContact?.phone?.trim() || "No phone available";

    return {
      name: partnerName,
      email: partnerEmail,
      phone: partnerPhone,
    };
  }, [bridgeInfoQuery.data, coParentContactsQuery.data, profile?.role]);

  const isLoading = bridgeInfoQuery.isLoading || coParentContactsQuery.isLoading;
  const hasHardError = bridgeInfoQuery.isError;
  const connectionCode = bridgeInfoQuery.data?.bridge_id;

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
            <h1 className="text-2xl font-black text-slate-800">Co-Parent Information</h1>
            <p className="text-sm text-slate-500">Bridge-linked co-parent details from your account data.</p>
          </div>
        </div>

        {hasHardError ? (
          <section className="rounded-4xl border border-rose-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-800">Could not load co-parent information</h2>
            <p className="mt-2 text-sm text-slate-500">This account may not have bridge data yet.</p>
          </section>
        ) : (
          <section className="rounded-4xl border border-slate-100 bg-[#F8F9FB] p-6 shadow-sm sm:p-7">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="h-16 animate-pulse rounded-3xl bg-white" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                    <InfoRow
                      icon={<User size={20} />}
                      label="Connection Code"
                      value={connectionCode ?? "No connection code available"}
                      copyValue={connectionCode}
                    />
                <InfoRow icon={<User size={20} />} label="Full Name" value={coParentInfo.name} />
                <InfoRow icon={<Mail size={20} />} label="Email" value={coParentInfo.email} />
                <InfoRow icon={<Phone size={20} />} label="Contact Number" value={coParentInfo.phone} />
              </div>
            )}

            <button
              type="button"
              onClick={() => toast.info("Co-parent editing is not available from current bridge APIs yet.")}
              className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#80D0FF] to-[#B399FF] px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-sky-100 transition-all hover:opacity-95"
            >
              <PencilLine size={16} /> Edit
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
