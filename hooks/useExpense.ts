import api from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ExpenseListItem,
  ExpenseMarkPaidPayload,
  ExpenseSummary,
  ExpenseUpsertPayload,
} from '@/types/expense.type';

const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => ['expenses', 'list'] as const,
  list: (month?: string, year?: string) => ['expenses', 'list', month ?? 'all', year ?? 'all'] as const,
  summaries: () => ['expenses', 'summary'] as const,
  summary: (month?: string, year?: string) => ['expenses', 'summary', month ?? 'current', year ?? 'current'] as const,
};

function normalizeExpenseList(value: unknown): ExpenseListItem[] {
  if (Array.isArray(value)) {
    return value as ExpenseListItem[];
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.expenses)) {
      return record.expenses as ExpenseListItem[];
    }

    if (record.data && typeof record.data === 'object') {
      const inner = record.data as Record<string, unknown>;
      if (Array.isArray(inner.expenses)) {
        return inner.expenses as ExpenseListItem[];
      }
    }
  }

  return [];
}

async function fetchExpenseList(): Promise<ExpenseListItem[]> {
  const res = await api.get('/api/v1/expense/list/');
  return normalizeExpenseList(res.data?.data ?? res.data);
}

async function fetchExpenseSummary(month?: string, year?: string): Promise<ExpenseSummary> {
  const res = await api.get<{ data: ExpenseSummary }>('/api/v1/expense/summary/', {
    params: {
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    },
  });

  return (
    res.data?.data ?? {
      total_expense: '0',
      pending_expense: '0',
      your_expense: '0',
      partner_total_expense: '0',
    }
  );
}

async function createExpense(payload: ExpenseUpsertPayload): Promise<ExpenseListItem> {
  const res = await api.post<{ data?: ExpenseListItem } | ExpenseListItem>('/api/v1/expense/create/', payload);
  const item = (res.data as { data?: ExpenseListItem }).data ?? res.data as ExpenseListItem;
  return item;
}

async function updateExpense(expenseId: number, payload: Partial<ExpenseUpsertPayload>): Promise<ExpenseListItem> {
  const res = await api.patch<{ data: ExpenseListItem }>(`/api/v1/expense/update/${expenseId}/`, payload);
  return res.data.data;
}

async function deleteExpense(expenseId: number): Promise<void> {
  await api.delete(`/api/v1/expense/delete/${expenseId}/`);
}

async function postExpenseAction(expenseId: number, action: string, payload?: object): Promise<ExpenseListItem | null> {
  const res = await api.post<{ data?: ExpenseListItem } | ExpenseListItem>(
    `/api/v1/expense/${expenseId}/${action}/`,
    payload,
  );
  const body = res.data as { data?: ExpenseListItem };
  const item = body?.data ?? res.data as ExpenseListItem;
  return typeof item?.id === 'number' ? item : null;
}

async function markExpensePaid(expenseId: number, payload: ExpenseMarkPaidPayload): Promise<ExpenseListItem | null> {
  const res = await api.put<{ data?: ExpenseListItem } | ExpenseListItem>(
    `/api/v1/expense/${expenseId}/paid/`,
    payload,
  );
  const body = res.data as { data?: ExpenseListItem };
  const item = body?.data ?? res.data as ExpenseListItem;
  return typeof item?.id === 'number' ? item : null;
}

function syncExpenseQueries(qc: ReturnType<typeof useQueryClient>, item?: ExpenseListItem | null) {
  if (item) {
    qc.setQueryData<ExpenseListItem[]>(expenseKeys.lists(), (current) => {
      if (!current) return [item];
      return [item, ...current.filter((expense) => expense.id !== item.id)];
    });
  }
  qc.invalidateQueries({ queryKey: expenseKeys.lists() });
  qc.invalidateQueries({ queryKey: expenseKeys.summaries() });
}

export function useExpenseListQuery() {
  return useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: fetchExpenseList,
    staleTime: 1000 * 60,
  });
}

export function useExpenseSummaryQuery(month?: string, year?: string) {
  return useQuery({
    queryKey: expenseKeys.summary(month, year),
    queryFn: () => fetchExpenseSummary(month, year),
    staleTime: 1000 * 60,
  });
}

export function useCreateExpenseMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: (item) => {
      syncExpenseQueries(qc, item);
    },
  });
}

export function useUpdateExpenseMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, payload }: { expenseId: number; payload: Partial<ExpenseUpsertPayload> }) =>
      updateExpense(expenseId, payload),
    onSuccess: (item) => {
      syncExpenseQueries(qc, item);
    },
  });
}

export function useDeleteExpenseMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      syncExpenseQueries(qc);
    },
  });
}

export function useMarkExpensePaidMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, payload }: { expenseId: number; payload: ExpenseMarkPaidPayload }) =>
      markExpensePaid(expenseId, payload),
    onSuccess: (item) => {
      syncExpenseQueries(qc, item);
    },
  });
}

function useExpenseActionMutation(action: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, payload }: { expenseId: number; payload?: object }) =>
      postExpenseAction(expenseId, action, payload),
    onSuccess: (item) => syncExpenseQueries(qc, item),
  });
}

export function useApproveExpenseMutation() {
  return useExpenseActionMutation('approve');
}

export function useRejectExpenseMutation() {
  return useExpenseActionMutation('reject');
}

export function useOfflineAgreementMutation() {
  return useExpenseActionMutation('offline-agreement');
}

export function useConfirmAgreementMutation() {
  return useExpenseActionMutation('confirm-agreement');
}

export { expenseKeys };