'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { networksApi } from '@/lib/api/networks';
import { ApiError, Network } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

const isValidOptionalHttpUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const networkFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  externalUrl: z
    .string()
    .trim()
    .max(500, 'Website URL must not exceed 500 characters')
    .refine(
      isValidOptionalHttpUrl,
      'Please enter a valid http:// or https:// URL',
    ),
});

type NetworkFormValues = z.infer<typeof networkFormSchema>;

export interface NetworkFormModalProps {
  open: boolean;
  onClose: () => void;
  network: Network | null;
  onCreated?: () => void;
}

const VALID_FIELD_NAMES = new Set<keyof NetworkFormValues>([
  'title',
  'description',
  'externalUrl',
]);

export function NetworkFormModal({
  open,
  onClose,
  network,
  onCreated,
}: NetworkFormModalProps) {
  const isEditing = Boolean(network);
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NetworkFormValues>({
    resolver: zodResolver(networkFormSchema),
    defaultValues: {
      title: network?.title ?? '',
      description: network?.description ?? '',
      externalUrl: network?.externalUrl ?? '',
    },
  });

  const descriptionValue = useWatch({ control, name: 'description' }) ?? '';

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (network) {
        return networksApi.updateNetwork(network._id, formData);
      }
      return networksApi.createNetwork(formData);
    },
    onSuccess: async (res) => {
      if (!isEditing) {
        onCreated?.();
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.networks.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
      ]);
      toast.success(
        res.message ||
          (isEditing
            ? 'Network item updated successfully'
            : 'Network item created successfully'),
      );
      onClose();
    },
    onError: async (err) => {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          toast.error('This network item no longer exists. Refreshing list...');
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.networks.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
          ]);
          onClose();
          return;
        }
        for (const src of err.errorSources) {
          const field = String(src.path);
          if (field === 'image') {
            setImageError(src.message);
          } else if (VALID_FIELD_NAMES.has(field as keyof NetworkFormValues)) {
            setError(field as keyof NetworkFormValues, {
              type: 'server',
              message: src.message,
            });
          }
        }
        toast.error(err.message);
      } else {
        toast.error('Failed to save network item. Please try again.');
      }
    },
  });

  const onSubmit = (values: NetworkFormValues) => {
    if (mutation.isPending) return;

    if (!isEditing && !imageFile) {
      setImageError('Network image is required.');
      return;
    }

    setImageError(null);

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('externalUrl', values.externalUrl.trim());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    mutation.mutate(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Network Partner' : 'Add Network Partner'}
      description={
        isEditing
          ? 'Update partner details, website link, or replace the image.'
          : 'Add a partner organization or agricultural network.'
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
            form="network-form"
            isLoading={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save Changes'
                : 'Add Network'}
          </Button>
        </>
      }
    >
      <form
        id="network-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormField
          id="network-image"
          label="Partner Image"
          required={!isEditing}
          hint={
            isEditing
              ? 'Leave unchanged to keep the current image, or upload a new one to replace it.'
              : 'JPEG, PNG, or WebP up to 5MB.'
          }
        >
          <ImageUpload
            id="network-image"
            value={imageFile}
            existingImageUrl={network?.image.url}
            onChange={(file) => {
              setImageFile(file);
              if (file) setImageError(null);
            }}
            error={imageError ?? undefined}
            disabled={mutation.isPending}
          />
        </FormField>

        <FormField
          id="network-title"
          label="Title"
          required
          error={errors.title?.message}
        >
          <Input
            id="network-title"
            placeholder="The Confagricoltura Network"
            hasError={Boolean(errors.title)}
            disabled={mutation.isPending}
            {...register('title')}
          />
        </FormField>

        <FormField
          id="network-external-url"
          label="Website URL (Optional)"
          error={errors.externalUrl?.message}
          hint="Optional external link (must start with http:// or https://)."
        >
          <Input
            id="network-external-url"
            type="url"
            placeholder="https://example.com"
            hasError={Boolean(errors.externalUrl)}
            disabled={mutation.isPending}
            {...register('externalUrl')}
          />
        </FormField>

        <FormField
          id="network-description"
          label="Description"
          required
          error={errors.description?.message}
          hint={`${descriptionValue.trim().length} / 5000 characters (minimum 10)`}
        >
          <Textarea
            id="network-description"
            rows={6}
            placeholder="Describe this network or partner organization..."
            hasError={Boolean(errors.description)}
            disabled={mutation.isPending}
            {...register('description')}
          />
        </FormField>
      </form>
    </Modal>
  );
}

