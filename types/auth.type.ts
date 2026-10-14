export interface SignupPayload {
	email: string;
	phone: string;
	password: string;
}

export interface SignupResponse {
	message: string;
}

export interface ApiError {
	message?: string;
	redirect?: string;
	fieldErrors?: Record<string, string[] | undefined> & {
		email?: string[];
		phone?: string[];
		password?: string[];
		non_field_errors?: string[];
	};
}

export interface AuthProfile {
	email?: string;
	name?: string;
	phone?: string;
	state?: string;
	image?: string;
	court_mandated?: boolean;
	role?: "mother" | "father" | string;
	onboarding_completed?: boolean;
	children?: Array<{
		id?: number;
		name: string;
		date_of_birth: string;
	}>;
}

export interface UpdateProfileInput {
	name?: string;
	email?: string;
	phone?: string;
	state?: string;
	role?: "mother" | "father";
	court_mandated?: boolean;
	image?: File | null;
}

export type UpdateProfileResponse = AuthProfile;

export interface LoginPayload {
	identifier: string;
	method: "email" | "phone";
	password: string;
}

export interface LoginResponse {
	email?: string;
	role?: string;
	access_token?: string;
	refresh_token?: string;
	message?: string;
	detail?: string;
	redirect?: string;
	onboarding_completed?: boolean;
}

export interface OtpPayload {
	identifier?: string;
	email?: string;
	phone?: string;
	otp: string;
}

export interface ActivateAccountResponse {
	email?: string;
	role?: string;
	access_token?: string;
	refresh_token?: string;
	message?: string;
}

export interface ActivatePasswordResetResponse {
	detail?: string;
	refresh?: string;
	access_token?: string;
}

export interface ResendOtpPayload {
	email?: string;
	phone?: string;
}

export interface ResendOtpResponse {
	message?: string;
}

export interface RequestPasswordResetPayload {
	identifier: string;
	method: "email" | "phone";
}

export interface RequestPasswordResetResponse {
	message?: string;
}

export interface ResetPasswordPayload {
	new_password: string;
}

export interface ResetPasswordResponse {
	message?: string;
}

export type OnboardingRole = "mother" | "father";
export type OnboardingMode = "bridge" | "independent";

export interface OnboardingChild {
	name: string;
	date_of_birth: string;
}

export interface OnboardingPayload {
	name: string;
	partner_phone: string;
	state: string;
	court_mandated: boolean;
	role: OnboardingRole;
	mode: OnboardingMode;
	operation_type?: "connect" | "continue";
	partner_code?: string;
	children?: OnboardingChild[];
}

export interface OnboardingResponse {
	message?: string;
	data?: {
		shareable_code?: string;
		share_invite_code?: string;
		twilio_phone_number?: string;
		mode_page?: boolean;
		bridge_mode_page?: boolean;
		independent_mode_page?: boolean;
	};
}
