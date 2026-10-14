"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronDown, MapPin, Phone, User, Users } from "lucide-react";
import { toast } from "sonner";

import {
  OnboardingPayload,
  parseApiError,
  useOnboardingMutation,
} from "@/hooks/useAuth";

type ChildForm = {
  id: string;
  name: string;
  dateOfBirth: string;
};

type FormState = {
  name: string;
  phone: string;
  state: string;
  courtMandated: string;
  inviteRole: string;
};

const courtOptions = ["Yes, it is mandated", "No, it is voluntary"];
const roleOptions = ["Mom", "Dad"];

const roleToApi = (role: string): "mother" | "father" | null => {
  if (role === "Mom") return "mother";
  if (role === "Dad") return "father";
  return null;
};

const BasicInfoPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const option = searchParams.get("option") === "connect" ? "connect" : "invite";
  const partnerCode = searchParams.get("partnerCode") ?? "";
  const invite = option === "invite";

  const onboardingMutation = useOnboardingMutation();

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    state: "",
    courtMandated: "",
    inviteRole: "",
  });

  const [children, setChildren] = useState<ChildForm[]>([]);
  const [openCourt, setOpenCourt] = useState(false);
  const [openRole, setOpenRole] = useState(false);

  useEffect(() => {
    if (invite && children.length === 0) {
      setChildren([{ id: crypto.randomUUID(), name: "", dateOfBirth: "" }]);
    }
  }, [invite]);

  const normalizedChildren = useMemo(
    () =>
      children
        .filter((child) => child.name.trim() && child.dateOfBirth.trim())
        .map((child) => ({
          name: child.name.trim(),
          date_of_birth: child.dateOfBirth,
        })),
    [children],
  );

  const addChild = () => {
    setChildren((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", dateOfBirth: "" },
    ]);
  };

  const removeChild = (id: string) => {
    setChildren((prev) => prev.filter((child) => child.id !== id));
  };

  const updateChild = (id: string, field: keyof Omit<ChildForm, "id">, value: string) => {
    setChildren((prev) =>
      prev.map((child) => (child.id === id ? { ...child, [field]: value } : child)),
    );
  };

  const handleCreateInfo = async () => {
    const apiRole = roleToApi(form.inviteRole);

    if (!form.name.trim() || !form.phone.trim() || !form.state.trim()) {
      toast.error("Name, phone, and state are required.");
      return;
    }

    if (!form.courtMandated) {
      toast.error("Please choose whether this is court mandated.");
      return;
    }

    if (!apiRole) {
      toast.error("Please choose Mom or Dad.");
      return;
    }

    if (option === "connect" && !partnerCode) {
      toast.error("Partner code missing. Please enter your co-parent code first.");
      router.replace("/join-account");
      return;
    }

    if (invite) {
      if (children.length === 0) {
        toast.error("Please add at least one child to continue.");
        return;
      }

      const hasIncompleteChild = children.some(
        (child) => !child.name.trim() || !child.dateOfBirth.trim()
      );
      if (hasIncompleteChild) {
        toast.error("Please fill in the name and date of birth for all children.");
        return;
      }
    }

    const onboardingDraft: Omit<OnboardingPayload, "mode"> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      state: form.state.trim(),
      court_mandated: form.courtMandated === "Yes, it is mandated",
      role: apiRole,
      operation_type: "continue",
      partner_code: option === "connect" ? partnerCode : undefined,
      children: invite ? normalizedChildren : [],
    };

    if (option === "connect") {
      try {
        const response = await onboardingMutation.mutateAsync({
          ...onboardingDraft,
          mode: "bridge",
          operation_type: "connect",
        });

        toast.success(response?.message ?? "Account setup completed.");

        router.replace(
          `/home?inviteCode=${encodeURIComponent(
            response?.data?.shareable_code ?? response?.data?.share_invite_code ?? "",
          )}`,
        );
      } catch (error: unknown) {
        const apiError = parseApiError(error);

        const isPartnerCodeError =
          (apiError.fieldErrors?.partner_code?.length ?? 0) > 0 ||
          (typeof apiError.message === "string" &&
            apiError.message.toLowerCase().includes("partner"));

        if (isPartnerCodeError) {
          toast.error("The account code you entered is incorrect. Please try again.");
          router.replace("/account-setup");
        } else {
          toast.error(apiError.message ?? "Unable to complete setup right now.");
        }
      }

      return;
    }

    router.push(
      `/mode-selector?onboardingDraft=${encodeURIComponent(
        JSON.stringify(onboardingDraft),
      )}`,
    );
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white px-6 py-8">
      <div
        className="absolute rounded-full bg-[#EBF9FB] pointer-events-none"
        style={{ width: "110vw", height: "110vw", top: "-30vh", left: "-60vw" }}
      />
      <div
        className="absolute rounded-full bg-[#F5EEFF] pointer-events-none"
        style={{ width: "120vw", height: "120vw", bottom: "-30vh", right: "-50vw" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-md pb-10">
        <div className="mb-6 flex justify-center">
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
          <h1 className="text-3xl font-bold tracking-tight text-[#1D2E54]">
            Basic Information
          </h1>
          <p className="mt-2 px-4 text-base text-[#B0B0B0]">
            We need some basic information to personalize your experience.
          </p>
        </div>

        <div className="space-y-4">
          <InputItem
            icon={<User size={20} color="#B0B0B0" />}
            placeholder="Enter your full name *"
            value={form.name}
            onChange={(value) => {
              const letters = value.replace(/\d+/g, "");
              if (letters !== value) {
                toast.error("Name cannot contain numbers.");
              }
              setForm((prev) => ({ ...prev, name: letters }));
            }}
            maxLength={50}
          />

          <InputItem
            icon={<Phone size={20} color="#B0B0B0" />}
            placeholder="Contact number *"
            value={form.phone}
            onChange={(value) => {
              const digits = value.replace(/\D/g, "");
              if (digits !== value) {
                toast.error("Phone number must contain only digits.");
              }
              setForm((prev) => ({ ...prev, phone: digits }));
            }}
            maxLength={15}
          />

          <InputItem
            icon={<MapPin size={20} color="#B0B0B0" />}
            placeholder="Enter your state *"
            value={form.state}
            onChange={(value) => setForm((prev) => ({ ...prev, state: value }))}
            maxLength={30}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenCourt((prev) => !prev)}
              className="flex h-16 w-full items-center rounded-full border border-gray-100 bg-white px-5 text-left shadow-[0_4px_12px_rgba(196,161,255,0.08)]"
            >
              <Users size={20} color="#B0B0B0" />
              <span
                className={`ml-3 flex-1 text-base ${form.courtMandated ? "text-[#1D2E54]" : "text-[#B0B0B0]"
                  }`}
              >
                {form.courtMandated || "Is use of this app court mandated? *"}
              </span>
              <ChevronDown size={18} color="#B0B0B0" />
            </button>

            {openCourt && (
              <div className="mt-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_4px_12px_rgba(196,161,255,0.08)]">
                {courtOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, courtMandated: item }));
                      setOpenCourt(false);
                    }}
                    className={`mb-2 flex h-14 w-full items-center justify-between rounded-full px-5 ${form.courtMandated === item ? "bg-[#E0F7FA]" : "bg-[#E0F7FA]/50"
                      }`}
                  >
                    <span className="text-base font-medium text-[#707070]">{item}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${form.courtMandated === item
                        ? "border-[#C4A1FF]"
                        : "border-gray-300"
                        }`}
                    >
                      {form.courtMandated === item && (
                        <span className="h-3.5 w-3.5 rounded-full bg-[#C4A1FF]" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenRole((prev) => !prev)}
              className="flex h-16 w-full items-center rounded-full border border-gray-100 bg-white px-5 text-left shadow-[0_4px_12px_rgba(196,161,255,0.08)]"
            >
              <Users size={20} color="#B0B0B0" />
              <span
                className={`ml-3 flex-1 text-base ${form.inviteRole ? "text-[#1D2E54]" : "text-[#B0B0B0]"
                  }`}
              >
                {form.inviteRole || "Select your role *"}
              </span>
              <ChevronDown size={18} color="#B0B0B0" />
            </button>

            {openRole && (
              <div className="mt-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_4px_12px_rgba(196,161,255,0.08)]">
                {roleOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, inviteRole: item }));
                      setOpenRole(false);
                    }}
                    className={`mb-2 flex h-14 w-full items-center justify-between rounded-full px-5 ${form.inviteRole === item ? "bg-[#E0F7FA]" : "bg-[#E0F7FA]/50"
                      }`}
                  >
                    <span className="text-base font-medium text-[#707070]">{item}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${form.inviteRole === item
                        ? "border-[#C4A1FF]"
                        : "border-gray-300"
                        }`}
                    >
                      {form.inviteRole === item && (
                        <span className="h-3.5 w-3.5 rounded-full bg-[#C4A1FF]" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {invite && (
            <section className="mt-6">
              <h2 className="mb-4 text-lg font-bold text-[#1D2E54]">Add Children</h2>

              {children.map((child, idx) => (
                <div key={child.id} className="mb-6 rounded-3xl bg-[#F5F5F5] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-base font-semibold text-[#1D2E54]">Child {idx + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      className="text-sm font-semibold text-[#FF6B6B]"
                    >
                      Remove
                    </button>
                  </div>

                  <InputItem
                    icon={<User size={18} color="#B0B0B0" />}
                    placeholder="Child name *"
                    value={child.name}
                    onChange={(value) => {
                      const letters = value.replace(/\d+/g, "");
                      if (letters !== value) {
                        toast.error("Child name cannot contain numbers.");
                      }
                      updateChild(child.id, "name", letters);
                    }}
                    compact
                    maxLength={50}
                  />

                  <div className="mt-3 flex h-14 items-center rounded-full border border-gray-100 bg-white px-5 shadow-[0_4px_12px_rgba(196,161,255,0.08)]">
                    <Calendar size={18} color="#B0B0B0" />
                    {/* <span className="ml-3 text-base text-[#B0B0B0] whitespace-nowrap">Date of birth *</span> */}
                    <input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={child.dateOfBirth}
                      onChange={(e) => updateChild(child.id, "dateOfBirth", e.target.value)}
                      className="ml-3 w-full bg-transparent text-base text-[#1D2E54] outline-none animate-fade-in"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addChild}
                className="mb-4 flex h-14 w-full items-center justify-center rounded-full border border-[#99D1E8] bg-[#E0F7FA] text-base font-semibold text-[#00BCD4]"
              >
                Add Child
              </button>
            </section>
          )}
        </div>

        <button
          type="button"
          onClick={handleCreateInfo}
          disabled={onboardingMutation.isPending}
          className="mt-6 flex h-16 w-full items-center justify-center gap-2 rounded-full text-lg font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
        >
          {onboardingMutation.isPending ? (
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Setting up...
            </>
          ) : (
            "Create Info"
          )}
        </button>
      </div>
    </main>
  );
};

const InputItem = ({
  icon,
  placeholder,
  value,
  onChange,
  compact = false,
  maxLength,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  maxLength?: number;
}) => (
  <div
    className={`flex items-center rounded-full border border-gray-100 bg-white px-5 shadow-[0_4px_12px_rgba(196,161,255,0.08)] ${compact ? "h-14" : "h-16"
      }`}
  >
    {icon}
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="ml-3 w-full bg-transparent text-base text-[#1D2E54] outline-none placeholder:text-[#B0B0B0]"
    />
  </div>
);

export default BasicInfoPage;
