'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Brand } from '@/components/common/Brand';
import { Loader } from '@/components/common/Loader';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/types';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isAuthenticated) {
    return <Loader fullScreen label="Checking session..." />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values);
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (err) {
      let message = 'Unable to sign in. Please try again.';
      if (err instanceof ApiError) {
        if (err.status === 429) {
          message = 'Too many attempts, try again later.';
        } else if (err.status === 401) {
          message = 'Invalid email or password.';
        } else {
          message = err.message;
        }
      }
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background lg:flex-row">
      {/* Top-right theme switcher */}
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Decorative side panel on large screens */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:w-5/12 xl:w-1/2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />

        <div className="relative z-10">
          <Brand inverted showSubtitle />
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-xs font-medium text-primary-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>{siteConfig.adminTitle}</span>
          </div>
          <h1 className="text-3xl leading-tight font-bold tracking-tight xl:text-4xl">
            Manage {siteConfig.brandName} with confidence.
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/85 xl:text-base">
            {siteConfig.tagline}
          </p>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/75">
          &copy; {new Date().getFullYear()} {siteConfig.brandName}. Authorized
          administrators only.
        </p>
      </aside>

      {/* Centered login card */}
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center lg:hidden">
            <Brand showSubtitle />
          </div>

          <Card className="border-border/80 shadow-md">
            <CardHeader className="space-y-2 pb-4 text-center sm:text-left">
              <div className="hidden lg:block">
                <Brand compact />
              </div>
              <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
              <CardDescription>
                Sign in with your administrator credentials to access{' '}
                {siteConfig.brandName}.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {formError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{formError}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                <FormField
                  id="email"
                  label="Email Address"
                  required
                  error={errors.email?.message}
                >
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="admin@example.com"
                      hasError={Boolean(errors.email)}
                      className="pl-10"
                      {...register('email')}
                    />
                  </div>
                </FormField>

                <FormField
                  id="password"
                  label="Password"
                  required
                  error={errors.password?.message}
                >
                  <div className="relative">
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      hasError={Boolean(errors.password)}
                      className="pr-11 pl-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      className="absolute top-1/2 right-1.5 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormField>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className="mt-2 w-full"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

