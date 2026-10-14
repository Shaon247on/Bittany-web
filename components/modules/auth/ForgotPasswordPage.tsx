"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { clearAuthStorage, parseApiError, useRequestPasswordResetMutation } from '@/hooks/useAuth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [fieldError, setFieldError] = useState('');

    useEffect(() => {
        clearAuthStorage();
    }, []);

    const requestResetMutation = useRequestPasswordResetMutation();

    const validateIdentifier = (value: string): boolean => {
        if (!value.trim()) {
            setFieldError('Email or phone number is required.');
            return false;
        }
        if (value.includes('@')) {
            if (!EMAIL_REGEX.test(value)) {
                setFieldError('Please enter a valid email address.');
                return false;
            }
        } else {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length < 8) {
                setFieldError('Please enter a valid phone number.');
                return false;
            }
        }
        setFieldError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEmail = identifier.includes('@');
        const normalizedIdentifier = isEmail ? identifier.trim().toLowerCase() : identifier.trim();
        const method = isEmail ? 'email' : 'phone';

        if (!validateIdentifier(normalizedIdentifier)) return;

        try {
            await requestResetMutation.mutateAsync({
                identifier: normalizedIdentifier,
                method,
            });

            toast.success(method === 'email' ? 'Check your email for the verification code.' : 'Check your phone for the verification code.');
            const queryParam = method === 'email' ? `email=${encodeURIComponent(normalizedIdentifier)}` : `phone=${encodeURIComponent(normalizedIdentifier)}`;
            router.push(`/otp?flow=password-reset&${queryParam}`);
        } catch (err: unknown) {
            const apiError = parseApiError(err);
            const errorMessage = apiError.message ?? 'Unable to send reset code right now.';
            toast.error(errorMessage);

            const fieldErr = apiError.fieldErrors?.identifier?.[0] ?? apiError.fieldErrors?.email?.[0] ?? apiError.fieldErrors?.phone?.[0];

            if (fieldErr) {
                setFieldError(fieldErr);
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

            <div className="relative z-10 w-full max-w-md flex flex-col">

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
                        Forgot password
                    </h1>
                    <p className="text-[#B0B0B0] text-base mt-3 leading-6">
                        Don&apos;t worry! Enter the email address or phone number linked with your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">

                    {/* Identifier input */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full px-5 h-14 border shadow-[0_4px_10px_rgba(196,161,255,0.1)] ${fieldError ? 'border-[#D62056]' : 'border-gray-100'}`}
                        >
                            <Mail size={20} color={fieldError ? '#D62056' : '#B0B0B0'} />
                            <input
                                type="text"
                                placeholder="Email or phone number"
                                value={identifier}
                                onChange={(e) => {
                                    setIdentifier(e.target.value);
                                    if (fieldError) setFieldError('');
                                }}
                                disabled={requestResetMutation.isPending}
                                autoComplete="username"
                                className="flex-1 ml-3 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0] disabled:opacity-60"
                            />
                        </div>
                        {fieldError && (
                            <p className="mt-1 ml-3 text-sm font-medium text-[#D62056]">{fieldError}</p>
                        )}
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={requestResetMutation.isPending}
                        className="mt-6 h-14 w-full rounded-full text-white text-lg font-bold transition-opacity hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(to right, #99D1E8, #C4A1FF)' }}
                    >
                        {requestResetMutation.isPending ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Sending...
                            </>
                        ) : (
                            'Send'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center mt-10 text-[#707070]">
                    Remember your password?{' '}
                    <Link href="/signin" className="text-[#88CCE1] font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default ForgotPasswordPage;
