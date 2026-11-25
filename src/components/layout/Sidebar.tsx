'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, Sprout, X } from 'lucide-react';
import { Brand } from '@/components/common/Brand';
import { Badge } from '@/components/ui/Badge';
import { dashboardNavItems } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  unreadContacts: number;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  unreadContacts,
}: SidebarProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousPathnameRef = useRef(pathname);

  // Close mobile drawer when route changes
  useEffect(() => {
    if (previousPathnameRef.current !== pathname && mobileOpen) {
      onCloseMobile();
    }
    previousPathnameRef.current = pathname;
  }, [pathname, mobileOpen, onCloseMobile]);

  // Body scroll lock, Escape to close, and focus trap while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const firstFocusable =
        drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? drawerRef.current)?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseMobile();
        return;
      }

      if (event.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [mobileOpen, onCloseMobile]);

  const isActiveHref = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavLinks = (isCompact: boolean) => (
    <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 p-3">
      {dashboardNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveHref(item.href);
        const badgeCount =
          item.badgeKey === 'unreadContacts' ? unreadContacts : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={isCompact ? item.label : undefined}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              isCompact && 'justify-center px-2',
              active
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!isCompact && (
              <>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {badgeCount > 0 && (
                  <Badge
                    variant={active ? 'secondary' : 'default'}
                    className="px-2 py-0 text-xs"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </>
            )}
            {isCompact && badgeCount > 0 && (
              <span
                aria-label={`${badgeCount} unread`}
                className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop fixed left sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-border px-3',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {collapsed ? (
            <Link
              href="/dashboard"
              aria-label={siteConfig.brandName}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Brand compact showSubtitle />
            </Link>
          )}
        </div>

        {renderNavLinks(collapsed)}

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              collapsed && 'justify-center px-2',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile / tablet slide-in drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="presentation"
        >
          <div
            aria-hidden="true"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-xs"
          />

          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-xl focus:outline-none"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Link
                href="/dashboard"
                onClick={onCloseMobile}
                className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Brand compact showSubtitle />
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {renderNavLinks(false)}
          </div>
        </div>
      )}
    </>
  );
}

