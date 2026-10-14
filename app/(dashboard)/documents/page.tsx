"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Loader2, FolderKanban, ShieldCheck, Users, FileArchive, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthProfileQuery } from '@/hooks/useAuth';
import { BASE_URL } from '@/lib/axios';
import { useCreateDocumentMutation, useDocumentsQuery } from '@/hooks/useDocument';
import { DocumentCardItem, DocumentRecord } from '@/types/document.type';
import { FilterPill } from '@/components/modules/document/FilterPill';
import { DocumentCard } from '@/components/modules/document/DocumentCard';
import { AddDocumentModal, AddDocumentPayload } from '@/components/ui/AddDocumentModal';

const CATEGORY_STYLE_MAP: Record<string, { categoryBg: string; cardBg: string; accentColor: string }> = {
    legal: { categoryBg: '#FFAB08', cardBg: '#F2EDE4', accentColor: '#FFAB08' },
    medical: { categoryBg: '#FF4949', cardBg: '#F6E9EC', accentColor: '#FF4949' },
    education: { categoryBg: '#B67FE8', cardBg: '#F0E9F6', accentColor: '#B67FE8' },
    financial: { categoryBg: '#14B8A6', cardBg: '#E8F8F6', accentColor: '#14B8A6' },
    activity: { categoryBg: '#3B82F6', cardBg: '#EAF2FF', accentColor: '#3B82F6' },
    other: { categoryBg: '#64748B', cardBg: '#EEF2F7', accentColor: '#64748B' },
};

const CATEGORY_LABELS: Record<string, string> = {
    all: 'All',
    legal: 'Legal',
    medical: 'Medical',
    education: 'Education',
    financial: 'Financial',
    activity: 'Activity',
    other: 'Other',
};

function formatDateLabel(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
}

function toAssetUrl(path: string | null | undefined) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
}

function deriveFileTypesLabel(document: DocumentRecord) {
    if (document.file_type?.trim()) return document.file_type;

    const labels = new Set<string>();
    for (const file of document.files ?? []) {
        const extension = file.file.split('.').pop()?.toUpperCase();
        if (extension) labels.add(extension);
    }
    if ((document.images?.length ?? 0) > 0) labels.add('Image');

    return labels.size ? Array.from(labels).join(', ') : 'N/A';
}

function toCardItem(
    document: DocumentRecord,
    myUserId?: number,
    childNameById: Record<number, string> = {},
): DocumentCardItem {
    const normalizedCategory = (document.category || 'other').toLowerCase();
    const style = CATEGORY_STYLE_MAP[normalizedCategory] ?? CATEGORY_STYLE_MAP.other;

    return {
        id: String(document.id),
        rawId: document.id,
        title: document.title?.trim() || `Document #${document.id}`,
        category: CATEGORY_LABELS[normalizedCategory] ?? CATEGORY_LABELS.other,
        categoryColor: '#FFFFFF',
        categoryBg: style.categoryBg,
        owner: typeof myUserId === 'number' && document.user === myUserId ? 'You' : 'Co-parent',
        childName: childNameById[document.child] || `Child #${document.child}`,
        uploadedAt: formatDateLabel(document.created_at),
        fileTypesLabel: deriveFileTypesLabel(document),
        cardBg: style.cardBg,
        accentColor: style.accentColor,
    };
}

function getApiErrorMessage(error: unknown) {
    if (error && typeof error === 'object') {
        const err = error as {
            response?: {
                data?: {
                    message?: string;
                    error?: { details?: unknown };
                };
            };
        };

        const message = err.response?.data?.message;
        const details = err.response?.data?.error?.details;
        if (typeof details === 'string' && details) return details;
        if (message) return message;
    }
    return 'Unable to complete document request';
}

