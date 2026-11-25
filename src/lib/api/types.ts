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
  title: string;
  subtitle?: string;
  image: CloudinaryImage;
  ctaText?: string;
  ctaLink?: string;
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
    recruitments: number;
    contacts: number;
    unreadContacts: number;
  };
  recentContacts: RecentContactSummary[];
}
