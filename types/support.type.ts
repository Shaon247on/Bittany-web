export type SupportCategory =
  | 'scheduling'
  | 'parenting'
  | 'communication'
  | 'success'
  | 'other'
  | null;

export type SupportReactionType = 'like' | 'love' | 'insightful' | 'funny';

export interface SupportPost {
  id: number;
  user: string;
  subject: string;
  message: string;
  category: SupportCategory;
  react_count: number;
  comment_count: number;
  is_reacted: boolean;
  is_commented: boolean;
  my_post: boolean;
  created_at: string;
  updated_at: string;
  time_since_created: string;
}

export interface SupportCommentUser {
  id: number;
  username: string;
  image: string | null;
  name: string | null;
}

export interface SupportReply {
  id: number;
  message: string;
  reply_to: number | null;
  comment_user: {
    id: number;
    username: string;
  };
  created_at: string;
  time_since_commented: string;
}

export interface SupportComment {
  id: number;
  message: string;
  comment_user: SupportCommentUser;
  created_at: string;
  time_since_commented: string;
  replies: SupportReply[];
  reply_to: number | null;
}

export interface SupportPostUpsertPayload {
  subject: string;
  message: string;
  category: Exclude<SupportCategory, null>;
}

export interface SupportCommentPayload {
  message: string;
  reply_to?: number | null;
}
