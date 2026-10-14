"use client";

import React, { useState } from 'react';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Download,
    Hourglass,
    PhoneOutgoing,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Share2,
    MoreVertical,
    MessageSquareText
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const MichaelAvatar = "https://i.pravatar.cc/150?u=michael";

// Helper for Meta Info Rows
const MetaRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <span className="text-sm text-slate-800 font-bold">{value}</span>
    </div>
);

export default function CallRecordingWeb() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#f0f9ff] p-4 md:p-8">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/calls")} className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-600">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Call Recording</h1>
                            <p className="text-sm text-slate-500 font-medium">Ref ID: #CR-99210</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                            <Share2 size={18} /> Share
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-200 hover:scale-105 transition-all">
                            <Download size={18} /> Download
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: PLAYER & TRANSCRIPT */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* AUDIO PLAYER CARD */}
                        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100/50 border border-white relative overflow-hidden">
                            {/* Background Decorative Gradient */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />

                            <h2 className="text-slate-800 font-bold mb-8 flex items-center gap-2">
                                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                                Audio Visualization
                            </h2>

                            {/* WAVEFORM SIMULATION */}
                            <div className="h-32 flex items-center justify-center gap-1 mb-8">
                                {[...Array(60)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full transition-all duration-500 ${i < 15 ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                        style={{
                                            height: `${Math.max(15, Math.sin(i * 0.2) * 100 + 20)}%`,
                                            opacity: i < 15 ? 1 : 0.4
                                        }}
                                    />
                                ))}
                            </div>

                            {/* PROGRESS & CONTROLS */}
                            <div className="space-y-6 relative">
                                <div className="group cursor-pointer">
                                    <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 w-[25%] relative">
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-3 text-xs font-bold text-slate-400 tabular-nums">
                                        <span>02:14</span>
                                        <span>08:12</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                    {/* Speed Selector */}
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        {[0.5, 1, 1.5, 2].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setPlaybackSpeed(s)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${playbackSpeed === s ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                            >
                                                {s}x
                                            </button>
                                        ))}
                                    </div>

                                    {/* Main Controls */}
                                    <div className="flex items-center gap-6">
                                        <button className="text-slate-400 hover:text-indigo-500 transition-colors"><SkipBack fill="currentColor" size={28} /></button>
                                        <button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 transition-all hover:scale-110 active:scale-95"
                                        >
                                            {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
                                        </button>
                                        <button className="text-slate-400 hover:text-indigo-500 transition-colors"><SkipForward fill="currentColor" size={28} /></button>
                                    </div>

                                    {/* Volume */}
                                    <div className="flex items-center gap-3 min-w-[120px]">
                                        <Volume2 size={20} className="text-slate-400" />
                                        <div className="h-1.5 bg-slate-100 rounded-full flex-1">
                                            <div className="h-full bg-slate-300 w-[70%] rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        {/* TECHNICAL DETAILS */}
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-2 px-2">Technical Info</h4>
                            <MetaRow label="Initiated By" value="You" />
                            <MetaRow label="Ended By" value="Michael" />
                            <MetaRow label="Format" value="MP3 (320kbps)" />
                            <MetaRow label="Device" value="Web Dashboard" />
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR: METADATA */}
                    <aside className="space-y-6">

                        {/* CONTACT CARD */}
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 text-center">
                            <img src={MichaelAvatar} className="w-24 h-24 rounded-3xl mx-auto border-4 border-indigo-50 shadow-inner mb-4" alt="Michael" />
                            <h3 className="text-xl font-black text-slate-800">Michael Roberts</h3>
                            <div className="flex items-center justify-center gap-2 mt-1 text-slate-500 text-sm">
                                <PhoneOutgoing size={14} />
                                <span>Outgoing Call</span>
                            </div>
                        </div>

                        {/* CALL STATS CARD */}
                        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-4 px-2">Call Summary</h4>
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500"><Calendar size={18} /></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Date</p>
                                        <p className="text-sm font-bold text-slate-800">Jan 12, 2024</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-sky-500"><Clock size={18} /></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Start Time</p>
                                        <p className="text-sm font-bold text-slate-800">4:20 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500"><Hourglass size={18} /></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Total Duration</p>
                                        <p className="text-sm font-bold text-slate-800">08m 12s</p>
                                    </div>
                                </div>
                            </div>
                        </div>



                        <button className="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-sm hover:text-red-500 transition-colors">
                            Flag or Report Call
                        </button>
                    </aside>

                </div>
            </div>
        </div>
    );
}