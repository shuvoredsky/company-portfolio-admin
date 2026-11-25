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
  },
  recruitments: {
    all: ['recruitments'] as const,
  },
  contacts: {
    all: ['contacts'] as const,
  },
} as const;

