"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ArrowLeft, Camera, Save, X } from "lucide-react";
import { toast } from "sonner";

import { useAuthProfileQuery, useUpdateProfileMutation } from "@/hooks/useAuth";
import type { UpdateProfileInput } from "@/types/auth.type";
import { BASE_URL } from "@/lib/axios";

type RoleValue = "mother" | "father";

type ProfileDraft = {
    name?: string;
    email?: string;
    phone?: string;
    stateValue?: string;
    role?: RoleValue;
    courtMandated?: boolean;
};

const OUTPUT_SIZE = 512;

async function createCroppedImageFile(file: File, pixelCrop: Area): Promise<File> {
    const imageUrl = URL.createObjectURL(file);

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Could not load selected image."));
            img.src = imageUrl;
        });

        const sx = Math.max(0, Math.floor(pixelCrop.x));
        const sy = Math.max(0, Math.floor(pixelCrop.y));
        const sWidth = Math.max(1, Math.floor(pixelCrop.width));
        const sHeight = Math.max(1, Math.floor(pixelCrop.height));

        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Image editor is unavailable in this browser.");

        ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (value) => {
                    if (value) resolve(value);
                    else reject(new Error("Could not process image."));
                },
                "image/jpeg",
                0.92,
            );
        });

        const baseName = file.name.replace(/\.[^.]+$/, "") || "profile-photo";
        return new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" });
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}

