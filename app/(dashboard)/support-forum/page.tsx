"use client";

import React, { useMemo, useState } from 'react';
import { Heart, MessageCircle, MoreVertical, Plus, Search, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import {
	useCreateSupportCommentMutation,
	useCreateSupportPostMutation,
	useDeleteSupportPostMutation,
	useSupportCommentsQuery,
	useSupportPostQuery,
	useSupportPostsQuery,
	useToggleSupportReactionMutation,
	useUpdateSupportPostMutation,
} from '@/hooks/useSupport';
import type {
	SupportCategory,
	SupportPost,
	SupportPostUpsertPayload,
} from '@/types/support.type';

const CATEGORIES: Array<{ label: string; value: SupportCategory | 'all' }> = [
	{ label: 'All', value: 'all' },
	{ label: 'Scheduling', value: 'scheduling' },
	{ label: 'Parenting', value: 'parenting' },
	{ label: 'Communication', value: 'communication' },
	{ label: 'Success', value: 'success' },
	{ label: 'Other', value: 'other' },
];

const categoryClasses: Record<string, string> = {
	scheduling: 'bg-indigo-100 text-indigo-700',
	parenting: 'bg-sky-100 text-sky-700',
	communication: 'bg-violet-100 text-violet-700',
	success: 'bg-emerald-100 text-emerald-700',
	other: 'bg-amber-100 text-amber-700',
};

function initialsFromName(value: string) {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('') || 'PB';
}

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

function formatCategoryLabel(category: SupportCategory | 'all') {
	if (!category) return 'Other';
	if (category === 'all') return 'All';
	return category[0].toUpperCase() + category.slice(1);
}

type PostComposerProps = {
	title: string;
	submitLabel: string;
	initialValue?: SupportPostUpsertPayload;
	isPending?: boolean;
	onSubmit: (payload: SupportPostUpsertPayload) => void;
	onCancel: () => void;
};

function PostComposer({
	title,
	submitLabel,
	initialValue,
	isPending = false,
	onSubmit,
	onCancel,
}: PostComposerProps) {
	const [subject, setSubject] = useState(initialValue?.subject ?? '');
	const [message, setMessage] = useState(initialValue?.message ?? '');
	const [category, setCategory] = useState<Exclude<SupportCategory, null>>(initialValue?.category ?? 'scheduling');

	const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				if (!canSubmit || isPending) return;
				onSubmit({ subject: subject.trim(), message: message.trim(), category });
			}}
			className="space-y-4"
		>
			<div>
				<h3 className="text-lg font-black text-slate-800">{title}</h3>
			</div>
			<input
				value={subject}
				onChange={(event) => setSubject(event.target.value)}
				placeholder="Post subject"
				className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
			/>
			<textarea
				value={message}
				onChange={(event) => setMessage(event.target.value)}
				placeholder="Share your question or experience..."
				rows={5}
				className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
			/>
			<div className="flex flex-wrap gap-2">
				{CATEGORIES.filter((item) => item.value !== 'all').map((item) => (
					<button
						key={item.label}
						type="button"
						onClick={() => setCategory(item.value as Exclude<SupportCategory, null>)}
						className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${category === item.value
							? 'border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-100'
							: 'border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-500'
							}`}
					>
						{item.label}
					</button>
				))}
			</div>
			<div className="flex items-center justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!canSubmit || isPending}
					className="rounded-xl bg-linear-to-r from-violet-500 to-sky-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-violet-100 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isPending ? 'Saving…' : submitLabel}
				</button>
			</div>
		</form>
	);
}

type PostDetailModalProps = {
	post: SupportPost;
	isOpen: boolean;
	isEditing: boolean;
	comments: ReturnType<typeof useSupportCommentsQuery>['data'];
	isCommentsLoading: boolean;
	isActionPending: boolean;
	onClose: () => void;
	onStartEdit: () => void;
	onCancelEdit: () => void;
	onSaveEdit: (payload: SupportPostUpsertPayload) => void;
	onDelete: () => void;
	onToggleReaction: () => void;
	onCreateComment: (message: string) => void;
};

function PostDetailModal({
	post,
	isOpen,
	isEditing,
	comments,
	isCommentsLoading,
	isActionPending,
	onClose,
	onStartEdit,
	onCancelEdit,
	onSaveEdit,
	onDelete,
	onToggleReaction,
	onCreateComment,
}: PostDetailModalProps) {
	const [commentText, setCommentText] = useState('');

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/70 bg-linear-to-br from-white via-[#F8FAFF] to-[#EEF6FF] shadow-2xl shadow-slate-900/20">
				<div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur-sm">
					<div>
						<h3 className="text-lg font-black text-slate-800">{isEditing ? 'Edit Post' : 'Post Details'}</h3>
						<p className="text-xs font-medium text-slate-500">Support forum thread</p>
					</div>
					<button
						onClick={onClose}
						className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
					>
						<X size={18} />
					</button>
				</div>

				<div className="space-y-5 px-6 py-5">
					{isEditing ? (
						<PostComposer
							title="Update post"
							submitLabel="Update Post"
							initialValue={{ subject: post.subject, message: post.message, category: post.category ?? 'other' }}
							isPending={isActionPending}
							onSubmit={onSaveEdit}
							onCancel={onCancelEdit}
						/>
					) : (
						<>
							<div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0">
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-sky-500 text-sm font-black text-white">
												{initialsFromName(formatDisplayName(post.user))}
											</div>
											<div>
												<p className="text-sm font-black text-slate-800">{formatDisplayName(post.user)}</p>
												<p className="text-xs font-medium text-slate-400">{post.time_since_created}</p>
											</div>
											<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryClasses[post.category ?? 'other'] || 'bg-slate-100 text-slate-600'}`}>
												{formatCategoryLabel(post.category)}
											</span>
										</div>
										<h4 className="text-xl font-black text-slate-900">{post.subject}</h4>
										<p className="mt-2 text-sm leading-relaxed text-slate-600">{post.message}</p>
									</div>
									{post.my_post && (
										<div className="flex items-center gap-2">
											<button
												onClick={onStartEdit}
												className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
											>
												Edit
											</button>
											<button
												onClick={onDelete}
												className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
											>
												Delete
											</button>
										</div>
									)}
								</div>

								<div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-4">
									<button
										onClick={onToggleReaction}
										className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${post.is_reacted ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
									>
										<Heart size={16} className={post.is_reacted ? 'fill-current' : ''} /> {post.react_count}
									</button>
									<div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
										<MessageCircle size={16} /> {post.comment_count}
									</div>
								</div>
							</div>

							<div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
								<div className="mb-4 flex items-center justify-between">
									<h5 className="text-sm font-black uppercase tracking-widest text-slate-400">Comments</h5>
									<p className="text-xs font-semibold text-slate-500">{comments?.length ?? 0} loaded</p>
								</div>

								<div className="mb-4 flex gap-3">
									<input
										value={commentText}
										onChange={(event) => setCommentText(event.target.value)}
										placeholder="Add a supportive comment..."
										className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
									/>
									<button
										onClick={() => {
											if (!commentText.trim()) return;
											onCreateComment(commentText.trim());
											setCommentText('');
										}}
										className="rounded-2xl bg-linear-to-r from-violet-500 to-sky-500 px-4 py-3 text-white shadow-lg shadow-violet-100 transition-all hover:opacity-90"
									>
										<Send size={16} />
									</button>
								</div>

								{isCommentsLoading ? (
									<div className="py-10 text-center text-sm font-semibold text-slate-500">Loading comments…</div>
								) : comments && comments.length > 0 ? (
									<div className="space-y-3">
										{comments.map((comment) => (
											<div key={comment.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
												<div className="flex items-center justify-between gap-3">
													<p className="text-sm font-black text-slate-800">{formatDisplayName(comment.comment_user.name || comment.comment_user.username)}</p>
													<p className="text-xs font-medium text-slate-400">{comment.time_since_commented}</p>
												</div>
												<p className="mt-2 text-sm leading-relaxed text-slate-600">{comment.message}</p>
												{comment.replies.length > 0 && (
													<div className="mt-3 space-y-2 border-l-2 border-slate-200 pl-4">
														{comment.replies.map((reply) => (
															<div key={reply.id} className="rounded-xl bg-white px-3 py-2">
																<p className="text-xs font-black text-slate-700">{formatDisplayName(reply.comment_user.username)}</p>
																<p className="mt-1 text-sm text-slate-600">{reply.message}</p>
															</div>
														))}
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm font-medium text-slate-500">
										No comments yet.
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default function SupportForumPage() {
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState<SupportCategory | 'all'>('all');
	const [isComposerOpen, setIsComposerOpen] = useState(false);
	const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
	const [isEditingPost, setIsEditingPost] = useState(false);
	const [actionMenuPostId, setActionMenuPostId] = useState<number | null>(null);

	const postsQuery = useSupportPostsQuery();
	const selectedPostQuery = useSupportPostQuery(selectedPostId);
	const commentsQuery = useSupportCommentsQuery(selectedPostId);

	const createPost = useCreateSupportPostMutation();
	const updatePost = useUpdateSupportPostMutation();
	const deletePost = useDeleteSupportPostMutation();
	const createComment = useCreateSupportCommentMutation();
	const toggleReaction = useToggleSupportReactionMutation();

	const filteredPosts = useMemo(() => {
		const posts = Array.isArray(postsQuery.data) ? postsQuery.data : [];
		const q = search.toLowerCase().trim();

		return posts.filter((post) => {
			const displayName = formatDisplayName(post.user).toLowerCase();
			const matchSearch =
				!q ||
				displayName.includes(q) ||
				post.user.toLowerCase().includes(q) ||
				post.subject.toLowerCase().includes(q) ||
				post.message.toLowerCase().includes(q) ||
				(post.category ?? 'other').toLowerCase().includes(q);

			const matchCategory = category === 'all' || post.category === category;
			return matchSearch && matchCategory;
		});
	}, [postsQuery.data, search, category]);

	const selectedPost = selectedPostQuery.data ?? null;

	const handleCreatePost = (payload: SupportPostUpsertPayload) => {
		createPost.mutate(payload, {
			onSuccess: () => {
				toast.success('Support post created');
				setIsComposerOpen(false);
			},
			onError: () => toast.error('Could not create support post'),
		});
	};

	const handleUpdatePost = (payload: SupportPostUpsertPayload) => {
		if (!selectedPostId) return;
		updatePost.mutate(
			{ postId: selectedPostId, payload },
			{
				onSuccess: () => {
					toast.success('Support post updated');
					setIsEditingPost(false);
				},
				onError: () => toast.error('Could not update support post'),
			},
		);
	};

	const handleDeletePost = () => {
		if (!selectedPostId) return;
		deletePost.mutate(selectedPostId, {
			onSuccess: () => {
				toast.success('Support post deleted');
				setSelectedPostId(null);
				setIsEditingPost(false);
			},
			onError: () => toast.error('Could not delete support post'),
		});
	};

	const handleCreateComment = (message: string) => {
		if (!selectedPostId) return;
		createComment.mutate(
			{ postId: selectedPostId, payload: { message } },
			{
				onSuccess: () => toast.success('Comment added'),
				onError: () => toast.error('Could not add comment'),
			},
		);
	};

	const handleToggleReaction = (postId: number) => {
		toggleReaction.mutate(
			{ postId, reactionType: 'like' },
			{
				onError: () => toast.error('Could not update reaction'),
			},
		);
	};

	const handleOpenPostDetails = (postId: number) => {
		setSelectedPostId(postId);
		setIsEditingPost(false);
		setActionMenuPostId(null);
	};

	const handleStartPostEdit = (postId: number) => {
		setSelectedPostId(postId);
		setIsEditingPost(true);
		setActionMenuPostId(null);
	};

	const handleDeletePostFromCard = (postId: number) => {
		setSelectedPostId(postId);
		setActionMenuPostId(null);
		deletePost.mutate(postId, {
			onSuccess: () => {
				toast.success('Support post deleted');
				setSelectedPostId((current) => (current === postId ? null : current));
				setIsEditingPost(false);
			},
			onError: () => toast.error('Could not delete support post'),
		});
	};

	return (
		<div className="min-h-screen bg-[#EAF1FF]">
			<nav className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
					<div>
						<h1 className="text-xl font-black text-slate-800">Support Forum</h1>
						<p className="text-xs font-medium text-slate-400">Community help and co-parenting advice</p>
					</div>
					<button
						onClick={() => setIsComposerOpen(true)}
						className="flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-sky-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-violet-100 transition-all hover:opacity-90 active:scale-95"
					>
						<Plus size={18} /> New Post
					</button>
				</div>
			</nav>

			<main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6">
				<section className="rounded-4xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
					<div className="group relative">
						<Search
							size={18}
							className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
						/>
						<input
							type="text"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search posts by title, keyword, or member name..."
							className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
						/>
						{search && (
							<button
								onClick={() => setSearch('')}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
							>
								<X size={16} />
							</button>
						)}
					</div>

					<div className="mt-4">
						<p className="mb-2 ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</p>
						<div className="flex flex-wrap gap-2">
							{CATEGORIES.map((item) => (
								<button
									key={item.label}
									onClick={() => setCategory(item.value)}
									className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
										category === item.value
											? 'border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-100'
											: 'border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-500'
									}`}
								>
									{item.label}
								</button>
							))}
						</div>
					</div>
				</section>

				{isComposerOpen && (
					<section className="rounded-4xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
						<PostComposer
							title="Create a new support post"
							submitLabel="Publish Post"
							isPending={createPost.isPending}
							onSubmit={handleCreatePost}
							onCancel={() => setIsComposerOpen(false)}
						/>
					</section>
				)}

				<section>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-xs font-black uppercase tracking-widest text-slate-400">All Posts</h2>
						<p className="text-xs font-semibold text-slate-500">{filteredPosts.length} results</p>
					</div>

					{postsQuery.isLoading ? (
						<div className="rounded-4xl border border-slate-100 bg-white py-16 text-center shadow-sm">
							<p className="text-lg font-bold text-slate-800">Loading posts…</p>
						</div>
					) : filteredPosts.length > 0 ? (
						<div className="space-y-4">
							{filteredPosts.map((post) => (
								<article
									key={post.id}
									className="relative rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-sky-100 hover:shadow-md"
								>
									<div className="flex items-start justify-between gap-4">
										<button
											type="button"
											onClick={() => handleOpenPostDetails(post.id)}
											className="flex min-w-0 flex-1 items-start gap-3 text-left"
										>
											<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-sky-500 text-sm font-black text-white">
												{initialsFromName(formatDisplayName(post.user))}
											</div>
											<div className="min-w-0">
												<div className="mb-1 flex flex-wrap items-center gap-2">
													<p className="text-sm font-black text-slate-800">{formatDisplayName(post.user)}</p>
													<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryClasses[post.category ?? 'other'] || 'bg-slate-100 text-slate-600'}`}>
														{formatCategoryLabel(post.category)}
													</span>
													<span className="text-[11px] font-semibold text-slate-400">{post.time_since_created}</span>
												</div>
												<h3 className="text-base font-black text-slate-900 sm:text-lg">{post.subject}</h3>
												<p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.message}</p>
											</div>
										</button>
										{post.my_post && (
											<div className="relative">
												<button
													type="button"
													onClick={(event) => {
														event.stopPropagation();
														setActionMenuPostId((current) => (current === post.id ? null : post.id));
													}}
													className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
												>
													<MoreVertical size={18} />
												</button>
												{actionMenuPostId === post.id && (
													<div className="absolute right-0 top-10 z-10 min-w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
														<button
															type="button"
															onClick={() => handleStartPostEdit(post.id)}
															className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
														>
															Edit Post
														</button>
														<button
															type="button"
															onClick={() => handleDeletePostFromCard(post.id)}
															className="block w-full px-4 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
														>
															Delete Post
														</button>
													</div>
												)}
											</div>
										)}
									</div>

									<div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-4">
										<button
											onClick={() => handleToggleReaction(post.id)}
											className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${post.is_reacted ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
										>
											<Heart size={16} className={post.is_reacted ? 'fill-current' : ''} /> {post.react_count}
										</button>
										<button
											onClick={() => handleOpenPostDetails(post.id)}
											className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-sky-600"
										>
											<MessageCircle size={16} /> {post.comment_count}
										</button>
									</div>
								</article>
							))}
						</div>
					) : (
						<div className="rounded-4xl border border-slate-100 bg-white py-16 text-center shadow-sm">
							<p className="text-lg font-bold text-slate-800">No posts found</p>
							<p className="mt-1 text-sm text-slate-500">Try another search or category filter.</p>
						</div>
					)}
				</section>
			</main>

			{selectedPost && (
				<PostDetailModal
					post={selectedPost}
					isOpen={Boolean(selectedPost)}
					isEditing={isEditingPost}
					comments={commentsQuery.data}
					isCommentsLoading={commentsQuery.isLoading}
					isActionPending={updatePost.isPending || deletePost.isPending}
					onClose={() => {
						setSelectedPostId(null);
						setIsEditingPost(false);
					}}
					onStartEdit={() => setIsEditingPost(true)}
					onCancelEdit={() => setIsEditingPost(false)}
					onSaveEdit={handleUpdatePost}
					onDelete={handleDeletePost}
					onToggleReaction={() => handleToggleReaction(selectedPost.id)}
					onCreateComment={handleCreateComment}
				/>
			)}
		</div>
	);
}
