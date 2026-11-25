'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface ImageUploadProps {
  id: string;
  value: File | null;
  existingImageUrl?: string;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function ImageUpload({
  id,
  value,
  existingImageUrl,
  onChange,
  error,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const objectUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );

  useEffect(() => {
    if (!objectUrl) return;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewUrl = objectUrl ?? existingImageUrl ?? null;
  const displayError = localError ?? error;

  const validateAndSetFile = (file: File | null) => {
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setLocalError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError('Image must be 5MB or smaller.');
      return;
    }

    setLocalError(null);
    onChange(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    validateAndSetFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(file);
  };

  const handleRemoveNewFile = () => {
    setLocalError(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={handleInputChange}
        className="sr-only"
      />

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
          <div className="relative aspect-[16/9] w-full bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-3.5 py-2.5">
            <span className="truncate text-xs text-muted-foreground">
              {value ? value.name : 'Current uploaded image'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Replace
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={handleRemoveNewFile}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload image by clicking or dragging a file"
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isDragging
              ? 'border-primary bg-secondary/70'
              : displayError
                ? 'border-destructive bg-destructive/5'
                : 'border-input bg-muted/30 hover:border-primary/60 hover:bg-secondary/40',
            disabled && 'pointer-events-none opacity-55',
          )}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, or WebP (max 5MB)
          </p>
        </div>
      )}

      {displayError && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {displayError}
        </p>
      )}
    </div>
  );
}
