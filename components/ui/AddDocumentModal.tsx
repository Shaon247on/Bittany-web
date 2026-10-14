"use client";

import React, { useMemo, useState } from 'react';
import { FilePlus2, X } from 'lucide-react';
import { EventFormField } from '@/components/ui/EventFormField';

export type AddDocumentPayload = {
  title: string;
  category: "medical" | "financial" | "activity" | "education" | "legal" | "other";
  childId: number;
  description: string;
  expirationDate: string;
  uploadFiles: File[];
  uploadImages: File[];
};

type AddDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (payload: AddDocumentPayload) => Promise<void>;
  isSubmitting?: boolean;
  childOptions: Array<{ label: string; value: string }>;
};

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  onAddDocument,
  isSubmitting = false,
  childOptions,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AddDocumentPayload['category']>('legal');
  const [childId, setChildId] = useState('');
  const [description, setDescription] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadImages, setUploadImages] = useState<File[]>([]);

  React.useEffect(() => {
    if (!childId && childOptions.length > 0) {
      setChildId(childOptions[0].value);
    }
  }, [childOptions, childId]);

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      expirationDate.length > 0 &&
      Number(childId) > 0
    );
  }, [title, description, expirationDate, childId]);

  const hasChildren = childOptions.length > 0;

  const resetForm = () => {
    setTitle('');
    setCategory('legal');
    setChildId('');
    setDescription('');
    setExpirationDate(new Date().toISOString().split('T')[0]);
    setUploadFiles([]);
    setUploadImages([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    try {
      await onAddDocument({
        title: title.trim(),
        category,
        childId: Number(childId),
        description: description.trim(),
        expirationDate,
        uploadFiles,
        uploadImages,
      });

      resetForm();
      onClose();
    } catch {
      // Keep modal open so the user can retry after fixing input.
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-linear-to-br from-white via-[#F7FAFF] to-[#EEF7FF] shadow-2xl shadow-slate-900/20">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2 text-violet-600">
              <FilePlus2 size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Add New Document</h3>
              <p className="text-xs font-medium text-slate-500">Create a shared document record</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close add document modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <EventFormField
            id="doc-title"
            label="Document Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g., Parenting Plan Agreement"
          />

          <EventFormField
            id="doc-description"
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Short note about this document"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EventFormField
              id="doc-category"
              label="Category"
              value={category}
              onChange={(value) => setCategory(value as AddDocumentPayload['category'])}
              options={[
                { label: 'Legal', value: 'legal' },
                { label: 'Medical', value: 'medical' },
                { label: 'Education', value: 'education' },
                { label: 'Financial', value: 'financial' },
                { label: 'Activity', value: 'activity' },
                { label: 'Other', value: 'other' },
              ]}
            />
            <EventFormField
              id="doc-child"
              label="Child"
              value={childId}
              onChange={setChildId}
              options={hasChildren ? childOptions : [{ label: 'No children available', value: '' }]}
            />
          </div>

          <EventFormField
            id="doc-expiration"
            label="Expiration Date"
            type="date"
            value={expirationDate}
            onChange={setExpirationDate}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="doc-upload-files" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Upload Files
              </label>
              <input
                id="doc-upload-files"
                type="file"
                multiple
                onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-violet-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="text-[11px] text-slate-500">
                {uploadFiles.length > 0 ? `${uploadFiles.length} file(s) selected` : 'PDF, DOC, and other files'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="doc-upload-images" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Upload Images
              </label>
              <input
                id="doc-upload-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setUploadImages(Array.from(event.target.files ?? []))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-sky-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="text-[11px] text-slate-500">
                {uploadImages.length > 0 ? `${uploadImages.length} image(s) selected` : 'PNG, JPG, and other images'}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || !hasChildren}
              className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all enabled:hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isSubmitting ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