export default function ProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useAuthProfileQuery();
    const updateProfileMutation = useUpdateProfileMutation();

    const [draft, setDraft] = useState<ProfileDraft>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
    const [cropSourcePreviewUrl, setCropSourcePreviewUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isApplyingCrop, setIsApplyingCrop] = useState(false);

    const name = draft.name ?? profile?.name ?? "";
    const email = draft.email ?? profile?.email ?? "";
    const phone = draft.phone ?? profile?.phone ?? "";
    const stateValue = draft.stateValue ?? profile?.state ?? "";
    const role = draft.role ?? (profile?.role === "father" ? "father" : "mother");
    const courtMandated = draft.courtMandated ?? Boolean(profile?.court_mandated);

    const imagePreview = useMemo(() => {
        if (imageFile) return URL.createObjectURL(imageFile);
        if (profile?.image) return profile?.image.startsWith('http') ? profile?.image : `${BASE_URL}${profile?.image}`;
        return null;
    }, [imageFile, profile?.image]);

    useEffect(() => {
        return () => {
            if (imageFile && imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imageFile, imagePreview]);

    useEffect(() => {
        return () => {
            if (cropSourcePreviewUrl) {
                URL.revokeObjectURL(cropSourcePreviewUrl);
            }
        };
    }, [cropSourcePreviewUrl]);

    const closeCropModal = () => {
        if (cropSourcePreviewUrl) {
            URL.revokeObjectURL(cropSourcePreviewUrl);
        }
        setCropSourcePreviewUrl(null);
        setCropSourceFile(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setIsCropModalOpen(false);
    };

    const handleImagePick = (selectedFile: File | null) => {
        if (!selectedFile) return;
        if (!selectedFile.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }

        if (cropSourcePreviewUrl) {
            URL.revokeObjectURL(cropSourcePreviewUrl);
        }

        const previewUrl = URL.createObjectURL(selectedFile);
        setCropSourceFile(selectedFile);
        setCropSourcePreviewUrl(previewUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setIsCropModalOpen(true);
    };

    const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const applyCrop = async () => {
        if (!cropSourceFile) {
            closeCropModal();
            return;
        }

        if (!croppedAreaPixels) {
            toast.error("Adjust your image before applying.");
            return;
        }

        try {
            setIsApplyingCrop(true);
            const croppedFile = await createCroppedImageFile(cropSourceFile, croppedAreaPixels);
            setImageFile(croppedFile);
            closeCropModal();
            toast.success("Image cropped successfully.");
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err?.message ?? "Could not crop image.");
        } finally {
            setIsApplyingCrop(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Name is required.");
            return;
        }
        if (!email.trim()) {
            toast.error("Email is required.");
            return;
        }
        if (!email.includes("@")) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const payload: UpdateProfileInput = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            state: stateValue.trim(),
            role,
            court_mandated: courtMandated,
            image: imageFile,
        };

        try {
            await updateProfileMutation.mutateAsync(payload);
            await queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
            toast.success("Profile updated successfully.");
            router.replace("/settings");
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err?.message ?? "Unable to update profile right now.");
        }
    };

    return (
        <div className="min-h-screen bg-[#EAF1FF] px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-xl bg-white p-3 text-slate-700 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Update Profile</h1>
                        <p className="text-sm text-slate-500">Edit your account details and photo</p>
                    </div>
                </div>

                <section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
                    {isLoading ? (
                        <div className="flex items-center gap-3 py-8">
                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                            <span className="text-sm font-semibold text-slate-600">Loading profile...</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-5">
                                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-violet-500 to-sky-500 text-2xl font-black text-white">
                                    {imagePreview ? (
                                        <Image src={imagePreview} alt="Profile" fill className="object-cover" unoptimized />
                                    ) : (
                                        (name || "U")
                                            .split(" ")
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((part) => part[0])
                                            .join("")
                                            .toUpperCase()
                                    )}
                                </div>
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                                    <Camera size={16} />
                                    Upload Photo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            handleImagePick(e.target.files?.[0] ?? null);
                                            e.currentTarget.value = "";
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Full Name">
                                    <input value={name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" />
                                </Field>
                                <Field label="Email Address">
                                    <input value={email} readOnly disabled className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" />
                                </Field>
                                <Field label="Phone">
                                    <input value={phone} onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" />
                                </Field>
                                <Field label="State">
                                    <input value={stateValue} onChange={(e) => setDraft((prev) => ({ ...prev, stateValue: e.target.value }))} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" />
                                </Field>
                                <Field label="Role">
                                    <select value={role} onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value as RoleValue }))} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none">
                                        <option value="mother">Mother</option>
                                        <option value="father">Father</option>
                                    </select>
                                </Field>
                            </div>

                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={courtMandated}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, courtMandated: e.target.checked }))}
                                    className="h-4 w-4"
                                />
                                <span className="font-semibold">Court Mandated</span>
                            </label>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={updateProfileMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#99D1E8] to-[#C4A1FF] px-5 py-3 text-sm ml-5 font-black text-white shadow-lg shadow-violet-100 transition-opacity disabled:opacity-60"
                            >
                                {updateProfileMutation.isPending ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {isCropModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Crop and Resize Photo</h3>
                                <p className="text-xs text-slate-500">Adjust framing before saving your profile image.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeCropModal}
                                disabled={isApplyingCrop}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            <div className="space-y-3">
                                <div className="relative h-90 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                                    {cropSourcePreviewUrl ? (
                                        <Cropper
                                            image={cropSourcePreviewUrl}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={1}
                                            cropShape="round"
                                            showGrid={false}
                                            zoomSpeed={0.04}
                                            objectFit="contain"
                                            minZoom={0.5}
                                            maxZoom={3}
                                            onCropChange={setCrop}
                                            onZoomChange={setZoom}
                                            onCropComplete={onCropComplete}
                                        />
                                    ) : null}
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Zoom
                                    </label>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={3}
                                        step={0.01}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                                    Drag image to reposition. Recommended: centered face and clear lighting.
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeCropModal}
                                disabled={isApplyingCrop}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={applyCrop}
                                disabled={isApplyingCrop}
                                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#99D1E8] to-[#C4A1FF] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                            >
                                {isApplyingCrop ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Applying...
                                    </>
                                ) : (
                                    "Apply"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
            {children}
        </div>
    );
}
