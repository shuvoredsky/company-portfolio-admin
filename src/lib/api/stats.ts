import { api } from './client';
import { AdminStats, ApiResponse } from './types';

export const statsApi = {
  getStats: (): Promise<ApiResponse<AdminStats>> =>
    api.get<AdminStats>('/admin/stats'),
};

