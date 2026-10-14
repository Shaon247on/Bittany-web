import {
    MessageSquare, FileText, Calendar,
    DollarSign, Scale, Settings,
    Home,
    PhoneCall
} from 'lucide-react';

export const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: MessageSquare, label: "Chats", href: "/chats" },
  { icon: PhoneCall, label: "Calls", href: "/calls" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: DollarSign, label: "Expenses", href: "/expenses" },
  { icon: Scale, label: "Support Forum", href: "/support-forum" },
  { icon: Settings, label: "Settings", href: "/settings" },
];