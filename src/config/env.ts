import { z } from 'zod';

const DEFAULT_API_URL = 'http://localhost:5000/api/v1';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .trim()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .default(DEFAULT_API_URL),
});

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : undefined,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ')}`,
  );
}

export const env = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL.replace(/\/+$/, ''),
} as const;

