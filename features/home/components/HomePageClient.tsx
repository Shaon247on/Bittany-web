"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  X,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays,
  FileText,
  MessageSquare,
  PhoneCall,
  Wallet,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { getStoredAccessToken, useAuthProfileQuery } from '@/hooks/useAuth';
import { useNotificationCountsQuery, useNotificationsQuery } from '@/hooks/useNotification';
import { BASE_URL } from '@/lib/axios';
import { DashboardSocketClient } from '@/lib/dashboardSocket';
import type { DashboardSummaryCall, DashboardSummaryData, DashboardSummaryEvent } from '@/features/home/types/home.type';

function normalizeDisplaySource(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return '';

  const record = value as Record<string, unknown>;
  const candidates = [record.name, record.username, record.email, record.caller, record.callee];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return '';
}

function formatDisplayName(value: unknown) {
  const source = normalizeDisplaySource(value);
  if (!source) return 'Unknown';

  const baseValue = source.includes('@') ? source.split('@')[0] : source;
  const normalized = baseValue.replace(/[._-]+/g, ' ').trim();
  if (!normalized) return 'Unknown';

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatEventDate(value: string | undefined) {
  if (!value) return 'Soon';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Soon';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatEventTime(event: DashboardSummaryEvent) {
  const raw = event.time || event.start_time || event.end_time;
  if (raw) return raw;
  const dateSource = event.date || event.start_date;
  if (!dateSource) return 'TBD';
  const date = new Date(dateSource);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalizeCallType(call: DashboardSummaryCall) {
  const normalized = String(call.type || '').toLowerCase();
  if (normalized.includes('out')) return 'outgoing';
  return 'incoming';
}

const EVENT_COLORS = ['#7DD3FC', '#C4B5FD', '#F9A8D4'];

export default function HomePage() {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useAuthProfileQuery();
  const { data: notifications = [], isLoading: isNotificationsLoading } = useNotificationsQuery();
  const { data: notificationCounts = [] } = useNotificationCountsQuery();
  const isServer = typeof window === 'undefined';
  const hasToken = Boolean(getStoredAccessToken());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryData | null>(null);

  useEffect(() => {
    if (!isServer && !hasToken) {
      router.replace('/');
    }
  }, [hasToken, isServer, router]);

  useEffect(() => {
    if (isServer) return;

    const token = getStoredAccessToken();
    if (!token) return;

    const client = new DashboardSocketClient();
    client.setHandlers({
      onSummary: (event) => {
        setDashboardSummary(event.data);
      },
    });
    client.connect(token);

    return () => {
      client.disconnect();
    };
  }, [isServer]);

  const profileName = useMemo(() => {
    const name = profile?.name?.trim();
    return name && name.length > 0 ? name : 'User';
  }, [profile?.name]);

  const profileInitials = useMemo(() => {
    const parts = profileName.split(' ').filter(Boolean);
    return (parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? '');
  }, [profileName]);

  const profileImageUrl = profile?.image
    ? profile.image.startsWith('http') ? profile.image : `${BASE_URL}${profile.image}`
    : null;

  const totalNotificationCount = useMemo(
    () => notificationCounts.reduce((sum, item) => sum + (item.count ?? 0), 0),
    [notificationCounts],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const quickActions = useMemo(() => {
    const summary = dashboardSummary;
    return [
      {
        title: 'Messages',
        subtitle: `${summary?.unread_messages ?? 0} unread updates`,
        route: '/chats',
        icon: MessageSquare,
        accent: 'bg-sky-50 text-sky-600',
      },
      {
        title: 'Calls',
        subtitle: `${summary?.recent_calls_number ?? 0} recent calls`,
        route: '/calls',
        icon: PhoneCall,
        accent: 'bg-violet-50 text-violet-600',
      },
      {
        title: 'Documents',
        subtitle: `${summary?.total_documents ?? 0} records stored`,
        route: '/documents',
        icon: FileText,
        accent: 'bg-amber-50 text-amber-600',
      },
      {
        title: 'Expenses',
        subtitle: `${summary?.expenses_pending_number ?? 0} items pending`,
        route: '/expenses',
        icon: Wallet,
        accent: 'bg-emerald-50 text-emerald-600',
      },
    ];
  }, [dashboardSummary]);

  const summaryCards = useMemo(() => {
    const summary = dashboardSummary;
    return [
      { label: 'Messages Today', value: String(summary?.messages_today ?? 0), detail: `${summary?.unread_messages ?? 0} unread` },
      { label: 'Events this Week', value: String(summary?.events_this_week ?? 0), detail: `${summary?.upcoming_3_events?.length ?? 0} coming up` },
      { label: 'Pending Expenses', value: String(summary?.pending_expenses ?? 0), detail: `${summary?.expenses_pending_number ?? 0} pending items` },
    ];
  }, [dashboardSummary]);

  const recentMessages = useMemo(() => {
    return (dashboardSummary?.last_3_messages ?? []).map((message) => ({
      id: message.id,
      sender: formatDisplayName(message.sender.name || message.sender.username),
      text: message.message,
      time: formatMessageTime(message.timestamp),
      status: 'Recent',
      tone: 'bg-sky-50 text-sky-600',
    }));
  }, [dashboardSummary]);

  const callLogs = useMemo(() => {
    return (dashboardSummary?.last_3_calls ?? []).map((call, index) => {
      const type = normalizeCallType(call);
      const timestamp = call.timestamp || call.created_at || '';
      const date = timestamp ? formatMessageTime(timestamp) : 'Recent';
      return {
        id: call.id ?? index,
        type,
        name: formatDisplayName(call.name ?? call.caller ?? call.callee),
        duration: call.duration ? `${call.duration}` : 'No duration',
        date,
      };
    });
  }, [dashboardSummary]);

  const upcomingEvents = useMemo(() => {
    return (dashboardSummary?.upcoming_3_events ?? []).map((event, index) => ({
      id: event.id ?? index,
      title: event.title || event.name || 'Upcoming Event',
      date: formatEventDate(event.date || event.start_date),
      time: formatEventTime(event),
      color: EVENT_COLORS[index % EVENT_COLORS.length],
    }));
  }, [dashboardSummary]);

  const focusMessage = useMemo(() => {
    if (!dashboardSummary) {
      return 'Waiting for your live dashboard summary.';
    }
    return `You have ${dashboardSummary.unread_messages} unread messages, ${dashboardSummary.expenses_pending_number} pending expenses, and ${dashboardSummary.upcoming_3_events.length} upcoming events in view.`;
  }, [dashboardSummary]);


  if (isServer || (hasToken && isProfileLoading) || !hasToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <span className="text-sm font-semibold text-slate-600">Loading for you...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="flex min-h-screen flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-4 py-5 md:px-8 md:py-6">
          <div className="relative hidden w-96 md:block">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              placeholder="Search records..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative rounded-full bg-white p-2.5 text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
              aria-label="Open notifications"
            >
              <Bell size={20} />
              {totalNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                  {totalNotificationCount > 99 ? '99+' : totalNotificationCount}
                </span>
              )}
            </button>

            <button onClick={() => router.push("/settings/profile")} className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 pr-4 shadow-sm">
              <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-linear-to-br from-sky-400 to-violet-400 text-sm font-black text-white">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={profileName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  profileInitials.toUpperCase()
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700">{profileName}</span>
            </button>
          </div>
        </header>

        <div className="px-4 pb-10 md:px-8">
          <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#C4B5FD] to-[#A5F3FC] p-6 shadow-xl shadow-sky-100/60 md:p-10">
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-violet-200/20 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-1.5 text-sm font-semibold text-slate-700">
                  <Sparkles size={16} className="text-violet-600" />
                  Daily Dashboard Pulse
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-800 md:text-5xl">
                  Home overview built for calmer co-parenting.
                </h1>
                <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600 md:text-lg">
                  Keep message tone, upcoming events, call activity, and family records in one steady workspace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/chats" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-800 shadow-sm transition-all hover:shadow-md">
                    <MessageSquare size={18} />
                    Open Conversations
                  </Link>
                  <Link href="/calls" className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-pink-500 to-fuchsia-500 px-5 py-3 font-bold text-white shadow-lg shadow-pink-200 transition-all hover:scale-[1.02] active:scale-[0.99]">
                    <PhoneCall size={18} fill="white" />
                    Review Call Activity
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:w-[24rem] lg:grid-cols-1">
                {summaryCards.map((card) => (
                  <div key={card.label} className="rounded-3xl border border-white/40 bg-white/55 p-5 backdrop-blur-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
                    <p className="mt-3 text-4xl font-black text-slate-800">{card.value}</p>
                    {/* <p className="mt-1 text-sm font-medium text-slate-500">{card.detail}</p> */}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
            <div className="space-y-8">
              <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 md:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Communication Snapshot</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">The newest updates that may need your attention today.</p>
                  </div>
                  <Link href="/chats" className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 transition-colors hover:text-sky-700">
                    View All
                    <ChevronRight size={16} />
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentMessages.length > 0 ? recentMessages.map((message) => (
                    <div key={message.id} className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-sky-200 hover:bg-white hover:shadow-md md:flex-row md:items-center md:justify-between md:p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400 to-violet-400 text-lg font-black text-white shadow-sm">
                          {message.sender[0]}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-bold text-slate-800">{message.sender}</p>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${message.tone}`}>
                              {message.status}
                            </span>
                          </div>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{message.text}</p>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-400 md:text-right">{message.time}</div>
                    </div>
                  )) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No recent messages from the dashboard summary yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 md:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Call Highlights</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">Recent call activity styled the same way as your call dashboard.</p>
                  </div>
                  <Link href="/calls" className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 transition-colors hover:text-sky-700">
                    Open Calls
                    <ChevronRight size={16} />
                  </Link>
                </div>

                <div className="grid gap-4">
                  {callLogs.length > 0 ? callLogs.map((call) => (
                    <div
                      key={call.id}
                      className={`flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 transition-all hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/5 md:flex-row md:items-center md:justify-between md:p-5 ${call.type === 'incoming' ? 'border-l-4 border-l-sky-400' : 'border-l-4 border-l-violet-400'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-2xl p-4 ${call.type === 'incoming' ? 'bg-sky-50 text-sky-500' : 'bg-violet-50 text-violet-500'}`}>
                          {call.type === 'incoming' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-800">{call.name}</p>
                          <p className="mt-1 text-sm font-medium capitalize text-slate-500">{call.type} call</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 text-sm font-medium text-slate-500 md:text-right">
                        <span>{call.date}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-700">{call.duration}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No recent calls in the dashboard summary yet.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 md:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-800">Quick Access</h2>
                  {/* <button className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                    <MoreHorizontal size={18} />
                  </button> */}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  {quickActions.map((action) => {
                    const ActionIcon = action.icon;

                    return (
                      <Link
                        href={action.route}
                        key={action.title}
                        className="group flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-sky-200 hover:bg-white hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`rounded-2xl p-3 ${action.accent}`}>
                            <ActionIcon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{action.title}</p>
                            <p className="text-sm font-medium text-slate-500">{action.subtitle}</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-500" />
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="overflow-hidden rounded-4xl bg-[#1F2F59] p-6 text-white shadow-xl shadow-slate-300/20 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">Upcoming Events</h2>
                    <p className="mt-1 text-sm font-medium text-white/60">What is coming up next across school, health, and legal prep.</p>
                  </div>
                  <CalendarDays size={20} className="text-white/60" />
                </div>

                <div className="mt-6 space-y-4">
                  {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 rounded-3xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                      <div
                        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-slate-900"
                        style={{ backgroundColor: event.color }}
                      >
                        <span className="text-[10px] font-bold uppercase leading-none text-slate-700">{event.date.split(' ')[0]}</span>
                        <span className="mt-1 text-lg font-black leading-none">{event.date.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="font-bold">{event.title}</p>
                        <p className="mt-1 text-sm text-white/60">{event.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm font-semibold text-white/70">
                      No upcoming events in the dashboard summary yet.
                    </div>
                  )}
                </div>

                <button onClick={() => router.push("/calendar")} className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold transition-colors hover:bg-white/15">
                  Open Calendar
                  <ChevronRight size={16} />
                </button>
              </section>

              <section className="rounded-4xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-6 shadow-sm shadow-slate-200/50 md:p-7">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">Focus Today</p>
                <h2 className="mt-3 text-2xl font-black text-slate-800">Keep the communication lane calm and documented.</h2>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                  {focusMessage}
                </p>
                <div className="mt-6 flex items-center gap-3 rounded-3xl bg-sky-50 p-4 text-sky-700">
                  <Sparkles size={18} />
                  <span className="text-sm font-bold">AI summary prepared from today&apos;s conversation patterns.</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-800">All Notifications</h2>
                <p className="text-xs font-medium text-slate-500">
                  {unreadNotificationCount} unread · {notifications.length} total
                </p>
              </div>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
              {isNotificationsLoading ? (
                <div className="py-10 text-center text-sm font-semibold text-slate-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-base font-bold text-slate-700">No notifications yet</p>
                  <p className="mt-1 text-sm text-slate-500">You are all caught up right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 ${item.is_read
                        ? 'border-slate-100 bg-slate-50/60'
                        : 'border-violet-200 bg-violet-50/60'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-6 text-slate-800">{item.message}</p>
                        {!item.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-500" />}
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}