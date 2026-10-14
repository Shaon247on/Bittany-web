import React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type SidebarItemProps = {
    icon: LucideIcon;
    label: string;
    href: string;
    active?: boolean;
    badgeCount?: number;
};

export const SidebarItem = ({ icon: Icon, label, href, active = false, badgeCount = 0 }: SidebarItemProps) => (
    <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center justify-between gap-3 px-6 py-4 transition-all ${active ? 'bg-white/20 border-r-4 border-white' : 'hover:bg-white/10'}`}
    >
        <span className="flex min-w-0 items-center gap-3">
            <Icon size={20} className="text-white" />
            <span className="truncate text-white font-medium">{label}</span>
        </span>
        {badgeCount > 0 && (
            <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm">
                {badgeCount > 99 ? '99+' : badgeCount}
            </span>
        )}
    </Link>
);