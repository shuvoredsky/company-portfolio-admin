import { api } from './client';
import { AdminUser, ApiResponse, LoginCredentials } from './types';

export const authApi = {
  login: (credentials: LoginCredentials): Promise<ApiResponse<AdminUser>> =>
    api.post<AdminUser>('/auth/login', credentials, {
      skipAuthRedirect: true,
    }),

  logout: (): Promise<ApiResponse<null>> =>
    api.post<null>('/auth/logout', undefined, {
      skipAuthRedirect: true,
    }),

  getMe: (): Promise<ApiResponse<AdminUser>> =>
    api.get<AdminUser>('/auth/me', {
      skipAuthRedirect: true,
    }),
};

