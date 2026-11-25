import { api } from './client';
import {
  ApiResponse,
  CreateRecruitmentPayload,
  Recruitment,
  RecruitmentListParams,
  UpdateRecruitmentPayload,
} from './types';

function buildPaginationQuery(params: RecruitmentListParams): string {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const recruitmentsApi = {
  getAdminRecruitments: (
    params: RecruitmentListParams = {},
  ): Promise<ApiResponse<Recruitment[]>> =>
    api.get<Recruitment[]>(
      `/recruitments/admin/all${buildPaginationQuery(params)}`,
    ),

  createRecruitment: (
    payload: CreateRecruitmentPayload,
  ): Promise<ApiResponse<Recruitment>> =>
    api.post<Recruitment>('/recruitments', payload),

  updateRecruitment: (
    id: string,
    payload: UpdateRecruitmentPayload,
  ): Promise<ApiResponse<Recruitment>> =>
    api.patch<Recruitment>(`/recruitments/${id}`, payload),

  deleteRecruitment: (id: string): Promise<ApiResponse<Recruitment>> =>
    api.delete<Recruitment>(`/recruitments/${id}`),
};
