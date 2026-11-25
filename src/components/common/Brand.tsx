/**
 * Reusable text-based Brand logo driven solely by src/config/site.ts.
 *
 * HOW TO REPLACE WITH AN IMAGE LOGO LATER:
 * 1. Place your logo file in public/logo.svg (or public/logo.png).
 * 2. Import `Image` from 'next/image' and replace the `<span ...>` badge below
 *    with `<Image src="/logo.svg" alt={siteConfig.brandName} width={36} height={36} priority />`.
 */
import { Sprout } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export interface BrandProps {
  showSubtitle?: boolean;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}

export function Brand({
  showSubtitle = false,
  compact = false,
  inverted = false,
  className,
}: BrandProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs',
          inverted
            ? 'bg-primary-foreground/15 text-primary-foreground ring-1 ring-primary-foreground/25'
            : 'bg-primary text-primary-foreground',
        )}
      >
        <Sprout className="h-4 w-4 shrink-0" />
        <span className="sr-only">{siteConfig.brandShortName}</span>
      </span>

      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            'truncate font-semibold tracking-tight',
            compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
            inverted ? 'text-primary-foreground' : 'text-foreground',
          )}
        >
          {siteConfig.brandName}
        </span>
        {showSubtitle && (
          <span
            className={cn(
              'truncate text-xs',
              inverted
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground',
            )}
          >
            {siteConfig.adminTitle}
          </span>
        )}
      </div>
    </div>
  );
}

