import { env } from '@/config/env';
import { ApiError, ApiErrorResponse, ApiResponse } from './types';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip triggering the global 401 unauthorized callback (e.g., for /auth/login or /auth/me). */
  skipAuthRedirect?: boolean;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiUrl}${normalizedPath}`;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    body,
    headers: customHeaders,
    skipAuthRedirect = false,
    ...rest
  } = options;

  const headers = new Headers(customHeaders);
  let requestBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    if (isFormData(body)) {
      // Do NOT set Content-Type for FormData so the browser sets the multipart boundary
      headers.delete('Content-Type');
      requestBody = body;
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      requestBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      headers,
      body: requestBody,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection.');
  }

  let payload: ApiResponse<T> | ApiErrorResponse | null = null;
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      payload = (await response.json()) as ApiResponse<T> | ApiErrorResponse;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | null;
    const message =
      errorPayload?.message ||
      (response.status === 429
        ? 'Too many attempts. Please try again later.'
        : 'Request failed. Please try again.');
    const errorSources = Array.isArray(errorPayload?.errorSources)
      ? errorPayload.errorSources
      : [];

    const isLoginEndpoint = path.startsWith('/auth/login');
    if (
      response.status === 401 &&
      !skipAuthRedirect &&
      !isLoginEndpoint &&
      unauthorizedHandler
    ) {
      unauthorizedHandler();
    }

    throw new ApiError(response.status, message, errorSources);
  }

  if (!payload || !('success' in payload)) {
    throw new ApiError(
      response.status,
      'Unexpected response format from server.',
    );
  }

  return payload as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'DELETE' }),
};

