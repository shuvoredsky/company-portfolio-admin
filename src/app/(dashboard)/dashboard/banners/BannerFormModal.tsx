'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { bannersApi } from '@/lib/api/banners';
import { ApiError, Banner } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

const bannerFormSchema = z.object({
  order: z.number().int('Order must be a whole number'),
  isActive: z.boolean(),
});

type BannerFormValues = z.infer<typeof bannerFormSchema>;

export interface BannerFormModalProps {
  open: boolean;
  onClose: () => void;
  banner: Banner | null;
}

const VALID_FIELD_NAMES = new Set<keyof BannerFormValues>([
  'order',
  'isActive',
]);

export function BannerFormModal({
  open,
  onClose,
  banner,
}: BannerFormModalProps) {
  const isEditing = Boolean(banner);
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      order: banner?.order ?? 0,
      isActive: banner?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (banner) {
        return bannersApi.updateBanner(banner._id, formData);
      }
      return bannersApi.createBanner(formData);
    },
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.banners.adminList,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.stats.admin,
        }),
      ]);
      toast.success(
        res.message ||
          (isEditing
            ? 'Banner updated successfully'
            : 'Banner created successfully'),
      );
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        for (const src of err.errorSources) {
          const field = String(src.path);
          if (field === 'image') {
            setImageError(src.message);
          } else if (VALID_FIELD_NAMES.has(field as keyof BannerFormValues)) {
            setError(field as keyof BannerFormValues, {
              type: 'server',
              message: src.message,
            });
          }
        }
        toast.error(err.message);
      } else {
        toast.error('Failed to save banner. Please try again.');
      }
    },
  });

  const onSubmit = (values: BannerFormValues) => {
    if (mutation.isPending) return;

    if (!isEditing && !imageFile) {
      setImageError('Banner image is required.');
      return;
    }

    setImageError(null);

    const formData = new FormData();
    formData.append('order', String(values.order));
    formData.append('isActive', String(values.isActive));

    if (imageFile) {
      formData.append('image', imageFile);
    }

    mutation.mutate(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Banner #${banner?.order ?? 0}` : 'Add Banner'}
      description={
        isEditing
          ? 'Replace the banner image or update its display order and visibility.'
          : 'Upload an image for the homepage banner carousel.'
      }
      size="md"
      disableClose={mutation.isPending}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="banner-form"
            isLoading={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save Changes'
                : 'Create Banner'}
          </Button>
        </>
      }
    >
      <form
        id="banner-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormField
          id="banner-image"
          label="Banner Image"
          required={!isEditing}
          hint={
            isEditing
              ? 'Leave unchanged to keep the current image, or pick a new image to replace it.'
              : 'Recommended landscape 16:9 image (JPEG, PNG, or WebP, max 5MB).'
          }
        >
          <ImageUpload
            id="banner-image"
            value={imageFile}
            existingImageUrl={banner?.image.url}
            onChange={(file) => {
              setImageFile(file);
              if (file) setImageError(null);
            }}
            error={imageError ?? undefined}
            disabled={mutation.isPending}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <FormField
            id="banner-order"
            label="Display Order"
            hint="Lower numbers appear first."
            error={errors.order?.message}
          >
            <Input
              id="banner-order"
              type="number"
              step={1}
              hasError={Boolean(errors.order)}
              disabled={mutation.isPending}
              {...register('order', { valueAsNumber: true })}
            />
          </FormField>

          <div className="pb-0.5">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="banner-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={mutation.isPending}
                  label={
                    field.value
                      ? 'Active (visible on site)'
                      : 'Inactive (hidden)'
                  }
                />
              )}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
