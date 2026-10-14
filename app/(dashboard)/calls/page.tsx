"use client";

import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import {
    Phone,
    Search,
    PhoneOutgoing,
    PhoneIncoming,
    PhoneMissed,
    Play,
    Clock,
    Calendar,
    MoreHorizontal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { BASE_URL } from '@/lib/axios';
import { useWebRTCHistoryQuery } from '@/hooks/useCall';
import { usePartnerOnline } from '@/lib/presence';
import { useBridgeInfoQuery } from '@/hooks/useBridge';
import { useCallContext } from '@/components/global/CallProvider';
import type { CallHistoryItem } from '@/types/call.type';

// Types
type CallType = 'Outgoing' | 'Incoming' | 'Missed Calls';

interface CallLog {
    id: number;
    name: string;
    type: CallType;
    date: string;
    duration: string;
    hasRecording: boolean;
}

function formatDateTime(value?: string | null) {
    if (!value) return 'Recent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recent';
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDuration(seconds?: number | null) {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function toCallType(value?: string): CallType {
    if (value === 'incoming') return 'Incoming';
    if (value === 'missed') return 'Missed Calls';
    return 'Outgoing';
}

function displayNameFromHistory(item: CallHistoryItem) {
    return item.receiver_user_name || item.caller_name || 'Co-parent';
}

function userImageUrl(image: string | null) {
    if (!image) return null;
    return image.startsWith('http') ? image : `${BASE_URL}${image}`;
}

export default function CallHistoryWeb() {
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const {
        canCall,
        startCall,
        isSending,
        serviceStatus,
        serviceError,
    } = useCallContext();

    const { data: bridgeInfo, isLoading: isBridgeLoading } = useBridgeInfoQuery();
    const {
        data: history = [],
        isLoading: isHistoryLoading,
    } = useWebRTCHistoryQuery();

    const partner = bridgeInfo?.partner ?? null;

    const mappedLogs = useMemo<CallLog[]>(() => {
        return history.map((item) => ({
            id: item.id,
            name: displayNameFromHistory(item),
            type: toCallType(item.call_type),
            date: formatDateTime(item.timestamp || item.start_time),
            duration: formatDuration(item.duration),
            hasRecording: Boolean(item.recordings?.length),
        }));
    }, [history]);

    const filteredLogs = useMemo(() => {
        const needle = searchQuery.trim().toLowerCase();

        return mappedLogs.filter((call) => {
            if (activeTab === 'Missed' && call.type !== 'Missed Calls') return false;
            if (activeTab === 'Recordings' && !call.hasRecording) return false;
            if (!needle) return true;
            return `${call.name} ${call.type} ${call.date}`.toLowerCase().includes(needle);
        });
    }, [activeTab, mappedLogs, searchQuery]);

    const heroName = partner?.name || partner?.username || 'Choose a co-parent';
    const isServiceReady = serviceStatus === 'ready';

    // Online state comes from the root presence socket (see lib/presence.ts), the
    // same one the chat header reads — not a Zego-based presence system, which
    // would only disagree with it.
    const partnerOnline = usePartnerOnline();
    const partnerStatusLabel =
        partnerOnline === null ? 'Checking...' : partnerOnline ? 'Online' : 'Offline';

    const heroSubtitle =
        serviceStatus === 'ready'
            ? 'Call Service Ready'
            : serviceStatus === 'error'
                ? 'Call Service Unavailable'
                : 'Connecting Call Service...';

    // Say exactly why the button cannot be pressed instead of just greying it out.
    const callBlockedReason = !partner
        ? 'Connect with your co-parent to start calling.'
        : serviceStatus === 'error'
            ? (serviceError ?? 'Call service is unavailable. Please reload and try again.')
            : serviceStatus !== 'ready'
                ? 'Preparing the call service...'
                : null;

    const partnerInitials = useMemo(() => {
        const name = partner?.name || partner?.username || 'Choose a co-parent';
        const parts = name.split(' ').filter(Boolean);
        return ((parts[0]?.[0] ?? 'C') + (parts[1]?.[0] ?? '')).toUpperCase();
    }, [partner]);

    if (isBridgeLoading || isHistoryLoading) {
        return (
            <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Skeleton Header / Hero */}
                    <div className="p-4 md:p-8">
                        <div className="bg-slate-200 animate-pulse rounded-4xl p-6 md:p-10 shadow-sm relative overflow-hidden h-44 md:h-52 flex items-center gap-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-300 rotate-3 shrink-0" />
                            <div className="flex-1 space-y-4">
                                <div className="h-8 bg-slate-300 rounded-lg w-1/3" />
                                <div className="h-5 bg-slate-300 rounded-lg w-1/2" />
                            </div>
                        </div>
                    </div>

                    {/* Skeleton Filter & Logs */}
                    <div className="px-4 md:px-8 pb-10">
                        <div className="max-w-5xl mx-auto">
                            {/* Filter bar skeleton */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div className="h-10 bg-slate-200 animate-pulse rounded-xl w-60" />
                                <div className="h-12 bg-slate-200 animate-pulse rounded-2xl w-full md:w-80" />
                            </div>

                            {/* Recent Activity Title Skeleton */}
                            <div className="h-7 bg-slate-200 animate-pulse rounded-lg w-48 mb-6" />

                            {/* Call logs skeletons */}
                            <div className="grid gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white border border-slate-100 p-4 md:p-6 rounded-3xl flex items-center justify-between gap-4 animate-pulse">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-5 bg-slate-200 rounded-lg w-24" />
                                                <div className="h-4 bg-slate-200 rounded-lg w-44" />
                                            </div>
                                        </div>
                                        <div className="w-24 h-10 bg-slate-200 rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-y-auto">

                {/* HEADER / HERO SECTION */}
                <div className="p-4 md:p-8">
                    <div className="bg-linear-to-br from-[#C4B5FD] to-[#A5F3FC] rounded-4xl p-6 md:p-10 shadow-xl shadow-blue-100/50 relative overflow-hidden">
                        {/* Abstract background circles for web aesthetic */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="relative">
                                    {partner && partner.image ? (
                                        <Image src={userImageUrl(partner.image)!} width={128} height={128} className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-white shadow-2xl rotate-3 object-cover" alt={heroName} unoptimized />
                                    ) : (
                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-white shadow-2xl rotate-3 bg-linear-to-br from-violet-500 to-sky-500 text-3xl font-black text-white flex items-center justify-center shrink-0 select-none">
                                            {partnerInitials}
                                        </div>
                                    )}
                                    {/* The dot on the avatar is the co-parent's presence, not our own
                                        service state — that lives in the subtitle. */}
                                    <div
                                        title={`Co-parent ${partnerStatusLabel}`}
                                        className={`absolute -bottom-2 -right-2 w-6 h-6 border-4 border-white rounded-full ${partnerOnline === true ? 'bg-green-500' : partnerOnline === false ? 'bg-slate-400' : 'bg-amber-400'}`}
                                    />
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800">{heroName}</h2>
                                    <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                                        <span className="flex items-center gap-1 text-slate-700 bg-white/40 px-3 py-1 rounded-full text-sm font-medium">
                                            <Phone size={14} /> Voice call
                                        </span>
                                        <span className="flex items-center gap-1.5 text-slate-700 bg-white/40 px-3 py-1 rounded-full text-sm font-medium">
                                            <span className={`h-2 w-2 rounded-full ${partnerOnline === true ? 'bg-emerald-500' : partnerOnline === false ? 'bg-slate-400' : 'bg-amber-400'}`} />
                                            {partnerStatusLabel}
                                        </span>
                                        <span className="text-slate-600 text-sm font-semibold uppercase tracking-wider">{heroSubtitle}</span>
                                    </div>
                                    {/* A browser tab cannot be woken like a phone can — say so instead of
                                        letting an unanswered call look like a bug. */}
                                    <p className="mt-2 text-xs font-medium text-slate-600/80">
                                        Rings on the ParentBridge app, or here while this tab is open.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3 items-center">
                                {partner ? (
                                    <>
                                        <div className="flex flex-col items-center gap-1 md:items-end">
                                            <div className="text-white text-sm font-semibold bg-white/20 px-4 py-2 rounded-2xl">
                                                {isServiceReady ? 'Ready to call' : 'Preparing call service'}
                                            </div>
                                            {callBlockedReason && (
                                                <p className="max-w-xs text-center text-xs font-medium text-rose-900/70 md:text-right">
                                                    {callBlockedReason}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={startCall}
                                            disabled={!canCall}
                                            title={callBlockedReason ?? undefined}
                                            className="flex items-center gap-2 bg-linear-to-r from-pink-500 to-fuchsia-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                        >
                                            <Phone size={18} fill="white" /> {isSending ? 'Calling...' : 'Call Now'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-white text-sm font-semibold bg-red-500/30 px-4 py-2 rounded-2xl">
                                        No co-parent connected yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOGS SECTION */}
                <div className="px-4 md:px-8 pb-10">
                    <div className="max-w-5xl mx-auto">

                        {/* FILTERS & TABS */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit">
                                {['All', 'Missed', 'Recordings'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="relative group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search by date or type..."
                                    className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-full md:w-80 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Clock className="text-slate-400" size={20} /> Recent Call Activity
                        </h3>

                        {/* CALL LOGS GRID */}
                        <div className="grid gap-4">
                            {filteredLogs.length > 0 ? filteredLogs.map((call) => (
                                <div
                                    key={call.id}
                                    className={`group bg-white border border-slate-100 p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5 transition-all
                        ${call.type === 'Missed Calls' ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-sky-400'}
                      `}
                                >
                                    <div className="flex items-center gap-5 w-full md:w-auto">
                                        <div className={`p-4 rounded-2xl shrink-0
                          ${call.type === 'Outgoing' ? 'bg-sky-50 text-sky-500' :
                                                call.type === 'Incoming' ? 'bg-violet-50 text-violet-500' :
                                                    'bg-red-50 text-red-500'}
                        `}>
                                            {call.type === 'Outgoing' && <PhoneOutgoing size={24} />}
                                            {call.type === 'Incoming' && <PhoneIncoming size={24} />}
                                            {call.type === 'Missed Calls' && <PhoneMissed size={24} />}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{call.type}</h4>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                                <span className="font-semibold text-slate-700">{call.name}</span>
                                                <span className="flex items-center gap-1"><Calendar size={14} /> {call.date}</span>
                                                <span className="flex items-center gap-1 font-medium"><Clock size={14} /> {call.duration}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                        {call.hasRecording && (
                                            <button onClick={() => router.push("/call-recording")} className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-700 px-5 py-2.5 rounded-xl font-bold text-xs transition-colors group/play">
                                                <Play size={16} className="fill-amber-700 group-hover/play:scale-110 transition-transform" />
                                                Play Recording
                                            </button>
                                        )}
                                        <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                                    No call history found for this filter.
                                </div>
                            )}
                        </div>

                        {/* Empty State / Load More */}
                        <div className="mt-8 text-center">
                            <button className="text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors">
                                View Older History
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
