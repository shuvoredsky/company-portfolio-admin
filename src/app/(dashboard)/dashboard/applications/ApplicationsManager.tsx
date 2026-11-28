'use client';

import { useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { applicationsApi } from '@/lib/api/applications';
import {
  ApiError,
  type ApiResponse,
  type Application,
  type ApplicationListParams,
  type ApplicationStatus,
} from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { ApplicationFormModal } from './ApplicationFormModal';

const PAGE_LIMIT = 10;

type StatusFilter = 'all' | ApplicationStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const QUICK_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === 'approved') {
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Approved</span>
      </Badge>
    );
  }
  if (status === 'rejected') {
    return (
      <Badge variant="destructive">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Rejected</span>
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Pending</span>
    </Badge>
  );
}

function QuickStatusControl({
  value,
  disabled,
  onChange,
}: {
  value: ApplicationStatus;
  disabled?: boolean;
  onChange: (next: ApplicationStatus) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Quick status change"
      className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5"
    >
      {QUICK_STATUSES.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => {
              if (!active) onChange(opt.value);
            }}
            className={cn(
              'min-h-8 cursor-pointer rounded-md px-2 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              active
                ? opt.value === 'approved'
                  ? 'bg-success text-success-foreground shadow-xs'
                  : opt.value === 'rejected'
                    ? 'bg-destructive text-destructive-foreground shadow-xs'
                    : 'bg-warning text-warning-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ApplicationsManager() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);

  const queryParams: ApplicationListParams = {
    page,
    limit: PAGE_LIMIT,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  };

  const listQueryKey = queryKeys.applications.list(queryParams);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => applicationsApi.getApplications(queryParams),
    placeholderData: keepPreviousData,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = statusFilter !== 'all' || debouncedSearch.trim().length > 0;

  const handleCopySerial = async (serial: string) => {
    try {
      await navigator.clipboard.writeText(serial);
      toast.success(`Copied ${serial}`);
    } catch {
      toast.error('Unable to copy serial number');
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsApi.updateApplication(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previous = queryClient.getQueryData<ApiResponse<Application[]>>(listQueryKey);

      if (previous) {
        queryClient.setQueryData<ApiResponse<Application[]>>(listQueryKey, {
          ...previous,
          data: previous.data.map((app) =>
            app._id === id ? { ...app, status } : app,
          ),
        });
      }

      return { previous };
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listQueryKey, context.previous);
      }
      if (err instanceof ApiError && err.status === 404) {
        toast.error('This application no longer exists. Refreshing list.');
        void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to update status',
      );
    },
    onSuccess: () => {
      toast.success('Application status updated');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.deleteApplication(id),
    onSuccess: async () => {
      toast.success('Application deleted');
      setDeleting(null);
      if (items.length <= 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    },
    onError: async (err: unknown) => {
      setDeleting(null);
      if (err instanceof ApiError && err.status === 404) {
        toast.info('This application was already deleted. Refreshing list.');
        await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete application',
      );
    },
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (app: Application) => {
    setEditing(app);
    setFormOpen(true);
  };

  const handleFormSuccess = async (isCreate: boolean) => {
    if (isCreate) {
      setPage(1);
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Track applicant serial numbers and update review statuses."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Application</span>
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter by status"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/60 p-1"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={cn(
                  'min-h-10 cursor-pointer rounded-lg px-3 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <SearchInput
          value={searchText}
          onChange={(next) => {
            setSearchText(next);
            setPage(1);
          }}
          placeholder="Search by serial, name, email, or phone..."
          className="w-full sm:max-w-xs"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <ErrorState
          title="Unable to load applications"
          message={
            error instanceof ApiError
              ? error.message
              : 'Something went wrong while fetching applications.'
          }
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={hasFilters ? 'No matching applications' : 'No applications yet'}
          description={
            hasFilters
              ? 'Try adjusting your search term or status filter.'
              : 'Create your first application record to generate a tracking serial number.'
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchText('');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Application</span>
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3.5">Serial Number</th>
                    <th className="px-4 py-3.5">Applicant</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Quick Status</th>
                    <th className="px-4 py-3.5">Created</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((app) => (
                    <tr
                      key={app._id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {app.serialNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopySerial(app.serialNumber)}
                            aria-label={`Copy serial number ${app.serialNumber}`}
                            title="Copy serial number"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>

                      <td className="max-w-xs px-4 py-3.5 align-middle">
                        <p className="break-words font-medium text-foreground">
                          {app.name}
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          {app.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.phone}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <StatusBadge status={app.status} />
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <QuickStatusControl
                          value={app.status}
                          disabled={statusMutation.isPending}
                          onChange={(nextStatus) =>
                            statusMutation.mutate({
                              id: app._id,
                              status: nextStatus,
                            })
                          }
                        />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-muted-foreground">
                        {formatDate(app.createdAt)}
                      </td>

                      <td className="px-4 py-3.5 text-right align-middle">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(app)}
                            aria-label={`Edit ${app.name}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleting(app)}
                            aria-label={`Delete ${app.name}`}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile / Tablet Cards */}
          <div className="space-y-3 lg:hidden">
            {items.map((app) => (
              <Card key={app._id}>
                <CardContent className="space-y-3.5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-mono text-xs font-semibold text-foreground">
                        {app.serialNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopySerial(app.serialNumber)}
                        aria-label={`Copy serial number ${app.serialNumber}`}
                        className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="break-words text-base font-semibold text-foreground">
                      {app.name}
                    </p>
                    <p className="break-all text-xs text-muted-foreground">
                      {app.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.phone} &middot; {formatDate(app.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <QuickStatusControl
                      value={app.status}
                      disabled={statusMutation.isPending}
                      onChange={(nextStatus) =>
                        statusMutation.mutate({
                          id: app._id,
                          status: nextStatus,
                        })
                      }
                    />

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(app)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleting(app)}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {meta && meta.totalPages > 1 ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ApplicationFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting._id);
        }}
        title="Delete application?"
        description={
          deleting
            ? `This will permanently delete application ${deleting.serialNumber} (${deleting.name}). Applicants checking this serial number will no longer find it.`
            : ''
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
