'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { recruitmentsApi } from '@/lib/api/recruitments';
import { ApiError, Recruitment } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

const recruitmentFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(300, 'Title must not exceed 300 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters'),
  isActive: z.boolean(),
});

type RecruitmentFormValues = z.infer<typeof recruitmentFormSchema>;

export interface RecruitmentFormModalProps {
  open: boolean;
  onClose: () => void;
  recruitment: Recruitment | null;
}

const VALID_FIELD_NAMES = new Set<keyof RecruitmentFormValues>([
  'title',
  'description',
  'isActive',
]);

export function RecruitmentFormModal({
  open,
  onClose,
  recruitment,
}: RecruitmentFormModalProps) {
  const isEditing = Boolean(recruitment);
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RecruitmentFormValues>({
    resolver: zodResolver(recruitmentFormSchema),
    defaultValues: {
      title: recruitment?.title ?? '',
      description: recruitment?.description ?? '',
      isActive: recruitment?.isActive ?? true,
    },
  });

  const descriptionValue = useWatch({ control, name: 'description' }) ?? '';

  const mutation = useMutation({
    mutationFn: async (values: RecruitmentFormValues) => {
      if (recruitment) {
        return recruitmentsApi.updateRecruitment(recruitment._id, values);
      }
      return recruitmentsApi.createRecruitment(values);
    },
    onSuccess: (res) => {
      toast.success(
        res.message ||
          (isEditing
            ? 'Recruitment post updated successfully'
            : 'Recruitment post created successfully'),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recruitments.all,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin });
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        for (const src of err.errorSources) {
          const field = String(src.path);
          if (VALID_FIELD_NAMES.has(field as keyof RecruitmentFormValues)) {
            setError(field as keyof RecruitmentFormValues, {
              type: 'server',
              message: src.message,
            });
          }
        }
        toast.error(err.message);
      } else {
        toast.error('Failed to save recruitment post. Please try again.');
      }
    },
  });

  const onSubmit = (values: RecruitmentFormValues) => {
    if (mutation.isPending) return;
    mutation.mutate(values);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Recruitment Post' : 'Add Recruitment Post'}
      description={
        isEditing
          ? 'Update job opening details or visibility.'
          : 'Create a new career opportunity for the public recruitment page.'
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
            form="recruitment-form"
            isLoading={mutation.isPending}
          >
            {mutation.isPending
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save Changes'
                : 'Create Opening'}
          </Button>
        </>
      }
    >
      <form
        id="recruitment-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormField
          id="recruitment-title"
          label="Position Title"
          required
          error={errors.title?.message}
        >
          <Input
            id="recruitment-title"
            placeholder="Senior Agronomist"
            hasError={Boolean(errors.title)}
            disabled={mutation.isPending}
            {...register('title')}
          />
        </FormField>

        <FormField
          id="recruitment-description"
          label="Job Description"
          required
          error={errors.description?.message}
          hint={`${descriptionValue.trim().length} characters (minimum 10)`}
        >
          <Textarea
            id="recruitment-description"
            rows={6}
            placeholder="Describe responsibilities, qualifications, location, and how to apply..."
            hasError={Boolean(errors.description)}
            disabled={mutation.isPending}
            {...register('description')}
          />
        </FormField>

        <div className="pt-1">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch
                id="recruitment-active"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={mutation.isPending}
                label={
                  field.value
                    ? 'Active (visible on careers page)'
                    : 'Inactive (hidden from public)'
                }
              />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
