import api from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ActivateAccountResponse,
  ActivatePasswordResetResponse,
  ApiError,
  AuthProfile,
  LoginPayload,
  LoginResponse,
  OnboardingPayload,
  OnboardingResponse,
  OtpPayload,
  RequestPasswordResetPayload,
  RequestPasswordResetResponse,
  ResendOtpPayload,
  ResendOtpResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  SignupPayload,
  SignupResponse,
  UpdateProfileInput,
  UpdateProfileResponse,
} from "@/types/auth.type";

export type {
  ActivateAccountResponse,
  ActivatePasswordResetResponse,
  ApiError,
  AuthProfile,
  LoginPayload,
  LoginResponse,
  OnboardingChild,
  OnboardingMode,
  OnboardingPayload,
  OnboardingResponse,
  OnboardingRole,
  OtpPayload,
  RequestPasswordResetPayload,
  RequestPasswordResetResponse,
  ResendOtpPayload,
  ResendOtpResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  SignupPayload,
  SignupResponse,
  UpdateProfileInput,
  UpdateProfileResponse,
} from "@/types/auth.type";

// --- Types ---

// --- API calls ---

const signup = async (payload: SignupPayload): Promise<SignupResponse> => {
  const { data } = await api.post<SignupResponse>(
    "/api/v1/auth/signup/",
    payload,
  );
  return data;
};

// --- Utilities ---

export const authResponseUtils = {
  getApiMessage: (response: SignupResponse): string => response.message ?? "",
};

// --- Normalise backend errors into ApiError shape ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseApiError = (err: any): ApiError => {
  const data = err?.response?.data;
  if (!data) return { message: "Something went wrong." };

  // Dynamically parse field-level validation errors
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const fieldErrors: Record<string, string[]> = {};
    let hasFieldErrors = false;

    // Special metadata keys that are not input fields
    const metadataFields = ["message", "detail", "error", "redirect", "status_code"];

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (!metadataFields.includes(key) && key !== "non_field_errors") {
          const val = data[key];
          if (Array.isArray(val)) {
            fieldErrors[key] = val.map(String);
            hasFieldErrors = true;
          } else if (typeof val === "string") {
            fieldErrors[key] = [val];
            hasFieldErrors = true;
          }
        }
      }
    }

    if (hasFieldErrors || data.non_field_errors) {
      if (data.non_field_errors) {
        fieldErrors.non_field_errors = Array.isArray(data.non_field_errors)
          ? data.non_field_errors.map(String)
          : [String(data.non_field_errors)];
      }

      return {
        message: data.message ?? data.detail ?? "Request failed.",
        redirect: data.redirect,
        fieldErrors,
      };
    }
  }

  return {
    message: data.message ?? data.detail ?? data.error ?? "Request failed.",
    redirect: data.redirect,
  };
};

// --- Session / Profile ---

export const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("token") ??
    sessionStorage.getItem("token") ??
    localStorage.getItem("pb_access_token") ??
    sessionStorage.getItem("pb_access_token")
  );
};

export const clearAuthStorage = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("pb_access_token");
  sessionStorage.removeItem("pb_access_token");
  localStorage.removeItem("pb_refresh_token");
  sessionStorage.removeItem("pb_refresh_token");
  localStorage.removeItem("pb_user_role");
  sessionStorage.removeItem("pb_user_role");
};

const getProfile = async (): Promise<AuthProfile> => {
  const { data } = await api.get<AuthProfile>("/api/v1/auth/profile/");
  return data;
};

export const useAuthProfileQuery = () =>
  useQuery<AuthProfile, ApiError>({
    queryKey: ["auth", "profile"],
    queryFn: getProfile,
    enabled: !!getStoredAccessToken(),
    retry: false,
    staleTime: 60_000,
  });

const updateProfile = async (
  payload: UpdateProfileInput,
): Promise<UpdateProfileResponse> => {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.email !== undefined) formData.append("email", payload.email);
  if (payload.phone !== undefined) formData.append("phone", payload.phone);
  if (payload.state !== undefined) formData.append("state", payload.state);
  if (payload.role !== undefined) formData.append("role", payload.role);
  if (payload.court_mandated !== undefined) {
    formData.append("court_mandated", String(payload.court_mandated));
  }
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const { data } = await api.put<UpdateProfileResponse>(
    "/api/v1/auth/profile/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
};

