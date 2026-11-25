'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/common/Brand';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  /** Optional left slot for a mobile sidebar toggle button in Prompt 2. */
  leftSlot?: ReactNode;
  className?: string;
}

export function Navbar({ leftSlot, className }: NavbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initial = (user?.name || user?.email || 'A')
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setMenuOpen(false);
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out cleanly');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {leftSlot}
          <Link
            href="/dashboard"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Brand compact showSubtitle />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
              >
                {initial}
              </span>
              <span className="hidden max-w-36 truncate sm:inline">
                {user?.name || user?.email || 'Admin'}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  menuOpen && 'rotate-180',
                )}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="Admin account options"
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
              >
                <div className="border-b border-border px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email || ''}
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

