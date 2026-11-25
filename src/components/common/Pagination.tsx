'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const canGoPrev = page > 1 && !disabled;
  const canGoNext = page < totalPages && !disabled;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of{' '}
        <span className="font-semibold text-foreground">{totalPages}</span>
        {totalItems !== undefined && (
          <span className="ml-1.5">({totalItems} total)</span>
        )}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
