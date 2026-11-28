import { api } from './client';
import {
  ApiResponse,
  Application,
  ApplicationListParams,
  CreateApplicationPayload,
  UpdateApplicationPayload,
} from './types';

function buildQuery(params: ApplicationListParams): string {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  if (params.status) sp.set('status', params.status);
  if (params.search && params.search.trim()) {
    sp.set('search', params.search.trim());
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const applicationsApi = {
  getApplications: (
    params: ApplicationListParams = {},
  ): Promise<ApiResponse<Application[]>> =>
    api.get<Application[]>(`/applications/admin/all${buildQuery(params)}`),

  getApplicationById: (id: string): Promise<ApiResponse<Application>> =>
    api.get<Application>(`/applications/admin/${id}`),

  createApplication: (
    payload: CreateApplicationPayload,
  ): Promise<ApiResponse<Application>> =>
    api.post<Application>('/applications', payload),

  updateApplication: (
    id: string,
    payload: UpdateApplicationPayload,
  ): Promise<ApiResponse<Application>> =>
    api.patch<Application>(`/applications/${id}`, payload),

  deleteApplication: (id: string): Promise<ApiResponse<Application>> =>
    api.delete<Application>(`/applications/${id}`),
};

