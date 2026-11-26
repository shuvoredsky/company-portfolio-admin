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
import { blogsApi } from '@/lib/api/blogs';
import { ApiError, Blog } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

const blogFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters'),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

export interface BlogFormModalProps {
  open: boolean;
  onClose: () => void;
  blog: Blog | null;
  onCreated?: () => void;
}

const VALID_FIELD_NAMES = new Set<keyof BlogFormValues>([
  'title',
  'description',
]);

export function BlogFormModal({
  open,
  onClose,
  blog,
  onCreated,
}: BlogFormModalProps) {
  const isEditing = Boolean(blog);
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: blog?.title ?? '',
      description: blog?.description ?? '',
    },
  });

  const descriptionValue = useWatch({ control, name: 'description' }) ?? '';

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (blog) {
        return blogsApi.updateBlog(blog._id, formData);
      }
      return blogsApi.createBlog(formData);
    },
    onSuccess: async (res) => {
      if (!isEditing) {
        onCreated?.();
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.blogs.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
      ]);
      toast.success(
        res.message ||
          (isEditing
            ? 'Blog post updated successfully'
            : 'Blog post created successfully'),
      );
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        for (const src of err.errorSources) {
          const field = String(src.path);
          if (field === 'image') {
            setImageError(src.message);
          } else if (VALID_FIELD_NAMES.has(field as keyof BlogFormValues)) {
            setError(field as keyof BlogFormValues, {
              type: 'server',
              message: src.message,
            });
          }
        }
        toast.error(err.message);
      } else {
        toast.error('Failed to save blog post. Please try again.');
      }
    },
  });

  const onSubmit = (values: BlogFormValues) => {
    if (mutation.isPending) return;

    if (!isEditing && !imageFile) {
      setImageError('Blog cover image is required.');
      return;
    }

    setImageError(null);

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('description', values.description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    mutation.mutate(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Blog Post' : 'Create Blog Post'}
      description={
        isEditing
          ? 'Update the blog post content or replace its cover image.'
          : 'Publish a new article to the company blog.'
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
            form="blog-form"
            isLoading={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing
                ? 'Saving...'
                : 'Publishing...'
              : isEditing
                ? 'Save Changes'
                : 'Publish Post'}
          </Button>
        </>
      }
    >
      <form
        id="blog-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormField
          id="blog-image"
          label="Cover Image"
          required={!isEditing}
          hint={
            isEditing
              ? 'Leave unchanged to keep the current cover image, or upload a new one to replace it.'
              : 'JPEG, PNG, or WebP up to 5MB.'
          }
        >
          <ImageUpload
            id="blog-image"
            value={imageFile}
            existingImageUrl={blog?.image.url}
            onChange={(file) => {
              setImageFile(file);
              if (file) setImageError(null);
            }}
            error={imageError ?? undefined}
            disabled={mutation.isPending}
          />
        </FormField>

        <FormField
          id="blog-title"
          label="Title"
          required
          error={errors.title?.message}
        >
          <Input
            id="blog-title"
            placeholder="Modern Irrigation Techniques for Higher Yields"
            hasError={Boolean(errors.title)}
            disabled={mutation.isPending}
            {...register('title')}
          />
        </FormField>

        <FormField
          id="blog-description"
          label="Description"
          required
          error={errors.description?.message}
          hint={`${descriptionValue.trim().length} characters (minimum 10)`}
        >
          <Textarea
            id="blog-description"
            rows={6}
            placeholder="Write the full blog post content..."
            hasError={Boolean(errors.description)}
            disabled={mutation.isPending}
            {...register('description')}
          />
        </FormField>
      </form>
    </Modal>
  );
}

