'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { AdminUser, ApiError, LoginCredentials } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';

/**
 * SECURITY ARCHITECTURE NOTE:
 * The authentication JWT is stored in an HTTP-only cookie ("accessToken")
 * issued by the backend API domain. In production, Next.js middleware running
 * on the admin frontend domain cannot read HTTP-only cookies scoped to the
 * API domain. Therefore, route protection is enforced client-side with this
 * AuthProvider using GET /api/v1/auth/me as the single source of truth.
 * Tokens and user profiles are NEVER stored in localStorage, sessionStorage,
 * or client-readable cookies.
 */

export const AUTH_ME_QUERY_KEY = queryKeys.auth.me;

export interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const handledExpiryRef = useRef(false);

  const { data: user = null, isPending } = useQuery<AdminUser | null>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await authApi.getMe();
        handledExpiryRef.current = false;
        return res.data ?? null;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (handledExpiryRef.current) {
        return;
      }
      handledExpiryRef.current = true;
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      if (pathname !== '/login') {
        toast.error('Session expired, please log in again');
        router.replace('/login');
      }
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [pathname, queryClient, router]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AdminUser> => {
      const res = await authApi.login(credentials);
      handledExpiryRef.current = false;
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, res.data);
      return res.data;
    },
    [queryClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      handledExpiryRef.current = false;
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.clear();
      router.replace('/login');
    }
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: isPending,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, isPending, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
