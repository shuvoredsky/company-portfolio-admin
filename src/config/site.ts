/**
 * Single source of truth for company branding across the Admin Dashboard.
 * Edit ONLY this file to rename the company everywhere (navbar, login page,
 * browser tab titles, and metadata).
 */
export const siteConfig = {
  brandName: 'Company Name',
  brandShortName: 'CN',
  adminTitle: 'Admin Panel',
  tagline: 'Cultivating sustainable growth and modern agricultural excellence.',
  description:
    'Admin dashboard for managing banners, blogs, recruitment posts, and customer inquiries.',
} as const;

export type SiteConfig = typeof siteConfig;

