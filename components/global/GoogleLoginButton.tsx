"use client";

import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parseApiError, useSocialSigninMutation } from "@/hooks/useAuth";

interface GoogleLoginButtonProps {
  mode: "signin" | "signup";
}

export default function GoogleLoginButton({ mode }: GoogleLoginButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const socialMutation = useSocialSigninMutation();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsPending(true);
      try {
        // 1. Fetch user profile from Google API to get their email address
        const response = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const email = response.data?.email;
        if (!email) {
          toast.error("Failed to retrieve your email from Google.");
          setIsPending(false);
          return;
        }

        // 2. Call backend social login api
        const backendRes = await socialMutation.mutateAsync({
          email,
          auth_provider: "google",
        });

        // 3. Store access token and refresh token
        if (backendRes.access_token) {
          localStorage.setItem("token", backendRes.access_token);
          if (backendRes.refresh_token) {
            localStorage.setItem("pb_refresh_token", backendRes.refresh_token);
          }
        }

        toast.success(backendRes.message ?? "Successfully authenticated.");

        // 4. Handle navigation based on onboarding status
        if (backendRes.onboarding_completed === false) {
          toast.info("Please complete your account setup to continue.");
          router.replace("/account-setup");
        } else {
          router.replace("/home");
        }
      } catch (err: unknown) {
        const apiError = parseApiError(err);
        toast.error(apiError.message ?? "Failed to log in with Google.");
        setIsPending(false);
      }
    },
    onError: (error) => {
      console.error("Google Auth Error:", error);
      toast.error("Google login failed.");
      setIsPending(false);
    },
    onNonOAuthError: (nonOAuthError) => {
      console.error("Google Non-OAuth Error:", nonOAuthError);
      setIsPending(false);
      if (nonOAuthError?.type === "popup_closed") {
        toast.info("Google sign-in was cancelled.");
      } else {
        toast.error("Google login failed to open.");
      }
    },
  });

  const text = mode === "signin" ? "Sign in with Google" : "Sign up with Google";

  return (
    <button
      type="button"
      onClick={() => {
        if (isPending) return;
        setIsPending(true);
        handleGoogleLogin();
      }}
      disabled={isPending || socialMutation.isPending}
      className="flex w-full items-center justify-center bg-[#F7F3FF] h-14 rounded-full hover:opacity-80 transition-opacity disabled:opacity-60 cursor-pointer"
    >
      {isPending || socialMutation.isPending ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-[#555555] font-semibold">Connecting...</span>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000"
            alt="Google"
            className="w-6 h-6"
          />
          <span className="text-[#555555] font-semibold ml-3">{text}</span>
        </>
      )}
    </button>
  );
}
