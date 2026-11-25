import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export interface LoaderProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loader({
  label = 'Loading...',
  fullScreen = false,
  className,
}: LoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullScreen ? 'min-h-dvh w-full bg-background' : 'py-16',
        className,
      )}
    >
      <Spinner size="lg" className="text-primary" label={label} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

