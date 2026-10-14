"use client";

import React from 'react';

import { SidebarItem } from './SidebarItem';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { NAV_ITEMS } from '@/constants/sidebar';
import { useNotificationCountsQuery } from '@/hooks/useNotification';
import { clearAuthStorage } from '@/hooks/useAuth';



const isActivePath = (pathname: string, href: string) => {
    if (href === '/home') {
        return pathname === '/home' || pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
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
        clearAuthStorage();
        router.replace("/");
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden text-white">
            <div className="shrink-0 p-8">
                <div
                    className="relative size-20 rounded-xl bg-no-repeat bg-size-[100%_100%] bg-white overflow-hidden"
                >
                    <Image
                        src="/images/app-icon.png" // Ensure your logo is in the /public folder
                        alt="Logo"
                        fill
                        priority
                        className=" object-cover"
                    />
                </div>
            </div>
            <div className="min-h-0 flex-1 px-3 pb-3 flex flex-col justify-between">
                <nav className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                    {NAV_ITEMS.map((item) => (
                        <SidebarItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={isActivePath(pathname, item.href)}
                            badgeCount={countByHref[item.href] ?? 0}
                        />
                    ))}
                </nav>
                <div className="shrink-0 border-t border-white/10 pt-3 mt-3">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-6 py-4 rounded-xl transition-all hover:bg-rose-500/20 active:scale-[0.98] text-rose-200 hover:text-white text-left font-medium cursor-pointer"
                    >
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
