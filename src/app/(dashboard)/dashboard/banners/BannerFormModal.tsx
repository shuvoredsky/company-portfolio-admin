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
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  subtitle: z
    .string()
    .trim()
    .max(500, 'Subtitle must not exceed 500 characters')
    .optional(),
  ctaText: z
    .string()
    .trim()
    .max(100, 'CTA text must not exceed 100 characters')
    .optional(),
  ctaLink: z
    .string()
    .trim()
    .max(500, 'CTA link must not exceed 500 characters')
    .optional(),
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
  'title',
  'subtitle',
  'ctaText',
  'ctaLink',
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
      title: banner?.title ?? '',
      subtitle: banner?.subtitle ?? '',
      ctaText: banner?.ctaText ?? '',
      ctaLink: banner?.ctaLink ?? '',
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
    onSuccess: (res) => {
      toast.success(
        res.message ||
          (isEditing
            ? 'Banner updated successfully'
            : 'Banner created successfully'),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.banners.adminList,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stats.admin,
      });
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
    formData.append('title', values.title);
    if (values.subtitle !== undefined) {
      formData.append('subtitle', values.subtitle);
    }
    if (values.ctaText !== undefined) {
      formData.append('ctaText', values.ctaText);
    }
    if (values.ctaLink !== undefined) {
      formData.append('ctaLink', values.ctaLink);
    }
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
      title={isEditing ? 'Edit Banner' : 'Add Banner'}
      description={
        isEditing
          ? 'Update banner details or replace the banner image.'
          : 'Upload an image and configure your new homepage banner.'
      }
      size="lg"
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
              : 'Recommended landscape 16:9 image (max 5MB).'
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

        <FormField
          id="banner-title"
          label="Title"
          required
          error={errors.title?.message}
        >
          <Input
            id="banner-title"
            placeholder="Sustainable Agriculture for Tomorrow"
            hasError={Boolean(errors.title)}
            disabled={mutation.isPending}
            {...register('title')}
          />
        </FormField>

        <FormField
          id="banner-subtitle"
          label="Subtitle"
          error={errors.subtitle?.message}
        >
          <Input
            id="banner-subtitle"
            placeholder="Optional supporting headline"
            hasError={Boolean(errors.subtitle)}
            disabled={mutation.isPending}
            {...register('subtitle')}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="banner-cta-text"
            label="CTA Button Text"
            error={errors.ctaText?.message}
          >
            <Input
              id="banner-cta-text"
              placeholder="Explore Solutions"
              hasError={Boolean(errors.ctaText)}
              disabled={mutation.isPending}
              {...register('ctaText')}
            />
          </FormField>

          <FormField
            id="banner-cta-link"
            label="CTA Button Link"
            error={errors.ctaLink?.message}
          >
            <Input
              id="banner-cta-link"
              placeholder="/contact"
              hasError={Boolean(errors.ctaLink)}
              disabled={mutation.isPending}
              {...register('ctaLink')}
            />
          </FormField>
        </div>

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
                    field.value ? 'Active (visible on site)' : 'Inactive (hidden)'
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
