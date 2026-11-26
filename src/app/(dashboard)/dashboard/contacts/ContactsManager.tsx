'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Eye,
  Inbox,
  MailCheck,
  MailOpen,
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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { contactsApi } from '@/lib/api/contacts';
import {
  AdminStats,
  ApiError,
  ApiResponse,
  ContactMessage,
} from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { ContactDetailModal } from './ContactDetailModal';

const PAGE_LIMIT = 10;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

type ReadFilter = 'all' | 'unread' | 'read';

const FILTER_OPTIONS: readonly { value: ReadFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function ContactsManager() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openIdParam = searchParams.get('open');
  const isValidOpenId = Boolean(openIdParam && OBJECT_ID_REGEX.test(openIdParam));

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ReadFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(
    null,
  );
  const [dismissedOpenId, setDismissedOpenId] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] =
    useState<ContactMessage | null>(null);

  const invalidParamNotifiedRef = useRef<string | null>(null);
  const autoMarkedDeepLinkRef = useRef<string | null>(null);

  const queryParams = {
    page,
    limit: PAGE_LIMIT,
    isRead: filter === 'all' ? undefined : filter === 'read',
    search: debouncedSearch.trim() || undefined,
  };
  const listKey = queryKeys.contacts.list(queryParams);

  const { data, isPending, isPlaceholderData, isError, error, refetch } =
    useQuery({
      queryKey: listKey,
      queryFn: () => contactsApi.getContacts(queryParams),
      placeholderData: keepPreviousData,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    });

  const deepLinkQuery = useQuery({
    queryKey: queryKeys.contacts.detail(openIdParam ?? ''),
    queryFn: () => contactsApi.getContactById(openIdParam ?? ''),
    enabled: isValidOpenId && dismissedOpenId !== openIdParam,
    retry: false,
  });

  // Notify cleanly if ?open=<id> is malformed or 404
  useEffect(() => {
    if (!openIdParam) return;
    if (!isValidOpenId && invalidParamNotifiedRef.current !== openIdParam) {
      invalidParamNotifiedRef.current = openIdParam;
      toast.error('Invalid contact message link.');
      router.replace('/dashboard/contacts');
    }
  }, [openIdParam, isValidOpenId, router]);

  useEffect(() => {
    if (
      deepLinkQuery.isError &&
      openIdParam &&
      invalidParamNotifiedRef.current !== openIdParam
    ) {
      invalidParamNotifiedRef.current = openIdParam;
      const msg =
        deepLinkQuery.error instanceof ApiError
          ? deepLinkQuery.error.message
          : 'Contact message not found.';
      toast.error(msg);
      router.replace('/dashboard/contacts');
    }
  }, [deepLinkQuery.isError, deepLinkQuery.error, openIdParam, router]);

  const markReadMutation = useMutation({
    mutationFn: ({
      id,
      isRead,
    }: {
      id: string;
      isRead: boolean;
      silent?: boolean;
    }) => contactsApi.markContactRead(id, isRead),
    onMutate: async ({ id, isRead }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: queryKeys.stats.admin }),
      ]);

      const previousList = queryClient.getQueryData<
        ApiResponse<ContactMessage[]>
      >(listKey);
      const previousStats = queryClient.getQueryData<ApiResponse<AdminStats>>(
        queryKeys.stats.admin,
      );

      let wasRead: boolean | undefined;
      if (previousList) {
        const match = previousList.data.find((c) => c._id === id);
        wasRead = match?.isRead;
        queryClient.setQueryData<ApiResponse<ContactMessage[]>>(listKey, {
          ...previousList,
          data: previousList.data.map((item) =>
            item._id === id ? { ...item, isRead } : item,
          ),
        });
      }

      if (previousStats && wasRead !== isRead) {
        const delta = isRead ? -1 : 1;
        queryClient.setQueryData<ApiResponse<AdminStats>>(
          queryKeys.stats.admin,
          {
            ...previousStats,
            data: {
              ...previousStats.data,
              counts: {
                ...previousStats.data.counts,
                unreadContacts: Math.max(
                  0,
                  previousStats.data.counts.unreadContacts + delta,
                ),
              },
              recentContacts: previousStats.data.recentContacts.map((rc) =>
                rc.id === id ? { ...rc, isRead } : rc,
              ),
            },
          },
        );
      }

      setSelectedContact((prev) =>
        prev && prev._id === id ? { ...prev, isRead } : prev,
      );

      return { previousList, previousStats };
    },
    onSuccess: (res, variables) => {
      if (!variables.silent) {
        toast.success(
          variables.isRead ? 'Marked as read' : 'Marked as unread',
        );
      }
      setSelectedContact((prev) =>
        prev && prev._id === variables.id ? res.data : prev,
      );
    },
    onError: (err, variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(listKey, context.previousList);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(queryKeys.stats.admin, context.previousStats);
      }
      setSelectedContact((prev) =>
        prev && prev._id === variables.id
          ? { ...prev, isRead: !variables.isRead }
          : prev,
      );
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update read status',
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
      ]);
    },
  });

  // Auto-mark unread deep-linked contact as read once
  const deepLinkedContact =
    isValidOpenId && dismissedOpenId !== openIdParam
      ? (deepLinkQuery.data?.data ?? null)
      : null;

  useEffect(() => {
    if (
      deepLinkedContact &&
      !deepLinkedContact.isRead &&
      autoMarkedDeepLinkRef.current !== deepLinkedContact._id
    ) {
      autoMarkedDeepLinkRef.current = deepLinkedContact._id;
      markReadMutation.mutate({
        id: deepLinkedContact._id,
        isRead: true,
        silent: true,
      });
    }
  }, [deepLinkedContact, markReadMutation]);

  const contacts = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id),
    onSuccess: async (res, deletedId) => {
      const wasLastOnPage = contacts.length === 1 && page > 1;
      if (wasLastOnPage) {
        setPage((prev) => Math.max(1, prev - 1));
      }
      if (selectedContact?._id === deletedId) {
        setSelectedContact(null);
      }
      if (openIdParam === deletedId) {
        setDismissedOpenId(deletedId);
        router.replace('/dashboard/contacts');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin }),
      ]);
      toast.success(res.message || 'Contact message deleted');
      setDeletingContact(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to delete contact message',
      );
    },
  });

  const activeDetailContact = selectedContact ?? deepLinkedContact;

  const handleOpenContact = (contact: ContactMessage) => {
    setSelectedContact(contact);
    if (!contact.isRead) {
      markReadMutation.mutate({
        id: contact._id,
        isRead: true,
        silent: true,
      });
    }
  };

  const handleCloseDetail = () => {
    setSelectedContact(null);
    if (openIdParam) {
      setDismissedOpenId(openIdParam);
      router.replace('/dashboard/contacts');
    }
  };

  const handleFilterChange = (next: ReadFilter) => {
    setFilter(next);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const hasActiveFilterOrSearch =
    filter !== 'all' || Boolean(debouncedSearch.trim());

  return (
    <section className="space-y-6">
      <PageHeader
        title="Contact Messages"
        description="Review, respond to, and manage inquiries from your public website."
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="radiogroup"
          aria-label="Filter messages by read status"
          className="inline-flex w-full items-center rounded-xl border border-border bg-muted/60 p-1 sm:w-auto"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleFilterChange(opt.value)}
                className={cn(
                  'min-h-10 flex-1 cursor-pointer rounded-lg px-4 text-sm font-medium transition-colors sm:flex-initial',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
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

        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            ariaLabel="Search messages by name or email"
          />
        </div>
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load contact messages"
          message={
            error instanceof ApiError
              ? error.message
              : 'Could not fetch contact submissions from the server.'
          }
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3.5 w-72 max-w-full" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : contacts.length === 0 ? (
        hasActiveFilterOrSearch ? (
          <EmptyState
            icon={SearchX}
            title="No matching messages"
            description="No contact submissions match your current filter or search query."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setFilter('all');
                  setSearch('');
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title="No contact messages yet"
            description="Visitor inquiries submitted through your website's Contact Us form will appear here."
          />
        )
      ) : (
        <>
          {/* Desktop Table (md+) */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <th className="w-1/4 px-4 py-3.5">Sender</th>
                    <th className="w-1/6 px-4 py-3.5">Country & Phone</th>
                    <th className="w-1/3 px-4 py-3.5">Message</th>
                    <th className="w-36 px-4 py-3.5">Received</th>
                    <th className="w-36 px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contacts.map((contact) => (
                    <tr
                      key={contact._id}
                      className={cn(
                        'transition-colors hover:bg-accent/40',
                        !contact.isRead && 'bg-secondary/35',
                      )}
                    >
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {!contact.isRead && (
                            <span
                              aria-label="Unread"
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleOpenContact(contact)}
                              className={cn(
                                'block max-w-full cursor-pointer truncate text-left hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
                                !contact.isRead
                                  ? 'font-semibold text-foreground'
                                  : 'font-medium text-foreground',
                              )}
                            >
                              {contact.name}
                            </button>
                            <p className="truncate text-xs text-muted-foreground">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <p className="truncate text-foreground">
                          {contact.country}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {contact.phone}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <p
                          className={cn(
                            'line-clamp-2 break-words text-sm',
                            !contact.isRead
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground',
                          )}
                        >
                          {contact.message}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(contact.createdAt)}
                          </p>
                          <Badge
                            variant={contact.isRead ? 'secondary' : 'success'}
                          >
                            {contact.isRead ? 'Read' : 'Unread'}
                          </Badge>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenContact(contact)}
                            aria-label={`View message from ${contact.name}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              markReadMutation.mutate({
                                id: contact._id,
                                isRead: !contact.isRead,
                              })
                            }
                            aria-label={
                              contact.isRead
                                ? `Mark ${contact.name} as unread`
                                : `Mark ${contact.name} as read`
                            }
                            title={
                              contact.isRead
                                ? 'Mark as unread'
                                : 'Mark as read'
                            }
                          >
                            {contact.isRead ? (
                              <MailOpen
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <MailCheck
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingContact(contact)}
                            aria-label={`Delete message from ${contact.name}`}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards (< md) */}
          <div className="space-y-3 md:hidden">
            {contacts.map((contact) => (
              <Card
                key={contact._id}
                className={cn(
                  'transition-colors',
                  !contact.isRead && 'border-primary/40 bg-secondary/25',
                )}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-base text-foreground',
                          !contact.isRead ? 'font-bold' : 'font-semibold',
                        )}
                      >
                        {contact.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {contact.email}
                      </p>
                    </div>
                    <Badge variant={contact.isRead ? 'secondary' : 'success'}>
                      {contact.isRead ? 'Read' : 'Unread'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="break-words">{contact.country}</span>
                    <span>&middot;</span>
                    <span className="break-words">{contact.phone}</span>
                  </div>

                  <p className="line-clamp-3 break-words text-sm text-foreground">
                    {contact.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(contact.createdAt)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenContact(contact)}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingContact(contact)}
                        aria-label={`Delete message from ${contact.name}`}
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

      <ContactDetailModal
        contact={activeDetailContact}
        onClose={handleCloseDetail}
        onToggleRead={(c) =>
          markReadMutation.mutate({ id: c._id, isRead: !c.isRead })
        }
        onRequestDelete={(c) => setDeletingContact(c)}
        isUpdatingRead={markReadMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(deletingContact)}
        onClose={() => setDeletingContact(null)}
        onConfirm={() => {
          if (deletingContact) {
            deleteMutation.mutate(deletingContact._id);
          }
        }}
        title="Delete contact message?"
        description={`Are you sure you want to delete the message from "${deletingContact?.name ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete Message"
        isLoading={deleteMutation.isPending}
      />
    </section>
  );
}

