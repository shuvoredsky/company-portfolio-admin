import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'Something went wrong while communicating with the server.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('border-destructive/30', className)}>
      <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
          {message}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-5">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

