'use client';

import {
  Calendar,
  Copy,
  Globe,
  Mail,
  MailCheck,
  MailOpen,
  Phone,
  Reply,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ContactMessage } from '@/lib/api/types';

function formatDateTime(isoDate?: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export interface ContactDetailModalProps {
  contact: ContactMessage | null;
  onClose: () => void;
  onToggleRead: (contact: ContactMessage) => void;
  onRequestDelete: (contact: ContactMessage) => void;
  isUpdatingRead?: boolean;
}

export function ContactDetailModal({
  contact,
  onClose,
  onToggleRead,
  onRequestDelete,
  isUpdatingRead = false,
}: ContactDetailModalProps) {
  const handleCopyEmail = async () => {
    if (!contact) return;
    try {
      await navigator.clipboard.writeText(contact.email);
      toast.success('Email copied to clipboard');
    } catch {
      toast.error('Could not copy email address');
    }
  };

  return (
    <Modal
      open={Boolean(contact)}
      onClose={onClose}
      title={contact ? contact.name : 'Message'}
      description={
        contact ? `Received ${formatDateTime(contact.createdAt)}` : undefined
      }
      size="lg"
      footer={
        contact ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestDelete(contact)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                isLoading={isUpdatingRead}
                onClick={() => onToggleRead(contact)}
              >
                {contact.isRead ? (
                  <>
                    <MailOpen className="h-4 w-4" aria-hidden="true" />
                    Mark as Unread
                  </>
                ) : (
                  <>
                    <MailCheck className="h-4 w-4" aria-hidden="true" />
                    Mark as Read
                  </>
                )}
              </Button>

              <a
                href={`mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(`Re: Inquiry from ${contact.name}`)}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Reply className="h-4 w-4" aria-hidden="true" />
                Reply by Email
              </a>
            </div>
          </div>
        ) : undefined
      }
    >
      {contact && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={contact.isRead ? 'secondary' : 'success'}>
              {contact.isRead ? 'Read' : 'Unread'}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDateTime(contact.createdAt)}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Email
              </dt>
              <dd className="flex items-center gap-1.5 min-w-0">
                <a
                  href={`mailto:${contact.email}`}
                  className="truncate font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {contact.email}
                </a>
                <button
                  type="button"
                  onClick={() => void handleCopyEmail()}
                  aria-label="Copy email address"
                  title="Copy email"
                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </dd>
            </div>

            <div className="min-w-0 space-y-1">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                Phone
              </dt>
              <dd className="min-w-0">
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="break-words font-medium text-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {contact.phone}
                </a>
              </dd>
            </div>

            <div className="min-w-0 space-y-1 sm:col-span-2">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                Country
              </dt>
              <dd className="break-words font-medium text-foreground">
                {contact.country}
              </dd>
            </div>
          </dl>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Message
            </h3>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {contact.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

