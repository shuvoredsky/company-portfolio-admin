'use client';

import { useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Briefcase, Calendar, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { recruitmentsApi } from '@/lib/api/recruitments';
import { ApiError, ApiResponse, Recruitment } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { RecruitmentFormModal } from './RecruitmentFormModal';

const PAGE_LIMIT = 10;

function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function RecruitmentsManager() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Recruitment | null>(null);
  const [deletingItem, setDeletingItem] = useState<Recruitment | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = { page, limit: PAGE_LIMIT };
  const listKey = queryKeys.recruitments.adminList(queryParams);

  const { data, isPending, isPlaceholderData, isError, error, refetch } =
    useQuery({
      queryKey: listKey,
      queryFn: () => recruitmentsApi.getAdminRecruitments(queryParams),
      placeholderData: keepPreviousData,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    });

  const recruitments = data?.data ?? [];
  const meta = data?.meta;

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      recruitmentsApi.updateRecruitment(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      setTogglingId(id);
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ApiResponse<Recruitment[]>>(
        listKey,
      );

      if (previous) {
        queryClient.setQueryData<ApiResponse<Recruitment[]>>(listKey, {
          ...previous,
          data: previous.data.map((item) =>
            item._id === id ? { ...item, isActive } : item,
          ),
        });
      }

      return { previous };
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Recruitment status updated');
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update recruitment status',
      );
    },
    onSettled: () => {
      setTogglingId(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recruitments.all,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recruitmentsApi.deleteRecruitment(id),
    onSuccess: async (res) => {
      const wasLastOnPage = recruitments.length === 1 && page > 1;
      if (wasLastOnPage) {
        setPage((prev) => Math.max(1, prev - 1));
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.recruitments.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
      ]);
      toast.success(res.message || 'Recruitment post deleted successfully');
      setDeletingItem(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to delete recruitment post',
      );
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: Recruitment) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Recruitment"
        description="Manage open job positions and control public visibility."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Opening
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          title="Unable to load recruitment posts"
          message={
            error instanceof ApiError
              ? error.message
              : 'Could not fetch recruitment posts from the server.'
          }
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recruitments.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No recruitment posts yet"
          description="Create your first job opening to display on the public recruitment page."
          action={
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Opening
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {recruitments.map((item) => (
              <Card
                key={item._id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-card-foreground">
                          {item.title}
                        </h2>
                        <Badge
                          variant={item.isActive ? 'success' : 'secondary'}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5">
                    <Switch
                      checked={item.isActive}
                      disabled={togglingId === item._id}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({
                          id: item._id,
                          isActive: checked,
                        })
                      }
                      label={item.isActive ? 'Active' : 'Hidden'}
                    />

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingItem(item)}
                        aria-label={`Delete ${item.title}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              onPageChange={setPage}
              disabled={isPlaceholderData}
            />
          )}
        </>
      )}

      <RecruitmentFormModal
        key={formOpen ? (editingItem?._id ?? 'create') : 'closed'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        recruitment={editingItem}
        onCreated={() => setPage(1)}
      />

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) {
            deleteMutation.mutate(deletingItem._id);
          }
        }}
        title="Delete recruitment post?"
        description={`Are you sure you want to delete "${deletingItem?.title ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete Post"
        isLoading={deleteMutation.isPending}
      />
    </section>
  );
}

