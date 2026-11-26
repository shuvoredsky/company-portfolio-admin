import { api } from './client';
import { ApiResponse, ContactListParams, ContactMessage } from './types';

function buildContactQueryString(params: ContactListParams): string {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  if (typeof params.isRead === 'boolean') {
    sp.set('isRead', String(params.isRead));
  }
  if (params.search && params.search.trim()) {
    sp.set('search', params.search.trim());
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const contactsApi = {
  getContacts: (
    params: ContactListParams = {},
  ): Promise<ApiResponse<ContactMessage[]>> =>
    api.get<ContactMessage[]>(`/contacts${buildContactQueryString(params)}`),

  getContactById: (id: string): Promise<ApiResponse<ContactMessage>> =>
    api.get<ContactMessage>(`/contacts/${id}`),

  markContactRead: (
    id: string,
    isRead: boolean,
  ): Promise<ApiResponse<ContactMessage>> =>
    api.patch<ContactMessage>(`/contacts/${id}/read`, { isRead }),

  deleteContact: (id: string): Promise<ApiResponse<ContactMessage>> =>
    api.delete<ContactMessage>(`/contacts/${id}`),
};

