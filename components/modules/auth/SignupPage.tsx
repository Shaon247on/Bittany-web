"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

import { toast } from 'sonner';
import { ApiError, authResponseUtils, parseApiError, useSignupMutation } from '@/hooks/useAuth';
import GoogleLoginButton from '@/components/global/GoogleLoginButton';

type SignupFieldErrors = {
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignupPage = () => {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [transactionalSmsConsent, setTransactionalSmsConsent] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});

    const signupMutation = useSignupMutation();

    const clearFieldError = (field: keyof SignupFieldErrors) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateForm = (normalizedEmail: string): boolean => {
        const nextErrors: SignupFieldErrors = {};

        if (!normalizedEmail) {
            nextErrors.email = 'Email is required.';
        } else if (!EMAIL_REGEX.test(normalizedEmail)) {
            nextErrors.email = 'Please enter a valid email address.';
        }

        const digitsOnly = phone.replace(/\D/g, '');
        if (!phone || digitsOnly.length < 8) {
            nextErrors.phone = 'Please enter a valid phone number with country code.';
        }

        if (!password) {
            nextErrors.password = 'Password is required.';
        } else if (password.length < 8) {
            nextErrors.password = 'Password must be at least 8 characters.';
        }

        if (!confirmPassword) {
            nextErrors.confirmPassword = 'Confirm password is required.';
        } else if (password !== confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }

        const hasFieldErrors = Object.keys(nextErrors).length > 0;
        setFieldErrors(nextErrors);

        if (!hasFieldErrors && !agreedToTerms) {
            toast.error('You must agree to the Terms of Service and Privacy Policy to continue.');
            return false;
        }

        return !hasFieldErrors && agreedToTerms;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedEmail = email.trim().toLowerCase();
        if (!validateForm(normalizedEmail)) return;

        try {
            const response = await signupMutation.mutateAsync({ email: normalizedEmail, phone, password });
            setFieldErrors({});
            toast.success(authResponseUtils.getApiMessage(response) || 'Account created successfully.');

            router.push(`/otp?flow=activation&phone=${encodeURIComponent(phone)}`);
        } catch (err) {
            const apiError = parseApiError(err) as ApiError;

            setFieldErrors({
                email: apiError.fieldErrors?.email?.[0],
                phone: apiError.fieldErrors?.phone?.[0],
                password: apiError.fieldErrors?.password?.[0],
            });

            toast.error(apiError.message ?? 'Unable to create account right now.');
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
                        Create Your Account
                    </h1>
                    <p className="text-[#B0B0B0] text-base mt-2">
                        Sign up to start your co-parenting journey
                    </p>
                </div>

                <form onSubmit={handleSignup} noValidate className="flex flex-col gap-4">

                    {/* Email */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full px-5 h-14 border shadow-[0_4px_20px_rgba(196,161,255,0.1)] ${fieldErrors.email ? 'border-[#D62056]' : 'border-gray-200'}`}
                        >
                            <Mail size={20} color="#B0B0B0" />
                            <input
                                type="email"
                                placeholder="abc@email.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                                autoComplete="email"
                                className="flex-1 ml-3 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0]"
                            />
                        </div>
                        {fieldErrors.email && (
                            <p className="mt-1 ml-3 text-xs font-medium text-[#D62056]">{fieldErrors.email}</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full pl-5 pr-3 h-14 border shadow-[0_4px_20px_rgba(196,161,255,0.1)] ${fieldErrors.phone ? 'border-[#D62056]' : 'border-gray-200'}`}
                        >
                            <PhoneInput
                                defaultCountry="us"
                                value={phone}
                                onChange={(phoneValue) => { setPhone(phoneValue); clearFieldError('phone'); }}
                                className="w-full flex items-center"
                                inputClassName="flex-1 ml-3 border-0 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0] border-none focus:outline-none focus:ring-0 focus:border-none"
                                countrySelectorStyleProps={{
                                    buttonClassName: 'bg-transparent border-none p-0 hover:bg-transparent focus:bg-transparent',
                                }}
                            />
                        </div>
                        {fieldErrors.phone && (
                            <p className="mt-1 ml-3 text-xs font-medium text-[#D62056]">{fieldErrors.phone}</p>
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
                                autoComplete="new-password"
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

                    {/* Confirm Password */}
                    <div>
                        <div
                            className={`flex items-center bg-white rounded-full px-5 h-14 border shadow-[0_4px_20px_rgba(196,161,255,0.1)] ${fieldErrors.confirmPassword ? 'border-[#D62056]' : 'border-gray-200'}`}
                        >
                            <Lock size={20} color="#B0B0B0" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                                autoComplete="new-password"
                                className="flex-1 ml-3 text-[#1D2E54] text-base bg-transparent outline-none placeholder-[#B0B0B0]"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-[#B0B0B0] hover:text-[#888] transition-colors">
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {fieldErrors.confirmPassword && (
                            <p className="mt-1 ml-3 text-xs font-medium text-[#D62056]">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center gap-2 px-1">
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
                        <span className="text-[#555555] text-sm font-medium">Remember Me</span>
                    </div>

                    {/* SMS Compliance & Agreements */}
                    <div className="flex flex-col gap-4 mt-2 px-1">
                        {/* Transactional SMS Consent */}
                        <button
                            type="button"
                            onClick={() => setTransactionalSmsConsent(!transactionalSmsConsent)}
                            className="flex items-start gap-3 text-left focus:outline-none"
                        >
                            <div
                                className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center border-2 transition-colors ${transactionalSmsConsent ? 'bg-[#88CCE1] border-[#88CCE1]' : 'bg-white border-gray-200'}`}
                            >
                                {transactionalSmsConsent && (
                                    <svg viewBox="0 0 12 10" className="w-3.5 h-3.5" fill="none">
                                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-[#555555] text-sm leading-5">
                                I agree to receive transactional SMS messages from <strong>ParentBridge</strong> for account verification, security alerts, and co-parent communication notifications. Message frequency varies. Msg & Data rates may apply. Reply STOP to opt out or HELP for support.
                            </span>
                        </button>


                        {/* Terms & Privacy */}
                        <button
                            type="button"
                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                            className="flex items-start gap-3 text-left focus:outline-none"
                        >
                            <div
                                className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center border-2 transition-colors ${agreedToTerms ? 'bg-[#88CCE1] border-[#88CCE1]' : 'bg-white border-gray-200'}`}
                            >
                                {agreedToTerms && (
                                    <svg viewBox="0 0 12 10" className="w-3.5 h-3.5" fill="none">
                                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-[#555555] text-sm leading-5">
                                I accept the{' '}
                                <Link href="/terms-conditions" onClick={(e) => e.stopPropagation()} className="text-[#88CCE1] font-bold hover:underline">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link href="/privacy-policy" onClick={(e) => e.stopPropagation()} className="text-[#88CCE1] font-bold hover:underline">
                                    Privacy Policy
                                </Link>.
                            </span>
                        </button>
                    </div>

                    {/* Sign Up button */}
                    <button
                        type="submit"
                        disabled={signupMutation.isPending || !agreedToTerms}
                        className="mt-6 h-14 w-full rounded-full text-white text-lg font-bold transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] disabled:scale-100 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'linear-gradient(to right, #99D1E8, #C4A1FF)' }}
                    >
                        {signupMutation.isPending ? 'Creating account...' : 'Sign Up'}
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
                    <GoogleLoginButton mode="signup" />
                </div>

                {/* Footer */}
                <p className="text-center mt-10 text-[#707070]">
                    Already have an account?{' '}
                    <Link href="/signin" className="text-[#88CCE1] font-bold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default SignupPage;
