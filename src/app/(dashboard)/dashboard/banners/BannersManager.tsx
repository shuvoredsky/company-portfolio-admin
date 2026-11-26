'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { siteConfig } from '@/config/site';
import { bannersApi } from '@/lib/api/banners';
import { ApiError, ApiResponse, Banner } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { BannerFormModal } from './BannerFormModal';

export function BannersManager() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.banners.adminList,
    queryFn: () => bannersApi.getAdminBanners(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const banners = data?.data ?? [];

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      const formData = new FormData();
      formData.append('isActive', String(isActive));
      return bannersApi.updateBanner(id, formData);
    },
    onMutate: async ({ id, isActive }) => {
      setTogglingId(id);
      await queryClient.cancelQueries({ queryKey: queryKeys.banners.adminList });
      const previous = queryClient.getQueryData<ApiResponse<Banner[]>>(
        queryKeys.banners.adminList,
      );

      if (previous) {
        queryClient.setQueryData<ApiResponse<Banner[]>>(
          queryKeys.banners.adminList,
          {
            ...previous,
            data: previous.data.map((item) =>
              item._id === id ? { ...item, isActive } : item,
            ),
          },
        );
      }

      return { previous };
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Banner status updated');
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.banners.adminList, context.previous);
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update banner status',
      );
    },
    onSettled: async () => {
      setTogglingId(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.banners.adminList,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.deleteBanner(id),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.banners.adminList,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.stats.admin,
        }),
      ]);
      toast.success(res.message || 'Banner deleted successfully');
      setDeletingBanner(null);
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.status === 404) {
        toast.error('This banner was already deleted. Refreshing list...');
        setDeletingBanner(null);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.banners.adminList,
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.stats.admin,
          }),
        ]);
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete banner',
      );
    },
  });

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormOpen(true);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Banners"
        description="Manage homepage banner images, display ordering, and visibility."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Banner
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          title="Unable to load banners"
          message={
            error instanceof ApiError
              ? error.message
              : 'Could not fetch banners from the server.'
          }
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <CardContent className="flex items-center justify-between p-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No banners yet"
          description="Upload your first homepage banner image to display on the public website."
          action={
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Banner
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => {
            const label = `Banner #${banner.order}`;
            return (
              <Card
                key={banner._id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/9] w-full bg-muted">
                  <Image
                    src={banner.image.url}
                    alt={`${siteConfig.brandName} — ${label}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant={banner.isActive ? 'success' : 'secondary'}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-card/90 backdrop-blur-xs"
                    >
                      {label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <Switch
                    checked={banner.isActive}
                    disabled={togglingId === banner._id}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({
                        id: banner._id,
                        isActive: checked,
                      })
                    }
                    label={banner.isActive ? 'Active' : 'Hidden'}
                  />

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(banner)}
                      aria-label={`Edit ${label}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingBanner(banner)}
                      aria-label={`Delete ${label}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BannerFormModal
        key={formOpen ? (editingBanner?._id ?? 'create') : 'closed'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        banner={editingBanner}
      />

      <ConfirmDialog
        open={Boolean(deletingBanner)}
        onClose={() => setDeletingBanner(null)}
        onConfirm={() => {
          if (deletingBanner) {
            deleteMutation.mutate(deletingBanner._id);
          }
        }}
        title="Delete banner?"
        description={`Are you sure you want to delete Banner #${deletingBanner?.order ?? 0}? This action cannot be undone and its image will also be permanently removed from Cloudinary.`}
        confirmLabel="Delete Banner"
        isLoading={deleteMutation.isPending}
      />
    </section>
  );
}
