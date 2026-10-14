"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	User,
	Crown,
	WalletCards,
	LayoutGrid,
	Users,
	LifeBuoy,
	FileText,
	Shield,
	MessageSquare,
	Phone,
	CalendarDays,
	LogOut,
	ChevronRight,
} from "lucide-react";
import { clearAuthStorage, useAuthProfileQuery } from "@/hooks/useAuth";
import {
	useNotificationSettingsQuery,
	useUpdateNotificationSettingsMutation,
} from "@/hooks/useNotification";
import { BASE_URL } from "@/lib/axios";

type ToggleKey = "email_notifications" | "sms_notifications" | "push_notifications";

type SettingsItem = {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	route?: string;
};

const DEFAULT_NOTIFICATION_SETTINGS: Record<ToggleKey, boolean> = {
	email_notifications: true,
	sms_notifications: false,
	push_notifications: true,
};

const accountItems: SettingsItem[] = [
	{
		icon: <User size={18} />,
		title: "Profile Information",
		subtitle: "Update your name, photo, and account details",
		route: "/settings/profile",
	},
	{
		icon: <Crown size={18} />,
		title: "Subscription",
		subtitle: "Manage your plan, billing, and invoices",
		route: "/settings/subscription",
	},
	{
		icon: <WalletCards size={18} />,
		title: "Wallet",
		subtitle: "Manage your money and recharge",
		route: "/settings/wallet",
	},
	{
		icon: <LayoutGrid size={18} />,
		title: "Choose the App",
		subtitle: "Pick your default view and app experience",
	},
	{
		icon: <Users size={18} />,
		title: "Co-parent Information",
		subtitle: "Edit co-parent contact and profile details",
		route: "/settings/co-parent",
	},
];

const contactItems: SettingsItem[] = [
	{
		icon: <LifeBuoy size={18} />,
		title: "Help and Support",
		subtitle: "Get help, FAQs, and contact support",
		route: "/settings/help-support",
	},
	{
		icon: <FileText size={18} />,
		title: "Terms and Conditions",
		subtitle: "Read the terms for using this platform",
		route: "/settings/terms-and-conditions",
	},
	{
		icon: <Shield size={18} />,
		title: "Privacy and Policy",
		subtitle: "Learn how your data is collected and protected",
		route: "/settings/privacy-policy",
	},
];

