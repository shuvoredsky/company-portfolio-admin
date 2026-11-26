import { api } from './client';
import { ApiResponse, Network, NetworkListParams } from './types';

function buildNetworkQueryString(params: NetworkListParams): string {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  if (params.search && params.search.trim()) {
    sp.set('search', params.search.trim());
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const networksApi = {
  getNetworks: (
    params: NetworkListParams = {},
  ): Promise<ApiResponse<Network[]>> =>
    api.get<Network[]>(`/networks/admin/all${buildNetworkQueryString(params)}`),

  getNetworkById: (id: string): Promise<ApiResponse<Network>> =>
    api.get<Network>(`/networks/admin/${id}`),

  createNetwork: (formData: FormData): Promise<ApiResponse<Network>> =>
    api.post<Network>('/networks', formData),

  updateNetwork: (
    id: string,
    formData: FormData,
  ): Promise<ApiResponse<Network>> =>
    api.patch<Network>(`/networks/${id}`, formData),

  deleteNetwork: (id: string): Promise<ApiResponse<Network>> =>
    api.delete<Network>(`/networks/${id}`),
};

