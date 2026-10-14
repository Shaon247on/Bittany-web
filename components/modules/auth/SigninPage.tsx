"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { ApiError, parseApiError, useLoginMutation } from '@/hooks/useAuth';
import GoogleLoginButton from '@/components/global/GoogleLoginButton';

type SigninFieldErrors = {
    identifier?: string;
    password?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SigninPage = () => {
    const router = useRouter();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<SigninFieldErrors>({});

    const loginMutation = useLoginMutation();

    const clearFieldError = (field: keyof SigninFieldErrors) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateForm = (normalizedIdentifier: string): boolean => {
        const nextErrors: SigninFieldErrors = {};

        if (!normalizedIdentifier) {
            nextErrors.identifier = 'Email or phone number is required.';
        } else if (normalizedIdentifier.includes('@')) {
            if (!EMAIL_REGEX.test(normalizedIdentifier)) {
                nextErrors.identifier = 'Please enter a valid email address.';
            }
        } else {
            const digitsOnly = normalizedIdentifier.replace(/\D/g, '');
            if (digitsOnly.length < 8) {
                nextErrors.identifier = 'Please enter a valid phone number.';
            }
        }

        if (!password.trim()) {
            nextErrors.password = 'Password is required.';
        }

        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        const isEmail = identifier.includes('@');
        const normalizedIdentifier = isEmail ? identifier.trim().toLowerCase() : identifier.trim();
        const method = isEmail ? 'email' : 'phone';

        if (!validateForm(normalizedIdentifier)) {
            return;
        }

        setFieldErrors({});

        try {
            const response = await loginMutation.mutateAsync({
                identifier: normalizedIdentifier,
                method,
                password,
            });

            // Store token if remember me or just session
            if (response.access_token) {
                if (rememberMe) {
                    localStorage.setItem('token', response.access_token);
                } else {
                    sessionStorage.setItem('token', response.access_token);
                    localStorage.removeItem('token');
                }
            }

            if (response.redirect === 'activation') {
                toast.error('Verification required — ' + (response.detail ?? response.message ?? 'Please verify your account.'));
                const queryParam = method === 'email' ? `email=${encodeURIComponent(normalizedIdentifier)}` : `phone=${encodeURIComponent(normalizedIdentifier)}`;
                router.push(`/otp?flow=activation&${queryParam}`);
                return;
            }

            if (response.onboarding_completed === false) {
                toast.info('Please complete your account setup to continue.');
                router.replace('/account-setup');
                return;
            }

            toast.success(response.message ?? 'Successfully logged in.');
            router.replace('/home');
        } catch (err) {
            const apiError = parseApiError(err) as ApiError;

            const isNotVerified =
                apiError.redirect === 'activation' ||
                apiError.message?.toLowerCase().includes('not verified') ||
                apiError.message?.toLowerCase().includes('activate your account');

            if (isNotVerified) {
                toast.error(apiError.message ?? 'Verification required. Please check for the OTP to activate your account.');
                const queryParam = method === 'email' ? `email=${encodeURIComponent(normalizedIdentifier)}` : `phone=${encodeURIComponent(normalizedIdentifier)}`;
                router.push(`/otp?flow=activation&${queryParam}`);
                return;
            }

            const nextFieldErrors: SigninFieldErrors = {
                identifier: apiError.fieldErrors?.identifier?.[0] ?? apiError.fieldErrors?.email?.[0] ?? apiError.fieldErrors?.phone?.[0],
                password:
                    apiError.fieldErrors?.password?.[0] ??
                    apiError.fieldErrors?.non_field_errors?.[0],
            };

            setFieldErrors(nextFieldErrors);

            const hasInlineFieldError = Boolean(nextFieldErrors.identifier || nextFieldErrors.password);
            if (!hasInlineFieldError) {
                toast.error(apiError.message ?? 'Unable to login right now.');
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
                <div className="flex justify-center mb-6">
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
                <div className="text-center mb-8">
                    <h1 className="text-[#1D2E54] text-3xl font-bold tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-[#B0B0B0] text-base mt-2">
                        Sign in to continue your co-parenting journey
                    </p>
                </div>

                <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-4">

                    {/* Identifier */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full px-5 h-14 border shadow-[0_4px_20px_rgba(196,161,255,0.1)] ${fieldErrors.identifier ? 'border-[#D62056]' : 'border-gray-200'}`}
                        >
                            <Mail size={20} color="#B0B0B0" />
                            <input
                                type="text"
                                placeholder="Email or phone number"
                                value={identifier}
                                onChange={(e) => { setIdentifier(e.target.value); clearFieldError('identifier'); }}
                                autoComplete="username"
                                className="flex-1 ml-3 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0]"
                            />
                        </div>
                        {fieldErrors.identifier && (
                            <p className="mt-1 ml-3 text-xs font-medium text-[#D62056]">{fieldErrors.identifier}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full px-5 h-14 border shadow-[0_4px_20px_rgba(196,161,255,0.1)] ${fieldErrors.password ? 'border-[#D62056]' : 'border-gray-200'}`}
                        >
                            <Lock size={20} color="#B0B0B0" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                                autoComplete="current-password"
                                className="flex-1 ml-3 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0]"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#B0B0B0] hover:text-[#888] transition-colors">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="mt-1 ml-3 text-xs font-medium text-[#D62056]">{fieldErrors.password}</p>
                        )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between px-1 mt-1">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={rememberMe}
                                onClick={() => setRememberMe(!rememberMe)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${rememberMe ? 'bg-[#88CCE1]' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${rememberMe ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                            <span className="text-[#555555] text-sm">Remember Me</span>
                        </div>
                        <Link href="/forgot-password" className="text-[#88CCE1] font-medium text-sm hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Log In button */}
                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="mt-6 h-14 w-full rounded-full text-white text-lg font-bold transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] disabled:scale-100 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(to right, #99D1E8, #C4A1FF)' }}
                    >
                        {loginMutation.isPending ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Signing in..
                            </>
                        ) : (
                            'Log in'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-8">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="mx-4 text-[#B0B0B0] text-sm font-medium">Or continue with</span>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Social buttons */}
                <div className="flex flex-col gap-3">
                    <GoogleLoginButton mode="signin" />
                </div>

                {/* Footer */}
                <p className="text-center mt-10 text-[#707070]">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-[#88CCE1] font-bold hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default SigninPage;
