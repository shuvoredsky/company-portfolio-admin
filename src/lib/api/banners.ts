import { api } from './client';
import { ApiResponse, Banner } from './types';

export const bannersApi = {
  getAdminBanners: (): Promise<ApiResponse<Banner[]>> =>
    api.get<Banner[]>('/banners/admin/all'),

  createBanner: (formData: FormData): Promise<ApiResponse<Banner>> =>
    api.post<Banner>('/banners', formData),

  updateBanner: (
    id: string,
    formData: FormData,
  ): Promise<ApiResponse<Banner>> => api.patch<Banner>(`/banners/${id}`, formData),

  deleteBanner: (id: string): Promise<ApiResponse<Banner>> =>
    api.delete<Banner>(`/banners/${id}`),
};

