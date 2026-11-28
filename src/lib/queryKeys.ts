import {
  ApplicationListParams,
  BlogListParams,
  ContactListParams,
  NetworkListParams,
  RecruitmentListParams,
} from '@/lib/api/types';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  stats: {
    admin: ['admin', 'stats'] as const,
  },
  banners: {
    all: ['banners'] as const,
    adminList: ['banners', 'admin', 'all'] as const,
  },
  blogs: {
    all: ['blogs'] as const,
    list: (params: BlogListParams) => ['blogs', 'list', params] as const,
    detail: (id: string) => ['blogs', 'detail', id] as const,
  },
  networks: {
    all: ['networks'] as const,
    list: (params: NetworkListParams) => ['networks', 'list', params] as const,
    detail: (id: string) => ['networks', 'detail', id] as const,
  },
  recruitments: {
    all: ['recruitments'] as const,
    adminList: (params: RecruitmentListParams) =>
      ['recruitments', 'admin', 'list', params] as const,
  },
  applications: {
    all: ['applications'] as const,
    list: (params: ApplicationListParams) =>
      ['applications', 'admin', 'list', params] as const,
    detail: (id: string) => ['applications', 'admin', 'detail', id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: (params: ContactListParams) => ['contacts', 'list', params] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
} as const;
