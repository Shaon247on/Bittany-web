"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
    ArrowLeft,
    Download,
    Loader2,
    MoreVertical,
    Sparkles,
    Send,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { BASE_URL } from '@/lib/axios';
import { useAuthProfileQuery } from '@/hooks/useAuth';
import {
    useChatRoomsQuery,
    useDownloadChatHistoryMutation,
    useChatRoomSocket,
    useInfiniteRoomMessagesQuery,
    useUpdateChatMessageMutation,
} from '@/hooks/useChat';
import type { ChatMessage, ChatRoom, ChatUser } from '@/types/chat.type';

function formatDisplayName(value: string | null | undefined) {
    if (!value) return 'ParentBridge User';

    const baseValue = value.includes('@') ? value.split('@')[0] : value;
    const withoutTrailingId = baseValue.replace(/([._-]?\d+)$/g, '');
    const normalized = withoutTrailingId.replace(/[._-]+/g, ' ').trim();

    if (!normalized) return 'ParentBridge User';

    return normalized
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function getUserAvatar(image: string | null | undefined) {
    if (!image) return null;
    return image.startsWith('http') ? image : `${BASE_URL}${image}`;
}

function initialsFromName(value: string | null | undefined) {
    const name = formatDisplayName(value);
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || 'PB'
    );
}

function roomTitle(room: ChatRoom, myUserId?: number) {
    const participants = Array.isArray(room.participants)
        ? room.participants.filter((participant): participant is ChatUser => Boolean(participant))
        : [];
    const counterpart = participants.find((participant) => participant.id !== myUserId);
    if (counterpart) return formatDisplayName(counterpart.name || counterpart.username || counterpart.email);
    return room.name || 'Chat Room';
}

function messageText(message: ChatMessage, showOriginal: boolean) {
    if (!showOriginal && message.filtered_message?.trim()) return message.filtered_message;
    return message.message;
}

function shouldShowBothVersions(message: ChatMessage, showOriginal: boolean, isMine: boolean) {
    if (!isMine || !showOriginal) return false;
    const filtered = message.filtered_message?.trim();
    if (!filtered) return false;
    return filtered !== message.message?.trim();
}

function MessageBubble({
    message,
    isMine,
    showOriginal,
}: {
    message: ChatMessage;
    isMine: boolean;
    showOriginal: boolean;
}) {
    const senderAvatar = getUserAvatar(message.sender?.image);
    const senderName = formatDisplayName(message.sender?.name || message.sender?.username || message.sender?.email);

    return (
        <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[88%] items-end gap-2 md:max-w-[72%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {senderAvatar ? (
                        <Image src={senderAvatar} alt={senderName} fill className="object-cover" unoptimized />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-slate-600">
                            {initialsFromName(senderName)}
                        </span>
                    )}
                </div>

                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${isMine
                            ? 'rounded-br-md bg-linear-to-r from-sky-500 to-violet-500 text-white'
                            : 'rounded-bl-md bg-slate-100 text-slate-800'
                            }`}
                    >
                        {shouldShowBothVersions(message, showOriginal, isMine) ? (
                            <div className="space-y-2">
                                <div>
                                    <p className={`text-[10px] font-bold uppercase ${isMine ? 'text-white/80' : 'text-slate-500'}`}>
                                        Original
                                    </p>
                                    <p>{message.message}</p>
                                </div>
                                <div className={`border-t pt-2 ${isMine ? 'border-white/25' : 'border-slate-300'}`}>
                                    {isMine ? (
                                        <p className={`text-[10px] font-bold uppercase ${isMine ? 'text-white/80' : 'text-orange-500'}`}>
                                            Filtered
                                        </p>
                                    ) : null}
                                    <p>{message.filtered_message}</p>
                                </div>
                            </div>
                        ) : (
                            messageText(message, showOriginal)
                        )}
                        {isMine && message.is_filtered ? (
                            <p className={`mt-1 text-[10px] font-bold uppercase text-orange-300`}>
                                Filtered
                            </p>
                        ) : null}
                    </div>

                    <div className={`mt-1 flex items-center px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] font-medium text-slate-400">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChatBodySkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-start">
                <div className="h-16 w-56 animate-pulse rounded-2xl rounded-bl-md bg-slate-200" />
            </div>
            <div className="flex justify-end">
                <div className="h-14 w-44 animate-pulse rounded-2xl rounded-br-md bg-slate-200" />
            </div>
            <div className="flex justify-start">
                <div className="h-12 w-36 animate-pulse rounded-2xl rounded-bl-md bg-slate-200" />
            </div>
            <div className="flex justify-end">
                <div className="h-16 w-60 animate-pulse rounded-2xl rounded-br-md bg-slate-200" />
            </div>
        </div>
    );
}

