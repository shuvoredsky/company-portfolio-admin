export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorSource {
  path: string | number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorSources?: ApiErrorSource[];
  stack?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errorSources: ApiErrorSource[];

  constructor(
    status: number,
    message: string,
    errorSources: ApiErrorSource[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorSources = errorSources;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}


export interface CloudinaryImage {
  url: string;
  publicId: string;
}

export interface Banner {
  _id: string;
  image: CloudinaryImage;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecentContactSummary {
  id: string;
  name: string;
  email: string;
  country: string;
  createdAt?: string;
  isRead: boolean;
}

export interface AdminStats {
  counts: {
    banners: number;
    blogs: number;
    networks: number;
    recruitments: number;
    contacts: number;
    unreadContacts: number;
  };
  recentContacts: RecentContactSummary[];
}

export interface Blog {
  _id: string;
  title: string;
  description: string;
  image: CloudinaryImage;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface Recruitment {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecruitmentListParams {
  page?: number;
  limit?: number;
}

export interface CreateRecruitmentPayload {
  title: string;
  description: string;
  isActive?: boolean;
}

export interface UpdateRecruitmentPayload {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface ContactMessage {
  _id: string;
  name: string;
  country: string;
  phone: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactListParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  search?: string;
}

export interface Network {
  _id: string;
  title: string;
  description: string;
  image: CloudinaryImage;
  externalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NetworkListParams {
  page?: number;
  limit?: number;
  search?: string;
}
