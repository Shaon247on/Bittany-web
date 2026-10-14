"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    Home, 
    MessageSquare, 
    Calendar, 
    FileText, 
    MoreHorizontal, 
    PhoneCall, 
    DollarSign, 
    Scale, 
    Settings, 
    LogOut,
    X
} from 'lucide-react';
import { useNotificationCountsQuery } from '@/hooks/useNotification';
import { clearAuthStorage } from '@/hooks/useAuth';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { data: counts = [] } = useNotificationCountsQuery();

    const countByType = counts.reduce<Record<string, number>>((acc, item) => {
        acc[item.type] = item.count;
        return acc;
    }, {});

    const countByHref: Record<string, number> = {
        '/chats': countByType.messages ?? 0,
        '/calls': countByType.calls ?? 0,
        '/documents': countByType.documents ?? 0,
        '/calendar': countByType.calendar ?? 0,
        '/support-forum': countByType.support ?? 0,
    };

    const handleLogout = () => {
        setIsMenuOpen(false);
        clearAuthStorage();
        router.replace("/");
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    // Close menu on navigation
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const isActive = (href: string) => {
        if (href === '/home') {
            return pathname === '/home' || pathname === '/';
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const drawerItems = [
        { icon: PhoneCall, label: "Calls", href: "/calls", badge: countByHref['/calls'] ?? 0 },
        { icon: DollarSign, label: "Expenses", href: "/expenses", badge: 0 },
        { icon: Scale, label: "Support Forum", href: "/support-forum", badge: countByHref['/support-forum'] ?? 0 },
        { icon: Settings, label: "Settings", href: "/settings", badge: 0 },
    ];

    const isMoreActive = drawerItems.some(item => isActive(item.href));

    return (
        <>
            {/* Bottom Nav Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 px-4 py-2 lg:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
                <div className="mx-auto flex max-w-md justify-between items-center">
                    <TabItem href="/home" icon={Home} label="Home" active={isActive('/home')} />
                    <TabItem href="/chats" icon={MessageSquare} label="Chats" active={isActive('/chats')} badgeCount={countByHref['/chats']} />
                    <TabItem href="/calendar" icon={Calendar} label="Calendar" active={isActive('/calendar')} badgeCount={countByHref['/calendar']} />
                    <TabItem href="/documents" icon={FileText} label="Documents" active={isActive('/documents')} badgeCount={countByHref['/documents']} />
                    
                    {/* More Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 active:scale-90 relative ${
                            isMenuOpen || isMoreActive 
                                ? 'text-violet-400 font-bold' 
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <MoreHorizontal size={22} className="transition-transform duration-200" />
                        <span className="text-[10px] tracking-wide font-medium">More</span>
                        {drawerItems.some(item => (item.badge ?? 0) > 0) && (
                            <span className="absolute top-1.5 right-3 h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-slate-900" />
                        )}
                    </button>
                </div>
            </div>

            {/* Menu Drawer Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden transition-all duration-300" />
            )}

            {/* Menu Drawer Content */}
            <div
                ref={menuRef}
                className={`fixed left-4 right-4 z-50 rounded-3xl bg-slate-900/95 backdrop-blur-lg border border-white/10 p-5 shadow-2xl lg:hidden transition-all duration-300 ease-out flex flex-col gap-2 ${
                    isMenuOpen 
                        ? 'bottom-[76px] opacity-100 translate-y-0 scale-100' 
                        : 'bottom-[-400px] opacity-0 translate-y-10 scale-95 pointer-events-none'
                }`}
            >
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
                    <span className="text-sm font-black text-slate-300 uppercase tracking-wider">More Features</span>
                    <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {drawerItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 active:scale-95 border ${
                                    active
                                        ? 'bg-violet-600/30 border-violet-500/30 text-violet-200 font-bold'
                                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <Icon size={20} className={active ? 'text-violet-300' : 'text-slate-400'} />
                                <div className="flex-1 flex items-center justify-between min-w-0">
                                    <span className="truncate text-xs font-semibold">{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="rounded-full bg-pink-500 px-1.5 py-0.5 text-[9px] font-black leading-none text-white shadow-sm">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="border-t border-white/10 pt-3 mt-2">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/20 px-4 py-3.5 text-xs font-black text-rose-200 hover:text-white transition-all active:scale-95 cursor-pointer"
                    >
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        </>
    );
}

type TabItemProps = {
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    active: boolean;
    badgeCount?: number;
};

function TabItem({ href, icon: Icon, label, active, badgeCount = 0 }: TabItemProps) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 active:scale-90 relative ${
                active 
                    ? 'text-violet-400 font-bold scale-105' 
                    : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            <Icon size={22} />
            <span className="text-[10px] tracking-wide font-medium">{label}</span>
            {badgeCount > 0 && (
                <span className="absolute top-1 right-2.5 rounded-full bg-pink-500 px-1.5 py-0.5 text-[8px] font-black leading-none text-white shadow-sm ring-1 ring-slate-900">
                    {badgeCount > 99 ? '99+' : badgeCount}
                </span>
            )}
        </Link>
    );
}
