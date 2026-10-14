"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { clearAuthStorage, parseApiError, useResetPasswordMutation } from '@/hooks/useAuth';

const ResetPasswordPage = () => {
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    useEffect(() => {
        clearAuthStorage();
    }, []);

    const resetPasswordMutation = useResetPasswordMutation();

    const validatePasswords = (): boolean => {
        const errors: { password?: string; confirmPassword?: string } = {};

        if (!password.trim()) {
            errors.password = 'Password is required.';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters.';
        }

        if (!confirmPassword.trim()) {
            errors.confirmPassword = 'Confirm password is required.';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePasswords()) return;

        try {
            await resetPasswordMutation.mutateAsync({ new_password: password });

            toast.success('Your password has been successfully updated.');
            // Clear the temp token and any authenticated session tokens
            sessionStorage.removeItem('reset_token');
            clearAuthStorage();
            router.replace('/password-reset-success');
        } catch (err: unknown) {
            const apiError = parseApiError(err);
            const passwordError = Array.isArray(apiError.fieldErrors?.password)
                ? apiError.fieldErrors.password[0]
                : (apiError.fieldErrors?.password as string | undefined);
            const nonFieldError = Array.isArray(apiError.fieldErrors?.non_field_errors)
                ? apiError.fieldErrors.non_field_errors[0]
                : (apiError.fieldErrors?.non_field_errors as string | undefined);

            const firstFieldError = passwordError ?? nonFieldError;
            const errorMessage = firstFieldError ?? apiError.message ?? 'Unable to reset password right now.';

            toast.error(errorMessage);

            if (firstFieldError) {
                setFieldErrors((prev) => ({ ...prev, password: firstFieldError }));
            }
        }
    };

    return (
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-white overflow-hidden px-6 py-12">

            {/* Background blobs */}
            <div
                className="absolute bg-[#EBF9FB] rounded-full pointer-events-none"
                style={{ width: '110vw', height: '110vw', top: '-30vh', left: '-60vw' }}
            />
            <div
                className="absolute bg-[#F5EEFF] rounded-full pointer-events-none"
                style={{ width: '120vw', height: '120vw', bottom: '-30vh', right: '-50vw' }}
            />

            <div className="relative z-10 w-full max-w-md">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Image
                        src="/images/logo.png"
                        alt="Logo"
                        width={120}
                        height={120}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-[#1D2E54] text-3xl font-bold tracking-tight">
                        Create new password
                    </h1>
                    <p className="text-[#B0B0B0] text-base mt-3 leading-6">
                        Your new password must be unique from those previously used.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

                    {/* New Password */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full px-5 h-14 border shadow-[0_4px_10px_rgba(196,161,255,0.12)] ${fieldErrors.password ? 'border-[#D62056]' : 'border-gray-100'}`}
                        >
                            <Lock size={20} color={fieldErrors.password ? '#D62056' : '#B0B0B0'} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                                }}
                                disabled={resetPasswordMutation.isPending}
                                autoComplete="new-password"
                                className="flex-1 ml-3 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0] disabled:opacity-60"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={resetPasswordMutation.isPending}
                                className="text-[#B0B0B0] hover:text-[#888] transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="mt-1 ml-3 text-sm font-medium text-[#D62056]">{fieldErrors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full px-5 h-14 border shadow-[0_4px_10px_rgba(196,161,255,0.12)] ${fieldErrors.confirmPassword ? 'border-[#D62056]' : 'border-gray-100'}`}
                        >
                            <Lock size={20} color={fieldErrors.confirmPassword ? '#D62056' : '#B0B0B0'} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                                }}
                                disabled={resetPasswordMutation.isPending}
                                autoComplete="new-password"
                                className="flex-1 ml-3 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0] disabled:opacity-60"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={resetPasswordMutation.isPending}
                                className="text-[#B0B0B0] hover:text-[#888] transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {fieldErrors.confirmPassword && (
                            <p className="mt-1 ml-3 text-sm font-medium text-[#D62056]">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={resetPasswordMutation.isPending}
                        className="mt-7 h-14 w-full rounded-full text-white text-lg font-bold transition-opacity hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(to right, #99D1E8, #C4A1FF)' }}
                    >
                        {resetPasswordMutation.isPending ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
};

export default ResetPasswordPage;