function getStatusBadgeClass(statusColor: string) {
    const color = statusColor.toLowerCase();
    if (color === 'green') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (color === 'blue') return 'bg-sky-100 text-sky-700 border-sky-200';
    if (color === 'red') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getStatusLabel(statusColor: string) {
    const color = statusColor.toLowerCase();
    if (color === 'green') return 'supportive';
    if (color === 'blue') return 'cooperative';
    if (color === 'red') return 'neutral';
    return 'neutral';
}

type SuggestionItem = {
    text: string;
    tone?: string;
};

function normalizeSuggestionPayload(value: unknown): SuggestionItem[] {
    const items: SuggestionItem[] = [];

    const pushText = (text: unknown, tone?: unknown) => {
        if (typeof text !== 'string') return;
        const trimmed = text.trim();
        if (!trimmed) return;
        items.push({ text: trimmed, tone: typeof tone === 'string' ? tone.toLowerCase() : undefined });
    };

    if (typeof value === 'string') {
        pushText(value);
        return items;
    }

    if (Array.isArray(value)) {
        for (const entry of value) {
            if (typeof entry === 'string') {
                pushText(entry);
            } else if (entry && typeof entry === 'object') {
                const record = entry as Record<string, unknown>;
                pushText(record.suggestion, record.tone);
            }
        }
        return items;
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        pushText(record.suggestion, record.tone);
    }

    return items;
}

function getStatusColorFromTone(tone: string | undefined): string | null {
    if (!tone) return null;
    const normalized = tone.toLowerCase();
    if (normalized.includes('supportive')) return 'green';
    if (normalized.includes('cooperative')) return 'blue';
    if (normalized.includes('neutral')) return 'red';
    return null;
}

export default function ChatsPage() {
    const PAGE_SIZE = 20;
    const { data: profile } = useAuthProfileQuery();
    const { data: rooms = [], isLoading: isRoomsLoading } = useChatRoomsQuery();

    const [messageInput, setMessageInput] = useState('');
    const [showOriginal, setShowOriginal] = useState(false);
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [suggestedItems, setSuggestedItems] = useState<SuggestionItem[]>([]);
    const [messageStatusColor, setMessageStatusColor] = useState('green');
    const [statusReadyDraft, setStatusReadyDraft] = useState('');
    const [isStatusReady, setIsStatusReady] = useState(false);
    const [isFilterSending, setIsFilterSending] = useState(false);
    const [partnerPresenceByKey, setPartnerPresenceByKey] = useState<Record<string, boolean>>({});
    const room = rooms[0] ?? null;

    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);
    const loadingOlderRef = useRef(false);

    const messagesQuery = useInfiniteRoomMessagesQuery(room?.room_id ?? null, PAGE_SIZE);
    const updateMessage = useUpdateChatMessageMutation();
    const downloadChatHistory = useDownloadChatHistoryMutation();
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const profileLike = profile as Partial<{
        id: number;
        email: string;
        username: string;
        name: string;
    }>;

    const myUserId = profileLike?.id;
    const myEmail = profileLike?.email?.toLowerCase();
    const myUsername = profileLike?.username?.toLowerCase();
    const myName = profileLike?.name?.toLowerCase();

    const isCurrentUser = useCallback((user?: ChatUser | null) => {
        if (!user) return false;
        if (typeof myUserId === 'number') return user.id === myUserId;

        const userEmail = user.email?.toLowerCase();
        const userUsername = user.username?.toLowerCase();
        const userName = user.name?.toLowerCase();

        return (
            Boolean(myEmail && userEmail === myEmail) ||
            Boolean(myUsername && userUsername === myUsername) ||
            Boolean(myName && userName === myName)
        );
    }, [myEmail, myName, myUserId, myUsername]);

    const counterpart = useMemo(() => {
        if (!room) return null;

        const participants = Array.isArray(room.participants)
            ? room.participants.filter((item): item is ChatUser => Boolean(item))
            : [];

        return participants.find((participant) => !isCurrentUser(participant)) ?? participants[0] ?? null;
    }, [isCurrentUser, room]);

    const presenceStorageKey = useMemo(() => {
        if (!counterpart) return null;
        const viewer = typeof myUserId === 'number' ? String(myUserId) : 'anonymous';
        return `chat:presence:${viewer}:${counterpart.id}`;
    }, [counterpart, myUserId]);

    const socket = useChatRoomSocket({
        roomId: room?.room_id ?? null,
        enabled: Boolean(room?.room_id),
        onChatMessage: (event) => {
            const incoming: ChatMessage = {
                id: event.message_id,
                chat_room: room?.id ?? 0,
                sender: {
                    id: event.sender_id,
                    username: event.sender ?? '',
                    name: event.sender_name ?? event.sender ?? 'User',
                    email: '',
                    image: event.sender_image ?? null,
                },
                reply_to: event.reply_to_id ?? null,
                message: event.message,
                filtered_message: event.filtered_message ?? '',
                attachment: null,
                image: null,
                message_type: event.message_type ?? 'text',
                is_deleted: false,
                is_filtered: Boolean(event.is_filtered),
                status: event.status ?? 'neutral',
                status_color: event.status_color ?? 'green',
                timestamp: event.timestamp,
            };

            setLiveMessages((prev) => {
                const exists = prev.some((item) => item.id === incoming.id);
                if (exists) {
                    return prev.map((item) => (item.id === incoming.id ? incoming : item));
                }
                return [...prev, incoming];
            });

            // Mark counterpart messages as seen immediately when they arrive.
            const isSelf =
                (typeof myUserId === 'number' && Number(event.sender_id) === Number(myUserId)) ||
                Boolean(myUsername && event.sender?.toLowerCase() === myUsername) ||
                Boolean(myName && event.sender_name?.toLowerCase() === myName);
            if (!isSelf) {
                socket.sendSeen([event.message_id]);
            }

            const isSelfById =
                typeof myUserId === 'number' && Number(event.sender_id) === Number(myUserId);
            const eventSender = event.sender?.toLowerCase();
            const eventSenderName = event.sender_name?.toLowerCase();
            const isSelfByIdentity =
                Boolean(myUsername && eventSender && myUsername === eventSender) ||
                Boolean(myName && eventSenderName && myName === eventSenderName);

            if (isSelfById || isSelfByIdentity) {
                if (event.status_color) {
                    setMessageStatusColor(event.status_color.toLowerCase());
                }
                setIsFilterSending(false);
            }
        },
        onTyping: (event) => {
            if (!event.is_typing) {
                setTypingUser(null);
                return;
            }
            setTypingUser(formatDisplayName(event.username));
        },
        onSuggestion: (event) => {
            const responseDraft = event.original_message?.trim() ?? '';
            const currentDraft = messageInput.trim();
            if (!responseDraft || responseDraft !== currentDraft) return;

            const nextSuggestions = normalizeSuggestionPayload(event.suggestion);
            setSuggestedItems(nextSuggestions);
            setStatusReadyDraft(responseDraft);
            setIsStatusReady(true);
            if (event.status_color) {
                setMessageStatusColor(event.status_color.toLowerCase());
                return;
            }

            const inferred = getStatusColorFromTone(nextSuggestions[0]?.tone);
            if (inferred) {
                setMessageStatusColor(inferred);
            }
        },
        onPresence: (event) => {
            if (!counterpart) return;

            const isCounterpartEvent =
                event.user_id === counterpart.id ||
                event.username?.toLowerCase() === counterpart.username?.toLowerCase();

            if (!isCounterpartEvent) return;
            const isOnline = event.type === 'user_joined';
            if (presenceStorageKey) {
                setPartnerPresenceByKey((prev) => ({
                    ...prev,
                    [presenceStorageKey]: isOnline,
                }));
            }

            if (presenceStorageKey) {
                try {
                    window.localStorage.setItem(presenceStorageKey, isOnline ? 'online' : 'offline');
                } catch {
                    // Ignore storage failures (private mode, blocked storage, etc.)
                }
            }
        },
        onPartnerStatus: (event) => {
            if (!presenceStorageKey) return;
            const isOnline = event.is_online;
            setPartnerPresenceByKey((prev) => ({
                ...prev,
                [presenceStorageKey]: isOnline,
            }));
            try {
                window.localStorage.setItem(presenceStorageKey, isOnline ? 'online' : 'offline');
            } catch {
                // Ignore storage failures.
            }
        },
        onError: (event) => {
            setIsFilterSending(false);
            toast.error(event.message || 'Chat socket error');
        },
    });

    const headerDisplayName = counterpart
        ? formatDisplayName(counterpart.name || counterpart.username || counterpart.email)
        : room
            ? roomTitle(room, myUserId)
            : 'Chat';

    const persistedPartnerOnline = useMemo(() => {
        if (!presenceStorageKey || typeof window === 'undefined') return null;
        try {
            const storedPresence = window.localStorage.getItem(presenceStorageKey);
            if (storedPresence === 'online') return true;
            if (storedPresence === 'offline') return false;
            return null;
        } catch {
            return null;
        }
    }, [presenceStorageKey]);

    const partnerOnline = presenceStorageKey
        ? (partnerPresenceByKey[presenceStorageKey] ?? persistedPartnerOnline)
        : null;

    const headerAvatar = getUserAvatar(counterpart?.image);
    const headerSubtext = `Partner • ${partnerOnline === null ? 'Checking...' : partnerOnline ? 'Online' : 'Offline'}`;
    const presenceDotClass =
        partnerOnline === true
            ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)] animate-pulse'
            : 'bg-slate-400';
    const shouldShowSuggestionPanel =
        messageInput.trim().length > 0 && messageStatusColor.toLowerCase() !== 'green';
    const messageStatusLabel = getStatusLabel(messageStatusColor);
    const showStatusSkeleton = messageInput.trim().length > 0 && socket.isConnected && !isStatusReady;

    useEffect(() => {
        shouldStickToBottomRef.current = true;
        loadingOlderRef.current = false;
    }, [room?.room_id]);

    // Mark all messages as seen when the socket connects for a room.
    useEffect(() => {
        if (socket.isConnected) {
            socket.sendAllSeen();
        }
    }, [socket.isConnected, socket]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
            }
        };
    }, []);

    const queueSuggestionRequest = useCallback((nextMessage: string) => {
        if (suggestionTimeoutRef.current) {
            clearTimeout(suggestionTimeoutRef.current);
        }

        const trimmed = nextMessage.trim();
        setStatusReadyDraft(trimmed);
        setIsStatusReady(false);

        if (!trimmed || !socket.isConnected) {
            setSuggestedItems([]);
            setMessageStatusColor('green');
            return;
        }

        // Show placeholder state while waiting for next suggestion response.
        setSuggestedItems([]);

        suggestionTimeoutRef.current = setTimeout(() => {
            socket.requestSuggestion(trimmed);
        }, 900);
    }, [socket]);

    const messages = useMemo(
        () => {
            const pages = messagesQuery.data?.pages ?? [];
            const fromApi: ChatMessage[] = [];
            for (let i = pages.length - 1; i >= 0; i -= 1) {
                fromApi.push(...[...pages[i].results].reverse());
            }

            const merged = new Map<number, ChatMessage>();
            for (const item of fromApi) merged.set(item.id, item);
            for (const item of liveMessages) merged.set(item.id, item);
            return Array.from(merged.values()).sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
            );
        },
        [liveMessages, messagesQuery.data?.pages],
    );

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || messages.length === 0) return;
        if (!shouldStickToBottomRef.current) return;

        container.scrollTop = container.scrollHeight;
    }, [messages.length]);

    const handleMessagesScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const nearBottom =
            container.scrollHeight - (container.scrollTop + container.clientHeight) < 80;
        shouldStickToBottomRef.current = nearBottom;

        if (
            container.scrollTop <= 80 &&
            messagesQuery.hasNextPage &&
            !loadingOlderRef.current &&
            !messagesQuery.isLoading
        ) {
            loadingOlderRef.current = true;
            void messagesQuery.fetchNextPage().finally(() => {
                loadingOlderRef.current = false;
            });
        }
    }, [messagesQuery]);

    function handleSendMessage() {
        if (!room || !messageInput.trim()) return;

        const trimmedMessage = messageInput.trim();
        const payload = {
            message: trimmedMessage,
            message_type: 'text',
            reply_to: null,
        };

        if (editingMessage) {
            updateMessage.mutate(
                { roomId: room.room_id, messageId: editingMessage.id, payload: { message: payload.message } },
                {
                    onSuccess: () => {
                        toast.success('Message updated');
                        setMessageInput('');
                        setEditingMessage(null);
                    },
                    onError: () => toast.error('Could not update message'),
                },
            );
            return;
        }

        if (socket.isConnected) {
            const isReadyForCurrentDraft = isStatusReady && statusReadyDraft === payload.message;
            const shouldSendAsMessage = isReadyForCurrentDraft && messageStatusColor.toLowerCase() === 'green';
            const sent =
                shouldSendAsMessage
                    ? socket.sendMessage(payload.message, null, 'text')
                    : socket.requestFilter(payload.message, 'text');

            if (sent) {
                setIsFilterSending(!shouldSendAsMessage);
                setMessageInput('');
                setSuggestedItems([]);
                setMessageStatusColor('green');
                setStatusReadyDraft('');
                setIsStatusReady(false);
                setTypingUser(null);
                socket.sendTyping(false);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                if (suggestionTimeoutRef.current) {
                    clearTimeout(suggestionTimeoutRef.current);
                }
                return;
            }
        }

        setIsFilterSending(false);
        toast.error('Could not send message: socket is not connected');
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900">
            <section className="flex h-full min-w-0 flex-1 flex-col bg-white">
                {isRoomsLoading ? (
                    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
                        <header className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-[#C4B5FD] to-[#A5F3FC] px-4 py-3 md:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <button className="rounded-full p-2 text-slate-700 hover:bg-white/35 md:hidden">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/70 bg-white/60" />
                                <div>
                                    <div className="h-5 w-40 animate-pulse rounded-lg bg-white/75" />
                                    <p className="mt-1 text-xs font-semibold text-slate-600">Loading chat...</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="rounded-full p-2 text-slate-700 hover:bg-white/35">
                                    <Download size={18} />
                                </button>
                                {/* <button className="rounded-full p-2 text-slate-700 hover:bg-white/35">
                                    <MoreVertical size={18} />
                                </button> */}
                            </div>
                        </header>
                        <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 md:px-6">
                            <ChatBodySkeleton />
                        </main>
                        <footer className="border-t border-slate-100 bg-white p-4 md:px-6">
                            <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
                        </footer>
                    </div>
                ) : !room ? (
                    <div className="flex h-full items-center justify-center px-6 text-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Chat unavailable</h3>
                            <p className="mt-1 text-sm text-slate-500">Room could not be loaded right now.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <header className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-[#C4B5FD] to-[#A5F3FC] px-4 py-3 md:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <button className="rounded-full p-2 text-slate-700 hover:bg-white/35 md:hidden">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/70 bg-white/60">
                                    {headerAvatar ? (
                                        <Image src={headerAvatar} alt={headerDisplayName} fill className="object-cover" unoptimized />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-xs font-black text-slate-700">
                                            {initialsFromName(headerDisplayName)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="truncate text-base font-black text-slate-800 md:text-lg">
                                        {headerDisplayName}
                                    </h2>
                                    {headerSubtext ? (
                                        <p className="truncate text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
                                            <span className={`h-2 w-2 rounded-full ${presenceDotClass}`} />
                                            {headerSubtext}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        downloadChatHistory.mutate(undefined, {
                                            onError: () => toast.error('Could not download chat history'),
                                        })
                                    }
                                    className="rounded-full p-2 text-slate-700 hover:bg-white/35"
                                    title="Download chat history"
                                >
                                    <Download size={18} />
                                </button>
                                <label className="flex items-center gap-2 rounded-full bg-white/45 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={showOriginal}
                                        onChange={(event) => setShowOriginal(event.target.checked)}
                                        className="h-3.5 w-3.5 accent-violet-600"
                                    />
                                    Original
                                </label>
                                {/* <button className="rounded-full p-2 text-slate-700 hover:bg-white/35">
                                    <MoreVertical size={18} />
                                </button> */}
                            </div>
                        </header>

                        <main
                            ref={messagesContainerRef}
                            onScroll={handleMessagesScroll}
                            className="relative flex-1 overflow-y-auto bg-slate-50 px-4 py-5 md:px-6"
                        >
                            {messagesQuery.isFetchingNextPage && (
                                <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                                    Loading older messages...
                                </div>
                            )}
                            {messagesQuery.isLoading ? (
                                <ChatBodySkeleton />
                            ) : messages.length === 0 ? (
                                <div className="flex min-h-full items-end justify-center pb-6 text-center text-sm text-slate-500">
                                    No messages yet. Start the conversation.
                                </div>
                            ) : (
                                <div className="flex min-h-full flex-col justify-end space-y-4">
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            isMine={isCurrentUser(message.sender)}
                                            showOriginal={showOriginal}
                                        />
                                    ))}

                                    {typingUser && (
                                        <div className="flex justify-start">
                                            <div className="flex items-end gap-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-600">
                                                    {initialsFromName(typingUser)}
                                                </div>
                                                <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 shadow-sm">
                                                    <div className="mb-1 text-[10px] font-semibold text-slate-500">
                                                        {typingUser} is typing
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </main>

                        <footer className="border-t border-slate-100 bg-white p-4 md:px-6">
                            {editingMessage && (
                                <div className="mb-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                                    <span>Editing your message</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingMessage(null);
                                            setMessageInput('');
                                        }}
                                        className="rounded p-1 hover:bg-amber-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {shouldShowSuggestionPanel && (
                                <div className="mb-3 mt-2 rounded-xl border border-sky-100 bg-linear-to-r from-sky-50 to-cyan-50 p-3">
                                    <div className="mb-1 flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-sky-700">
                                            <Sparkles size={12} /> Suggested Message
                                        </span>
                                    </div>
                                    {suggestedItems.length > 0 ? (
                                        <div className="space-y-2">
                                            {suggestedItems.slice(0, 3).map((item, index) => (
                                                <button
                                                    key={`${item.text}-${index}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setMessageInput(item.text);
                                                        setMessageStatusColor('green');
                                                        setStatusReadyDraft(item.text.trim());
                                                        setIsStatusReady(true);
                                                    }}
                                                    className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                                                >
                                                    <span>{item.text}</span>
                                                    {item.tone ? (
                                                        <span className="ml-2 text-[10px] font-bold uppercase text-sky-700">
                                                            {item.tone}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="h-9 w-full animate-pulse rounded-lg bg-white/80" />
                                            <div className="h-9 w-11/12 animate-pulse rounded-lg bg-white/80" />
                                            <div className="h-9 w-10/12 animate-pulse rounded-lg bg-white/80" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <div className="relative min-w-0 flex-1">
                                    <input
                                        value={messageInput}
                                        onChange={(event) => {
                                            const nextValue = event.target.value;
                                            setMessageInput(nextValue);

                                            if (socket.isConnected) {
                                                socket.sendTyping(true);
                                                if (typingTimeoutRef.current) {
                                                    clearTimeout(typingTimeoutRef.current);
                                                }
                                                typingTimeoutRef.current = setTimeout(() => {
                                                    socket.sendTyping(false);
                                                }, 900);
                                            }

                                            queueSuggestionRequest(nextValue);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder={editingMessage ? 'Update your message...' : 'Type your message...'}
                                        className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-sm outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
                                    {showStatusSkeleton ? (
                                        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex h-6 w-20 -translate-y-1/2 animate-pulse rounded-full border border-slate-200 bg-slate-200/80" />
                                    ) : (
                                        <span
                                            className={`pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClass(messageStatusColor)}`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${messageStatusColor === 'green'
                                                    ? 'bg-emerald-500'
                                                    : messageStatusColor === 'blue'
                                                        ? 'bg-sky-500'
                                                        : 'bg-red-500'
                                                    }`}
                                            />
                                            {messageStatusLabel}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || updateMessage.isPending || isFilterSending}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-r from-sky-500 to-violet-500 text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isFilterSending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                </button>
                            </div>
                        </footer>
                    </>
                )}
            </section>
        </div>
    );
}
