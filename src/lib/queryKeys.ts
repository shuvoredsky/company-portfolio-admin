import { BlogListParams, RecruitmentListParams } from '@/lib/api/types';

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
  recruitments: {
    all: ['recruitments'] as const,
    adminList: (params: RecruitmentListParams) =>
      ['recruitments', 'admin', 'list', params] as const,
  },
  contacts: {
    all: ['contacts'] as const,
  },
} as const;
