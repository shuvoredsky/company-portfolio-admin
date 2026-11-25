'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { statsApi } from '@/lib/api/stats';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: statsResponse } = useQuery({
    queryKey: queryKeys.stats.admin,
    queryFn: () => statsApi.getStats(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const unreadContacts = statsResponse?.data?.counts.unreadContacts ?? 0;

  const handleCloseMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const mobileMenuButton = (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open navigation menu"
      aria-expanded={mobileOpen}
      className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
    >
      <Menu className="h-5 w-5" aria-hidden="true" />
    </button>
  );

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
        unreadContacts={unreadContacts}
      />

      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[padding-left] duration-200',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <Navbar leftSlot={mobileMenuButton} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

