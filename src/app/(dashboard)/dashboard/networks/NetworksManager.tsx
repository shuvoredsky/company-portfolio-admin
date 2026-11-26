'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Calendar,
  ExternalLink,
  Handshake,
  Pencil,
  Plus,
  SearchX,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { networksApi } from '@/lib/api/networks';
import { ApiError, Network } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { NetworkFormModal } from './NetworkFormModal';

const PAGE_LIMIT = 9;

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

export function NetworksManager() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [deletingNetwork, setDeletingNetwork] = useState<Network | null>(null);

  const queryParams = {
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch.trim() || undefined,
  };

  const { data, isPending, isPlaceholderData, isError, error, refetch } =
    useQuery({
      queryKey: queryKeys.networks.list(queryParams),
      queryFn: () => networksApi.getNetworks(queryParams),
      placeholderData: keepPreviousData,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    });

  const networks = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => networksApi.deleteNetwork(id),
    onSuccess: async (res) => {
      const wasLastOnPage = networks.length === 1 && page > 1;
      if (wasLastOnPage) {
        setPage((prev) => Math.max(1, prev - 1));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.networks.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
      ]);
      toast.success(res.message || 'Network item deleted successfully');
      setDeletingNetwork(null);
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.status === 404) {
        toast.error('This network item was already deleted. Refreshing list...');
        setDeletingNetwork(null);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.networks.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
        ]);
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete network item',
      );
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingNetwork(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: Network) => {
    setEditingNetwork(item);
    setFormOpen(true);
  };

  const isSearching = Boolean(debouncedSearch.trim());

  return (
    <section className="space-y-6">
      <PageHeader
        title="Networks"
        description="Manage partner organizations and agricultural networks."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Network
          </Button>
        }
      />

      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search networks by title..."
          ariaLabel="Search networks by title"
        />
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load networks"
          message={
            error instanceof ApiError
              ? error.message
              : 'Could not fetch networks from the server.'
          }
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : networks.length === 0 ? (
        isSearching ? (
          <EmptyState
            icon={SearchX}
            title="No matching networks"
            description={`No networks matched "${debouncedSearch.trim()}". Try a different keyword.`}
            action={
              <Button variant="outline" onClick={() => handleSearchChange('')}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Handshake}
            title="No networks yet"
            description="Add your first partner organization or agricultural network."
            action={
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Network
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {networks.map((item) => (
              <Card
                key={item._id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/9] w-full bg-muted">
                  <Image
                    src={item.image.url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold text-card-foreground">
                        {item.title}
                      </h2>
                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visit ${item.title} website`}
                          title={item.externalUrl}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <p className="line-clamp-3 break-words text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(item.createdAt)}
                    </span>

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
                        onClick={() => setDeletingNetwork(item)}
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

      <NetworkFormModal
        key={formOpen ? (editingNetwork?._id ?? 'create') : 'closed'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        network={editingNetwork}
        onCreated={() => setPage(1)}
      />

      <ConfirmDialog
        open={Boolean(deletingNetwork)}
        onClose={() => setDeletingNetwork(null)}
        onConfirm={() => {
          if (deletingNetwork) {
            deleteMutation.mutate(deletingNetwork._id);
          }
        }}
        title="Delete network item?"
        description={`Are you sure you want to delete "${deletingNetwork?.title ?? ''}"? This action cannot be undone and its image will also be permanently removed from Cloudinary.`}
        confirmLabel="Delete Network"
        isLoading={deleteMutation.isPending}
      />
    </section>
  );
}

