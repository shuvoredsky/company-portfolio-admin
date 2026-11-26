'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  FileText,
  Handshake,
  Image as ImageIcon,
  Inbox,
  Mail,
  MailWarning,
} from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/hooks/useAuth';
import { statsApi } from '@/lib/api/stats';
import { ApiError } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

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

export function DashboardOverview() {
  const { user } = useAuth();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.stats.admin,
    queryFn: () => statsApi.getStats(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const stats = data?.data;

  const statCards = [
    {
      label: 'Banners',
      value: stats?.counts.banners ?? 0,
      icon: ImageIcon,
      href: '/dashboard/banners',
    },
    {
      label: 'Blogs',
      value: stats?.counts.blogs ?? 0,
      icon: FileText,
      href: '/dashboard/blogs',
    },
    {
      label: 'Networks',
      value: stats?.counts.networks ?? 0,
      icon: Handshake,
      href: '/dashboard/networks',
    },
    {
      label: 'Recruitments',
      value: stats?.counts.recruitments ?? 0,
      icon: Briefcase,
      href: '/dashboard/recruitments',
    },
    {
      label: 'Total Contacts',
      value: stats?.counts.contacts ?? 0,
      icon: Mail,
      href: '/dashboard/contacts',
    },
    {
      label: 'Unread Contacts',
      value: stats?.counts.unreadContacts ?? 0,
      icon: MailWarning,
      href: '/dashboard/contacts',
      highlight: (stats?.counts.unreadContacts ?? 0) > 0,
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
        description={`Overview of your ${siteConfig.brandName} content and recent visitor inquiries.`}
      />

      {isError ? (
        <ErrorState
          title="Unable to load dashboard stats"
          message={
            error instanceof ApiError
              ? error.message
              : 'Could not fetch dashboard statistics from the server.'
          }
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {isPending
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                      </div>
                      <Skeleton className="mt-4 h-8 w-16" />
                    </CardContent>
                  </Card>
                ))
              : statCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Card className="h-full transition-colors group-hover:border-primary/50">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              {item.label}
                            </p>
                            <span
                              className={
                                item.highlight
                                  ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground'
                                  : 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'
                              }
                            >
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          </div>
                          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                            {item.value}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
          </div>

          {/* Recent Contact Messages */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent contact messages</CardTitle>
                <CardDescription>
                  Latest 5 inquiries submitted through the public Contact Us
                  form.
                </CardDescription>
              </div>
              <Link href="/dashboard/contacts">
                <Button variant="outline" size="sm">
                  View all
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent>
              {isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3.5 w-56" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : !stats || stats.recentContacts.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No contact messages yet"
                  description="When visitors submit the Contact Us form on your website, their messages will appear here."
                  className="border-0 shadow-none"
                />
              ) : (
                <ul className="divide-y divide-border">
                  {stats.recentContacts.map((contact) => (
                    <li key={contact.id} className="py-1 first:pt-0 last:pb-0">
                      <Link
                        href={`/dashboard/contacts?open=${contact.id}`}
                        className="flex flex-col gap-2 rounded-xl px-2 py-2.5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {contact.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contact.email} &middot; {contact.country}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(contact.createdAt)}
                          </span>
                          <Badge
                            variant={contact.isRead ? 'secondary' : 'success'}
                          >
                            {contact.isRead ? 'Read' : 'Unread'}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}

