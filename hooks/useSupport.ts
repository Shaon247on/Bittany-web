import api from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SupportComment,
  SupportCommentPayload,
  SupportPost,
  SupportPostUpsertPayload,
  SupportReactionType,
} from '@/types/support.type';

const supportKeys = {
  all: ['support'] as const,
  posts: () => ['support', 'posts'] as const,
  post: (postId: number) => ['support', 'post', postId] as const,
  comments: (postId: number) => ['support', 'comments', postId] as const,
};

function normalizeArrayResponse<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.results)) return record.results as T[];
    if (Array.isArray(record.posts)) return record.posts as T[];
    if (Array.isArray(record.comments)) return record.comments as T[];
  }
  return [];
}

async function fetchPosts(): Promise<SupportPost[]> {
  const res = await api.get('/api/v1/support/posts/');
  return normalizeArrayResponse<SupportPost>(res.data?.data ?? res.data);
}

async function fetchPost(postId: number): Promise<SupportPost> {
  const res = await api.get<{ data: SupportPost }>(`/api/v1/support/post/${postId}/`);
  return res.data.data;
}

async function createPost(payload: SupportPostUpsertPayload): Promise<SupportPost> {
  const res = await api.post<{ data: SupportPost }>('/api/v1/support/post/create/', payload);
  return res.data.data;
}

async function updatePost(postId: number, payload: Partial<SupportPostUpsertPayload>): Promise<SupportPost> {
  const res = await api.put<{ data: SupportPost }>(`/api/v1/support/post/${postId}/update/`, payload);
  return res.data.data;
}

async function deletePost(postId: number): Promise<void> {
  await api.delete(`/api/v1/support/post/${postId}/delete/`);
}

async function fetchComments(postId: number): Promise<SupportComment[]> {
  const res = await api.get(`/api/v1/support/post/${postId}/comments/`);
  return normalizeArrayResponse<SupportComment>(res.data?.data ?? res.data);
}

async function createComment(postId: number, payload: SupportCommentPayload): Promise<SupportComment> {
  const res = await api.post<{ data: SupportComment }>(`/api/v1/support/post/${postId}/comment/create/`, payload);
  return res.data.data;
}

async function updateComment(postId: number, commentId: number, payload: SupportCommentPayload): Promise<SupportComment> {
  const res = await api.put<{ data: SupportComment }>(`/api/v1/support/post/${postId}/comment/${commentId}/update/`, payload);
  return res.data.data;
}

async function deleteComment(postId: number, commentId: number): Promise<void> {
  await api.delete(`/api/v1/support/post/${postId}/comment/${commentId}/delete/`);
}

async function toggleReaction(postId: number, reactionType: SupportReactionType): Promise<void> {
  await api.post(`/api/v1/support/posts/${postId}/reaction/toggle/`, { reaction_type: reactionType });
}

export function useSupportPostsQuery() {
  return useQuery({
    queryKey: supportKeys.posts(),
    queryFn: fetchPosts,
    staleTime: 1000 * 60,
  });
}

export function useSupportPostQuery(postId: number | null) {
  return useQuery({
    queryKey: supportKeys.post(postId ?? 0),
    queryFn: () => fetchPost(postId as number),
    enabled: Boolean(postId),
    staleTime: 1000 * 30,
  });
}

export function useSupportCommentsQuery(postId: number | null) {
  return useQuery({
    queryKey: supportKeys.comments(postId ?? 0),
    queryFn: () => fetchComments(postId as number),
    enabled: Boolean(postId),
    staleTime: 1000 * 30,
  });
}

export function useCreateSupportPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.posts() });
    },
  });
}

export function useUpdateSupportPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, payload }: { postId: number; payload: Partial<SupportPostUpsertPayload> }) =>
      updatePost(postId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: supportKeys.posts() });
      qc.invalidateQueries({ queryKey: supportKeys.post(variables.postId) });
    },
  });
}

export function useDeleteSupportPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.posts() });
    },
  });
}

export function useCreateSupportCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, payload }: { postId: number; payload: SupportCommentPayload }) =>
      createComment(postId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: supportKeys.comments(variables.postId) });
      qc.invalidateQueries({ queryKey: supportKeys.posts() });
      qc.invalidateQueries({ queryKey: supportKeys.post(variables.postId) });
    },
  });
}

export function useUpdateSupportCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId, payload }: { postId: number; commentId: number; payload: SupportCommentPayload }) =>
      updateComment(postId, commentId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: supportKeys.comments(variables.postId) });
    },
  });
}

export function useDeleteSupportCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: number; commentId: number }) =>
      deleteComment(postId, commentId),
    onSettled: (_, __, variables) => {
      qc.invalidateQueries({ queryKey: supportKeys.comments(variables.postId) });
      qc.invalidateQueries({ queryKey: supportKeys.posts() });
      qc.invalidateQueries({ queryKey: supportKeys.post(variables.postId) });
    },
  });
}

export function useToggleSupportReactionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reactionType }: { postId: number; reactionType: SupportReactionType }) =>
      toggleReaction(postId, reactionType),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: supportKeys.posts() });
      qc.invalidateQueries({ queryKey: supportKeys.post(variables.postId) });
    },
  });
}
