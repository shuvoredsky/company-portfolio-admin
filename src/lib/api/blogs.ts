import { api } from './client';
import { ApiResponse, Blog, BlogListParams } from './types';

function buildBlogQueryString(params: BlogListParams): string {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  if (params.search && params.search.trim()) {
    sp.set('search', params.search.trim());
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const blogsApi = {
  getBlogs: (params: BlogListParams = {}): Promise<ApiResponse<Blog[]>> =>
    api.get<Blog[]>(`/blogs${buildBlogQueryString(params)}`),

  getBlogById: (id: string): Promise<ApiResponse<Blog>> =>
    api.get<Blog>(`/blogs/${id}`),

  createBlog: (formData: FormData): Promise<ApiResponse<Blog>> =>
    api.post<Blog>('/blogs', formData),

  updateBlog: (id: string, formData: FormData): Promise<ApiResponse<Blog>> =>
    api.patch<Blog>(`/blogs/${id}`, formData),

  deleteBlog: (id: string): Promise<ApiResponse<Blog>> =>
    api.delete<Blog>(`/blogs/${id}`),
};