export default function SettingsPage() {
	const router = useRouter();
	const { data: profile, isLoading } = useAuthProfileQuery();
	const settingsQuery = useNotificationSettingsQuery();
	const updateSettings = useUpdateNotificationSettingsMutation();
	const [notificationOverrides, setNotificationOverrides] = useState<Partial<Record<ToggleKey, boolean>> | null>(null);
	const notificationSettings = useMemo<Record<ToggleKey, boolean>>(() => {
		const firstSetting = settingsQuery.data?.[0];
		const baseSettings: Record<ToggleKey, boolean> = firstSetting
			? {
				email_notifications: firstSetting.email_notifications,
				sms_notifications: firstSetting.sms_notifications,
				push_notifications: firstSetting.push_notifications,
			}
			: DEFAULT_NOTIFICATION_SETTINGS;

		return {
			...baseSettings,
			...notificationOverrides,
		};
	}, [notificationOverrides, settingsQuery.data]);

	const imageUrl = profile?.image
		? profile.image.startsWith('http') ? profile.image : `${BASE_URL}${profile.image}`
		: null;
	const displayName = profile?.name?.trim() || "User";
	const initials = displayName
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

	const handleLogout = () => {
		clearAuthStorage();
		router.replace("/");
	};

	function toggle(key: ToggleKey) {
		const nextState = {
			...notificationSettings,
			[key]: !notificationSettings[key],
		};

		setNotificationOverrides(nextState);

		updateSettings.mutate(
			{
				email_notifications: nextState.email_notifications,
				sms_notifications: nextState.sms_notifications,
				push_notifications: nextState.push_notifications,
				type: "messages",
			},
			{
				onSuccess: () => {
					toast.success("Notification settings updated");
				},
				onError: () => {
					setNotificationOverrides(null);
					toast.error("Could not update notification settings");
				},
			},
		);
	}

	return (
		<div className="min-h-screen bg-[#EAF1FF]">
			<nav className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
					<div>
						<h1 className="text-xl font-black text-slate-800">Settings</h1>
						<p className="text-xs font-medium text-slate-400">Manage your account preferences and notifications</p>
					</div>
				</div>
			</nav>

			<main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
				<section className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm">
					<div className="flex flex-wrap items-center gap-4 sm:gap-5">
						<div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-violet-500 to-sky-500 text-xl font-black text-white">
							{imageUrl ? (
								<Image
									src={imageUrl}
									alt={displayName}
									fill
									className="object-cover"
									unoptimized
								/>
							) : (
								initials || "U"
							)}
						</div>
						<div className="min-w-0">
							<h2 className="text-lg font-black text-slate-800">
								{isLoading ? "Loading..." : displayName}
							</h2>
							<p className="text-sm text-slate-500">
								{profile?.phone || "No phone added"}
							</p>
							<p className="mt-0.5 text-xs font-semibold capitalize text-violet-500">
								{profile?.role || "User"}
							</p>
						</div>
					</div>
				</section>

				<section className="rounded-4xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
					<h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Account</h3>
					<div className="space-y-3">
						{accountItems.map((item) => (
							<button
								key={item.title}
								onClick={() => item.route && router.push(item.route)}
								className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition-all hover:border-violet-200 hover:bg-violet-50/40"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-500 shadow-sm">
										{item.icon}
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
										<p className="truncate text-xs text-slate-500">{item.subtitle}</p>
									</div>
								</div>
								<ChevronRight size={18} className="shrink-0 text-slate-400" />
							</button>
						))}
					</div>
				</section>

				<section className="rounded-4xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
					<h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Contact</h3>
					<div className="space-y-3">
						{contactItems.map((item) => (
							<button
								key={item.title}
								onClick={() => item.route && router.push(item.route)}
								className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition-all hover:border-sky-200 hover:bg-sky-50/40"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
										{item.icon}
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
										<p className="truncate text-xs text-slate-500">{item.subtitle}</p>
									</div>
								</div>
								<ChevronRight size={18} className="shrink-0 text-slate-400" />
							</button>
						))}
					</div>
				</section>

				<section className="rounded-4xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
					<h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Notification</h3>
					{settingsQuery.isLoading && (
						<p className="mb-3 text-xs font-semibold text-slate-500">Loading notification settings...</p>
					)}
					<div className="space-y-3">
						<NotificationToggleRow
							icon={<MessageSquare size={17} />}
							title="Email Notification"
							subtitle="Receive updates by email"
							enabled={notificationSettings.email_notifications}
							onToggle={() => toggle("email_notifications")}
							disabled={updateSettings.isPending}
						/>
						<NotificationToggleRow
							icon={<Phone size={17} />}
							title="SMS Notification"
							subtitle="Receive updates by SMS"
							enabled={notificationSettings.sms_notifications}
							onToggle={() => toggle("sms_notifications")}
							disabled={updateSettings.isPending}
						/>
						<NotificationToggleRow
							icon={<CalendarDays size={17} />}
							title="Push Notification"
							subtitle="Receive in-app and device push updates"
							enabled={notificationSettings.push_notifications}
							onToggle={() => toggle("push_notifications")}
							disabled={updateSettings.isPending}
						/>
					</div>
				</section>

				<section className="pb-10">
					<button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-100 transition-all hover:bg-rose-600 active:scale-[0.99] sm:w-auto">
						<LogOut size={18} /> Log Out
					</button>
				</section>
			</main>
		</div>
	);
}

function NotificationToggleRow({
	icon,
	title,
	subtitle,
	enabled,
	onToggle,
	disabled,
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	enabled: boolean;
	onToggle: () => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-500 shadow-sm">
					{icon}
				</div>
				<div className="min-w-0">
					<p className="truncate text-sm font-bold text-slate-800">{title}</p>
					<p className="truncate text-xs text-slate-500">{subtitle}</p>
				</div>
			</div>

			<button
				onClick={onToggle}
				disabled={disabled}
				className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? "bg-violet-500" : "bg-slate-300"
					}`}
				aria-pressed={enabled}
				aria-label={`Toggle ${title}`}
			>
				<span
					className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"
						}`}
				/>
			</button>
		</div>
	);
}
