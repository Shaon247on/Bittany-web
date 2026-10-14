import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiEnvelope,
  CreateDocumentInput,
  DocumentRecord,
  UpdateDocumentInput,
} from "@/types/document.type";

type DocumentListParams = {
  category?: string;
  documentId?: number;
};

const documentKeys = {
  all: ["documents"] as const,
  lists: () => ["documents", "list"] as const,
  list: (category: string) => ["documents", "list", category] as const,
  detail: (documentId: number) => ["documents", "detail", documentId] as const,
};

function toFormData(payload: Partial<CreateDocumentInput | UpdateDocumentInput>) {
  const formData = new FormData();

  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.category !== undefined) formData.append("category", payload.category);
  if (payload.child !== undefined) formData.append("child", String(payload.child));
  if (payload.expiration_date !== undefined) {
    formData.append("expiration_date", payload.expiration_date);
  }

  if (payload.upload_files?.length) {
    for (const file of payload.upload_files) {
      formData.append("upload_files", file);
    }
  }

  if (payload.upload_images?.length) {
    for (const image of payload.upload_images) {
      formData.append("upload_images", image);
    }
  }

  return formData;
}

async function fetchDocuments(params: DocumentListParams = {}): Promise<DocumentRecord[]> {
  const response = await api.get<ApiEnvelope<DocumentRecord[] | DocumentRecord>>(
    "/api/v1/document/documents/",
    {
      params: {
        ...(params.category && params.category !== "all" ? { category: params.category } : {}),
        ...(typeof params.documentId === "number" ? { document_id: params.documentId } : {}),
      },
    },
  );

  const payload = response.data?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") return [payload as DocumentRecord];
  return [];
}

async function createDocument(payload: CreateDocumentInput): Promise<DocumentRecord> {
  const response = await api.post<ApiEnvelope<DocumentRecord>>(
    "/api/v1/document/documents/",
    toFormData(payload),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data;
}

async function updateDocument(documentId: number, payload: UpdateDocumentInput): Promise<DocumentRecord> {
  const response = await api.put<ApiEnvelope<DocumentRecord>>(
    `/api/v1/document/documents/${documentId}/`,
    toFormData(payload),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data;
}

async function deleteDocument(documentId: number): Promise<void> {
  await api.delete(`/api/v1/document/documents/${documentId}/`);
}

export function useDocumentsQuery(category: string = "all") {
  return useQuery({
    queryKey: documentKeys.list(category),
    queryFn: () => fetchDocuments({ category }),
    staleTime: 1000 * 60,
  });
}

export function useCreateDocumentMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useUpdateDocumentMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, payload }: { documentId: number; payload: UpdateDocumentInput }) =>
      updateDocument(documentId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
      qc.invalidateQueries({ queryKey: documentKeys.detail(variables.documentId) });
    },
  });
}

export function useDeleteDocumentMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export { documentKeys };
