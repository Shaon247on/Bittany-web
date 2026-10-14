"use client";

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
    authResponseUtils,
    parseApiError,
    useActivateAccountMutation,
    useActivatePasswordResetMutation,
    useRequestPasswordResetMutation,
    useResendActivationOtpMutation,
} from '@/hooks/useAuth';

const OtpPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawFlow = searchParams.get('flow') ?? '';
    const email = (searchParams.get('email') ?? '').trim().toLowerCase();
    const phone = (searchParams.get('phone') ?? '').trim();
    const flow = rawFlow === 'password-reset' ? 'password-reset' : 'activation';

    const targetIdentifier = phone ? phone : email;
    const isPhone = Boolean(phone);

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [resendCountdown, setResendCountdown] = useState(120);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const activateAccountMutation = useActivateAccountMutation();
    const activatePasswordResetMutation = useActivatePasswordResetMutation();
    const requestPasswordResetMutation = useRequestPasswordResetMutation();
    const resendActivationOtpMutation = useResendActivationOtpMutation();

    const isVerifyingOtp =
        activateAccountMutation.isPending || activatePasswordResetMutation.isPending;

    const isResendingOtp =
        requestPasswordResetMutation.isPending || resendActivationOtpMutation.isPending;

    // Countdown timer
    useEffect(() => {
        if (resendCountdown <= 0) return;
        const interval = setInterval(() => {
            setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [resendCountdown]);

    const handleChange = (value: string, index: number) => {
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const newOtp = [...otp];
        pasted.split('').forEach((char, i) => { newOtp[i] = char; });
        setOtp(newOtp);
        const nextFocus = Math.min(pasted.length, 5);
        inputs.current[nextFocus]?.focus();
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (flow === 'activation' && !phone) {
            toast.error('Missing phone number — please restart this flow.');
            return;
        }
        if (flow === 'password-reset' && !email && !phone) {
            toast.error('Missing identifier — please restart this flow.');
            return;
        }
        if (otpCode.length !== 6) {
            toast.error('Enter the 6-digit OTP.');
            return;
        }

        try {
            if (flow === 'password-reset') {
                const isEmail = Boolean(email);
                const identifierValue = isEmail ? email : phone;
                const response = await activatePasswordResetMutation.mutateAsync({
                    identifier: identifierValue,
                    otp: otpCode,
                });
                // Store temporary token for reset-password page
                if (response.access_token) {
                    sessionStorage.setItem('reset_token', response.access_token);
                }
                toast.success(response.detail ?? 'OTP verified.');
                router.replace('/reset-password');
                return;
            }

            const response = await activateAccountMutation.mutateAsync({ phone, otp: otpCode });
            toast.success(response.message ?? 'Account activated successfully.');
            router.replace('/signin');
        } catch (err: unknown) {
            const apiError = parseApiError(err);
            toast.error(apiError.message ?? 'Unable to verify OTP right now.');
        }
    };

    const handleResend = async () => {
        if (flow === 'activation' && !phone) {
            toast.error('Missing phone number — please restart this flow.');
            return;
        }
        if (flow === 'password-reset' && !email && !phone) {
            toast.error('Missing identifier — please restart this flow.');
            return;
        }
        if (resendCountdown > 0) {
            toast.error(`Please wait ${resendCountdown}s before resending.`);
            return;
        }

        try {
            if (flow === 'password-reset') {
                const isEmail = Boolean(email);
                const identifierValue = isEmail ? email : phone;
                const method = isEmail ? 'email' : 'phone';

                const response = await requestPasswordResetMutation.mutateAsync({
                    identifier: identifierValue,
                    method,
                });
                toast.success(authResponseUtils.getApiMessage(response as { message: string }));
            } else {
                const response = await resendActivationOtpMutation.mutateAsync({ phone });
                toast.success(authResponseUtils.getApiMessage(response as { message: string }));
            }
            setResendCountdown(300);
        } catch (err: unknown) {
            const apiError = parseApiError(err);
            toast.error(apiError.message ?? 'Unable to resend OTP right now.');
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

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">

                {/* Logo */}
                <div className="mb-8">
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
                    <h1 className="text-[#1D2E54] text-[32px] font-bold tracking-tight">
                        OTP Verification
                    </h1>
                    <p className="text-[#B0B0B0] text-base mt-3 leading-6">
                        Enter the verification code we just sent to your<br />
                        <span className="font-semibold text-[#1D2E54]">
                            {isPhone ? 'phone number' : 'email address'}
                        </span>:
                        <br />
                        <span className="font-bold text-[#88CCE1]">{targetIdentifier}</span>
                    </p>
                </div>

                <form onSubmit={handleSend} className="w-full flex flex-col items-center gap-10">

                    {/* OTP Inputs */}
                    <div className="flex justify-center w-full gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-[#1D2E54] text-xl sm:text-2xl font-bold rounded-xl border border-[#DED4FF] bg-white shadow-[0_4px_8px_rgba(196,161,255,0.1)] outline-none focus:border-[#C4A1FF] focus:ring-2 focus:ring-[#C4A1FF]/30 transition-all"
                            />
                        ))}
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="w-full h-14 rounded-full text-white text-lg font-bold transition-opacity hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(to right, #99D1E8, #C4A1FF)' }}
                    >
                        {isVerifyingOtp ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Verifying...
                            </>
                        ) : (
                            'Send'
                        )}
                    </button>
                </form>

                {/* Resend */}
                <div className="mt-10 flex items-center gap-1 text-base">
                    <span className="text-[#707070]">Didn&apos;t receive code?</span>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCountdown > 0 || isResendingOtp}
                        className={`font-semibold transition-colors ${(resendCountdown > 0 || isResendingOtp) ? 'text-[#A7B4C3] cursor-not-allowed' : 'text-[#88CCE1] hover:underline'}`}
                    >
                        {isResendingOtp
                            ? 'Resending...'
                            : resendCountdown > 0
                                ? `Resend in ${resendCountdown}s`
                                : 'Resend'}
                    </button>
                </div>
            </div>
        </main>
    );
};

export default OtpPage;
