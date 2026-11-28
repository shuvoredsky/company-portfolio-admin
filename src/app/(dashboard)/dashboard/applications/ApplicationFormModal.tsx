'use client';

import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { applicationsApi } from '@/lib/api/applications';
import {
  ApiError,
  type Application,
  type ApplicationStatus,
  type CreateApplicationPayload,
  type UpdateApplicationPayload,
} from '@/lib/api/types';
import { cn } from '@/lib/utils';

const SERIAL_REGEX = /^[A-Z0-9][A-Z0-9-]{4,29}$/;
const PHONE_REGEX = /^[0-9+\-\s()]+$/;
const PASSPORT_REGEX = /^[A-Za-z0-9\s-]+$/;
const MAX_NOTE_LENGTH = 1000;

const FORM_FIELDS = [
  'serialNumber',
  'name',
  'email',
  'phone',
  'passportNumber',
  'visaStatus',
  'note',
  'status',
] as const;
type ApplicationFieldName = (typeof FORM_FIELDS)[number];

const applicationSchema = z.object({
  serialNumber: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => SERIAL_REGEX.test(val), {
      message:
        'Must be 5–30 chars (A–Z, 0–9, hyphens) and start with a letter or digit',
    }),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Email must not exceed 254 characters')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(6, 'Phone must be at least 6 characters')
    .max(20, 'Phone must not exceed 20 characters')
    .regex(
      PHONE_REGEX,
      'Phone may only contain digits, spaces, +, -, and parentheses',
    ),
  status: z.enum(['pending', 'approved', 'rejected']),
  passportNumber: z
    .string()
    .trim()
    .max(30, 'Passport number must not exceed 30 characters')
    .refine((val) => val === '' || PASSPORT_REGEX.test(val), {
      message: 'Only letters, digits, spaces, and hyphens allowed',
    }),
  visaStatus: z
    .string()
    .trim()
    .max(100, 'Visa status must not exceed 100 characters'),
  note: z
    .string()
    .trim()
    .max(MAX_NOTE_LENGTH, 'Note must not exceed 1000 characters'),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export interface ApplicationFormModalProps {
  open: boolean;
  editing: Application | null;
  onClose: () => void;
  onSuccess: (isCreate: boolean) => Promise<void> | void;
}

const STATUS_OPTIONS: {
  value: ApplicationStatus;
  label: string;
  icon: typeof Clock;
  activeClass: string;
}[] = [
  {
    value: 'pending',
    label: 'Pending',
    icon: Clock,
    activeClass: 'bg-warning/15 text-warning border-warning/40',
  },
  {
    value: 'approved',
    label: 'Approved',
    icon: CheckCircle2,
    activeClass: 'bg-success/15 text-success border-success/40',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    icon: XCircle,
    activeClass: 'bg-destructive/15 text-destructive border-destructive/40',
  },
];

export function ApplicationFormModal({
  open,
  editing,
  onClose,
  onSuccess,
}: ApplicationFormModalProps) {
  const isEdit = Boolean(editing);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      serialNumber: '',
      name: '',
      email: '',
      phone: '',
      status: 'pending',
      passportNumber: '',
      visaStatus: '',
      note: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        serialNumber: editing.serialNumber,
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        status: editing.status,
        passportNumber: editing.passportNumber ?? '',
        visaStatus: editing.visaStatus ?? '',
        note: editing.note ?? '',
      });
    } else {
      reset({
        serialNumber: '',
        name: '',
        email: '',
        phone: '',
        status: 'pending',
        passportNumber: '',
        visaStatus: '',
        note: '',
      });
    }
  }, [editing, open, reset]);

  const currentStatus = useWatch({ control, name: 'status' });
  const currentNote = useWatch({ control, name: 'note' }) ?? '';

  const serialRegister = register('serialNumber');

  const mutation = useMutation({
    mutationFn: async (values: ApplicationFormValues) => {
      if (editing) {
        const payload: UpdateApplicationPayload = {
          serialNumber: values.serialNumber,
          name: values.name,
          email: values.email,
          phone: values.phone,
          status: values.status,
          passportNumber: values.passportNumber,
          visaStatus: values.visaStatus,
          note: values.note,
        };
        return applicationsApi.updateApplication(editing._id, payload);
      }

      const payload: CreateApplicationPayload = {
        serialNumber: values.serialNumber,
        name: values.name,
        email: values.email,
        phone: values.phone,
        status: values.status,
        ...(values.passportNumber ? { passportNumber: values.passportNumber } : {}),
        ...(values.visaStatus ? { visaStatus: values.visaStatus } : {}),
        ...(values.note ? { note: values.note } : {}),
      };
      return applicationsApi.createApplication(payload);
    },
    onSuccess: async () => {
      toast.success(
        isEdit
          ? 'Application updated successfully'
          : 'Application created successfully',
      );
      await onSuccess(!isEdit);
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('serialNumber', {
            type: 'server',
            message: err.message || 'This serial number already exists',
          });
          return;
        }
        if (err.status === 400 && err.errorSources.length > 0) {
          let mapped = false;
          for (const source of err.errorSources) {
            const key = String(source.path) as ApplicationFieldName;
            if (FORM_FIELDS.includes(key)) {
              setError(key, { type: 'server', message: source.message });
              mapped = true;
            }
          }
          if (mapped) return;
        }
        toast.error(err.message || 'Failed to save application');
        return;
      }
      toast.error('Failed to save application');
    },
  });

  const onSubmit = (values: ApplicationFormValues) => {
    if (mutation.isPending) return;
    mutation.mutate(values);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
      title={isEdit ? 'Edit Application' : 'Add Application'}
      description={
        isEdit
          ? 'Update applicant details, serial number, status, or applicant note.'
          : 'Create an application record and share the serial number with the applicant.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Manual Serial Number (auto-uppercased) */}
        <FormField
          id="app-serial"
          label="Serial Number"
          required
          error={errors.serialNumber?.message}
          hint="Type a serial number to send to the applicant. Use a mix of letters and numbers, avoid sequential numbers like 00001."
        >
          <Input
            id="app-serial"
            type="text"
            placeholder="AB-4F7K9"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            hasError={Boolean(errors.serialNumber)}
            className="font-mono uppercase"
            {...serialRegister}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
              void serialRegister.onChange(e);
            }}
          />
        </FormField>

        {/* Required personal details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="app-name"
            label="Applicant Name"
            required
            error={errors.name?.message}
          >
            <Input
              id="app-name"
              type="text"
              placeholder="Shuvo Kumar"
              hasError={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField
            id="app-email"
            label="Email Address"
            required
            error={errors.email?.message}
          >
            <Input
              id="app-email"
              type="email"
              placeholder="applicant@example.com"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="app-phone"
            label="Phone Number"
            required
            error={errors.phone?.message}
          >
            <Input
              id="app-phone"
              type="tel"
              placeholder="+39 06 1234 5678"
              hasError={Boolean(errors.phone)}
              {...register('phone')}
            />
          </FormField>

          {/* Status 3-option segmented toggle */}
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-foreground">
              Status <span className="text-destructive">*</span>
            </span>
            <div
              role="radiogroup"
              aria-label="Application status"
              className="grid grid-cols-3 gap-1.5"
            >
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = currentStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      setValue('status', opt.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      'inline-flex min-h-10 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? opt.activeClass
                        : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Private optional fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="app-passport"
            label="Passport Number (optional, private — admin only)"
            error={errors.passportNumber?.message}
          >
            <Input
              id="app-passport"
              type="text"
              placeholder="A12345678"
              hasError={Boolean(errors.passportNumber)}
              {...register('passportNumber')}
            />
          </FormField>

          <FormField
            id="app-visa"
            label="Visa Status (optional, private — admin only)"
            error={errors.visaStatus?.message}
          >
            <Input
              id="app-visa"
              type="text"
              placeholder="Visa processing"
              hasError={Boolean(errors.visaStatus)}
              {...register('visaStatus')}
            />
          </FormField>
        </div>

        {/* Public note for applicant */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="app-note"
              className="text-sm font-medium text-foreground"
            >
              Note for applicant (optional, shown on the public status page)
            </label>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {currentNote.length} / {MAX_NOTE_LENGTH}
            </span>
          </div>
          <Textarea
            id="app-note"
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="Next steps or message for the applicant..."
            hasError={Boolean(errors.note)}
            {...register('note')}
          />
          <p className="flex items-start gap-1.5 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Anyone with the serial number can read this note. Do not include
              personal or sensitive details.
            </span>
          </p>
          {errors.note ? (
            <p className="text-xs font-medium text-destructive">
              {errors.note.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Application'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