export default function DocumentVaultPage() {
    const { data: profile } = useAuthProfileQuery();
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

    const myUserId = profile?.children ? (profile as { id?: number }).id : undefined;
    const childNameById = useMemo(() => {
        const map: Record<number, string> = {};
        for (const child of profile?.children ?? []) {
            if (typeof child.id === 'number') {
                map[child.id] = child.name;
            }
        }
        return map;
    }, [profile?.children]);

    const documentsQuery = useDocumentsQuery('all');
    const createDocument = useCreateDocumentMutation();

    const allFetchedDocuments = useMemo(() => documentsQuery.data ?? [], [documentsQuery.data]);

    const allDocuments = useMemo(() => {
        const data = allFetchedDocuments;
        if (activeCategory === 'all') return data;
        return data.filter((item) => (item.category || 'other').toLowerCase() === activeCategory);
    }, [activeCategory, allFetchedDocuments]);
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {
            all: allFetchedDocuments.length,
            legal: 0,
            medical: 0,
            education: 0,
            financial: 0,
            activity: 0,
            other: 0,
        };

        counts.all = allFetchedDocuments.length;

        for (const item of allFetchedDocuments) {
            const key = (item.category || 'other').toLowerCase();
            if (counts[key] !== undefined) counts[key] += 1;
        }
        return counts;
    }, [allFetchedDocuments]);

    const cardItems = useMemo(() => {
        return allDocuments.map((document) => toCardItem(document, myUserId, childNameById));
    }, [allDocuments, childNameById, myUserId]);

    const stats = useMemo(() => {
        const total = allFetchedDocuments.length;
        const mine = allFetchedDocuments.filter(
            (item) => typeof myUserId === 'number' && item.user === myUserId,
        ).length;
        const partner = Math.max(total - mine, 0);
        const withAttachments = allFetchedDocuments.filter(
            (item) => (item.files?.length ?? 0) > 0 || (item.images?.length ?? 0) > 0,
        ).length;

        return { total, mine, partner, withAttachments };
    }, [allFetchedDocuments, myUserId]);

    const visibleDocuments = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();

        if (!searchTerm) {
            return cardItems;
        }

        return cardItems.filter((document) => {
            return [document.title, document.owner, document.childName, document.category]
                .join(' ')
                .toLowerCase()
                .includes(searchTerm);
        });
    }, [cardItems, search]);

    const selectedDocument = useMemo(() => {
        if (selectedDocumentId === null) return null;
        return allFetchedDocuments.find((item) => item.id === selectedDocumentId) ?? null;
    }, [allFetchedDocuments, selectedDocumentId]);

    const childOptions = useMemo(() => {
        return (profile?.children ?? [])
            .filter((child) => typeof child.id === 'number')
            .map((child) => ({ label: child.name, value: String(child.id) }));
    }, [profile?.children]);

    const handleAddDocument = async (payload: AddDocumentPayload) => {
        try {
            await createDocument.mutateAsync({
                title: payload.title,
                category: payload.category,
                child: payload.childId,
                description: payload.description,
                expiration_date: payload.expirationDate,
                upload_files: payload.uploadFiles,
                upload_images: payload.uploadImages,
            });
            await documentsQuery.refetch();
            toast.success('Document created successfully');
        } catch (error) {
            toast.error(getApiErrorMessage(error));
            throw error;
        }
    };

    const handleSelectCard = (id: string) => {
        const numericId = Number(id);
        if (!Number.isFinite(numericId)) return;
        setSelectedDocumentId(numericId);
    };

    const getFileNameFromPath = (path: string) => {
        const part = path.split('/').pop() || 'download';
        return decodeURIComponent(part);
    };

    const triggerDownload = (url: string, filename: string) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    const handleDownload = (id: string) => {
        const target = allFetchedDocuments.find((doc) => String(doc.id) === id);
        if (!target) {
            toast.error('Document not found');
            return;
        }

        const fileDownloads = (target.files ?? [])
            .map((file) => ({
                url: toAssetUrl(file.file),
                name: getFileNameFromPath(file.file),
            }))
            .filter((item): item is { url: string; name: string } => Boolean(item.url));

        const imageDownloads = (target.images ?? [])
            .map((image) => ({
                url: toAssetUrl(image.image),
                name: getFileNameFromPath(image.image),
            }))
            .filter((item): item is { url: string; name: string } => Boolean(item.url));

        const downloads = [...fileDownloads, ...imageDownloads];
        if (downloads.length === 0) {
            toast.error('No downloadable file for this document');
            return;
        }

        downloads.forEach((asset) => {
            triggerDownload(asset.url, asset.name);
        });
        toast.success(`Downloading ${downloads.length} item(s)`);
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F5F8FD]">
            <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />

            <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 px-6 py-4 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-black text-slate-800">Document Vault</h1>
                        <p className="text-xs font-medium text-slate-500">Manage, filter, and share family records in one place.</p>
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-sky-500 via-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-xl shadow-sky-200 transition-all hover:-translate-y-0.5 hover:opacity-95 active:scale-95"
                    >
                        <Plus size={18} /> Add Document
                    </button>
                </div>
            </nav>

            <main className="relative mx-auto max-w-7xl px-6 pb-20 pt-8">
                <section className="rounded-3xl border border-slate-200/60 bg-white/75 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-sm md:p-5">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 to-cyan-50 p-4">
                            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-sky-700"><FolderKanban size={14} /> Total Docs</p>
                            <p className="mt-2 text-2xl font-black text-slate-800">{stats.total}</p>
                        </div>
                        <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 to-fuchsia-50 p-4">
                            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-violet-700"><ShieldCheck size={14} /> Your Docs</p>
                            <p className="mt-2 text-2xl font-black text-slate-800">{stats.mine}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-green-50 p-4">
                            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700"><Users size={14} /> Co-parent</p>
                            <p className="mt-2 text-2xl font-black text-slate-800">{stats.partner}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50 p-4">
                            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-amber-700"><FileArchive size={14} /> With Files</p>
                            <p className="mt-2 text-2xl font-black text-slate-800">{stats.withAttachments}</p>
                        </div>
                    </div>
                </section>

                <section className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm md:p-5">
                    <div className="flex flex-col items-start justify-between gap-4 xl:items-center">
                        <div className="relative w-full  group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-500" size={20} />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search title, owner, child, category..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                            />
                        </div>

                        <div className="flex w-full items-center gap-3 overflow-x-auto pb-2 xl:w-auto xl:pb-0">
                            {Object.entries(CATEGORY_LABELS).map(([categoryKey, label]) => (
                                <FilterPill
                                    key={categoryKey}
                                    label={`${label} (${categoryCounts[categoryKey] ?? 0})`}
                                    active={activeCategory === categoryKey}
                                    onClick={() => setActiveCategory(categoryKey)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {documentsQuery.isLoading ? (
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-56 animate-pulse rounded-3xl border border-slate-200/80 bg-linear-to-br from-slate-100 to-slate-200/70"
                            />
                        ))}
                    </div>
                ) : documentsQuery.isError ? (
                    <div className="mt-14 rounded-3xl border border-rose-100 bg-rose-50/80 p-8 text-center">
                        <h3 className="text-xl font-black text-rose-700">Could not load documents</h3>
                        <p className="mt-1 text-sm font-medium text-rose-600">Please refresh or try again in a moment.</p>
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {visibleDocuments.map((item) => (
                            <DocumentCard
                                key={item.id}
                                item={item}
                                onDownload={handleDownload}
                                onSelect={handleSelectCard}
                            />
                        ))}
                            </div>
                )}

                {!documentsQuery.isLoading && visibleDocuments.length === 0 && (
                    <div className="mt-14 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">No documents found</h3>
                        <p className="mt-1 text-sm text-slate-500">Try a different filter, or add a new document to get started.</p>
                    </div>
                )}
            </main>

            <AddDocumentModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onAddDocument={handleAddDocument}
                isSubmitting={createDocument.isPending}
                childOptions={childOptions}
            />

            {selectedDocument ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">{selectedDocument.title || `Document #${selectedDocument.id}`}</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Category: {CATEGORY_LABELS[(selectedDocument.category || 'other').toLowerCase()] ?? 'Other'}
                                    {' • '}
                                    Uploaded: {formatDateLabel(selectedDocument.created_at)}
                                </p>
                                <p className="text-xs text-slate-500">Description: {selectedDocument.description?.trim() || 'N/A'}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedDocumentId(null)}
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                                aria-label="Close details"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <section>
                                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">Image Preview</h3>
                                {selectedDocument.images?.length ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {selectedDocument.images.map((image) => {
                                            const imageUrl = toAssetUrl(image.image);
                                            if (!imageUrl) return null;

                                            return (
                                                <a
                                                    key={image.id}
                                                    href={imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                                >
                                                    <div className="relative h-44 w-full">
                                                        <Image
                                                            src={imageUrl}
                                                            alt="Document preview"
                                                            fill
                                                            className="object-cover transition-transform group-hover:scale-[1.02]"
                                                            unoptimized
                                                        />
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                        No image preview available.
                                    </p>
                                )}
                            </section>

                            <section>
                                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">File Preview</h3>
                                {selectedDocument.files?.length ? (
                                    <div className="space-y-3">
                                        {selectedDocument.files.map((file) => {
                                            const fileUrl = toAssetUrl(file.file);
                                            if (!fileUrl) return null;
                                            const filename = getFileNameFromPath(file.file);
                                            const isPdf = filename.toLowerCase().endsWith('.pdf');

                                            return (
                                                <div key={file.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                        <p className="truncate text-sm font-semibold text-slate-700">{filename}</p>
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-bold text-sky-600 hover:text-sky-700"
                                                        >
                                                            Open
                                                        </a>
                                                    </div>

                                                    {isPdf ? (
                                                        <iframe
                                                            src={fileUrl}
                                                            title={filename}
                                                            className="h-72 w-full rounded-xl border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                                                            Inline preview not available for this file type.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                        No file preview available.
                                    </p>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            ) : null}

            {documentsQuery.isFetching ? (
                <div className="fixed bottom-6 right-6 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl">
                    <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Syncing documents...
                    </span>
                </div>
            ) : null}
        </div>
    );
}