export type DocumentCardItem = {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  owner: string;
  childName: string;
  uploadedAt: string;
  fileTypesLabel: string;
  cardBg: string;
  accentColor: string;
  rawId?: number;
};

export type DocumentCategory =
  | "medical"
  | "financial"
  | "activity"
  | "education"
  | "legal"
  | "other";

export type DocumentFileAsset = {
  id: number;
  file: string;
  created_at: string;
};

export type DocumentImageAsset = {
  id: number;
  image: string;
  created_at: string;
};

export type DocumentRecord = {
  id: number;
  user: number;
  bridge: number;
  child: number;
  title?: string | null;
  description?: string | null;
  category: string;
  expiration_date?: string | null;
  created_at: string;
  files: DocumentFileAsset[];
  images: DocumentImageAsset[];
  file_type?: string | null;
  file_size?: string | null;
};

export type ApiResponseMeta = {
  timestamp?: string;
  request_id?: string;
};

export type ApiResponseError = {
  code?: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  error?: ApiResponseError;
  meta?: ApiResponseMeta;
};

export type CreateDocumentInput = {
  title: string;
  category: DocumentCategory;
  child: number;
  description: string;
  expiration_date: string;
  upload_files?: File[];
  upload_images?: File[];
};

export type UpdateDocumentInput = Partial<CreateDocumentInput>;