export const useUpdateProfileMutation = () =>
  useMutation<UpdateProfileResponse, ApiError, UpdateProfileInput>({
    mutationFn: updateProfile,
    throwOnError: false,
  });

// --- Login ---

const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>(
    "/api/v1/auth/login/",
    payload,
  );
  return data;
};

export const useLoginMutation = () =>
  useMutation<LoginResponse, ApiError, LoginPayload>({
    mutationFn: login,
    throwOnError: false,
  });

// --- Hooks ---

export const useSignupMutation = () =>
  useMutation<SignupResponse, ApiError, SignupPayload>({
    mutationFn: signup,
    throwOnError: false,
  });

// --- OTP / Activate ---

const activateAccount = async (
  payload: OtpPayload,
): Promise<ActivateAccountResponse> => {
  const { data } = await api.post<ActivateAccountResponse>(
    "/api/v1/auth/activate/",
    payload,
  );
  return data;
};

const activatePasswordReset = async (
  payload: OtpPayload,
): Promise<ActivatePasswordResetResponse> => {
  const { data } = await api.post<ActivatePasswordResetResponse>(
    "/api/v1/auth/password/reset/activate/",
    payload,
  );
  return data;
};

const resendActivationOtp = async (
  payload: ResendOtpPayload,
): Promise<ResendOtpResponse> => {
  const { data } = await api.post<ResendOtpResponse>(
    "/api/v1/auth/otp/resend/",
    payload,
  );
  return data;
};

const requestPasswordReset = async (
  payload: RequestPasswordResetPayload,
): Promise<RequestPasswordResetResponse> => {
  const { data } = await api.post<RequestPasswordResetResponse>(
    "/api/v1/auth/password/reset/request/",
    payload,
  );
  return data;
};

export const useActivateAccountMutation = () =>
  useMutation<ActivateAccountResponse, ApiError, OtpPayload>({
    mutationFn: activateAccount,
    throwOnError: false,
  });

export const useActivatePasswordResetMutation = () =>
  useMutation<ActivatePasswordResetResponse, ApiError, OtpPayload>({
    mutationFn: activatePasswordReset,
    throwOnError: false,
  });

export const useResendActivationOtpMutation = () =>
  useMutation<ResendOtpResponse, ApiError, ResendOtpPayload>({
    mutationFn: resendActivationOtp,
    throwOnError: false,
  });

export const useRequestPasswordResetMutation = () =>
  useMutation<
    RequestPasswordResetResponse,
    ApiError,
    RequestPasswordResetPayload
  >({
    mutationFn: requestPasswordReset,
    throwOnError: false,
  });

// --- Reset Password (uses temp token from OTP step) ---

const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> => {
  const token = sessionStorage.getItem("reset_token");
  const { data } = await api.post<ResetPasswordResponse>(
    "/api/v1/auth/password/reset/",
    payload,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  );
  return data;
};

export const useResetPasswordMutation = () =>
  useMutation<ResetPasswordResponse, ApiError, ResetPasswordPayload>({
    mutationFn: resetPassword,
    throwOnError: false,
  });

// --- Onboarding ---

const onboarding = async (
  payload: OnboardingPayload,
): Promise<OnboardingResponse> => {
  const { data } = await api.post<OnboardingResponse>(
    "/api/v1/auth/onboarding/",
    payload,
  );
  return data;
};

export const useOnboardingMutation = () =>
  useMutation<OnboardingResponse, ApiError, OnboardingPayload>({
    mutationFn: onboarding,
    throwOnError: false,
  });

// --- Social (Google) Sign-in / Sign-up ---

export interface SocialSigninPayload {
  email: string;
  auth_provider: 'google';
  role?: string;
}

export interface SocialSigninResponse {
  access_token: string;
  refresh_token: string;
  role?: string;
  message?: string;
  onboarding_completed?: boolean;
}

const socialSignin = async (
  payload: SocialSigninPayload,
): Promise<SocialSigninResponse> => {
  const { data } = await api.post<SocialSigninResponse>(
    '/api/v1/auth/social/signup-signin/',
    payload,
  );
  return data;
};

export const useSocialSigninMutation = () =>
  useMutation<SocialSigninResponse, ApiError, SocialSigninPayload>({
    mutationFn: socialSignin,
    throwOnError: false,
  });
