import {
  Briefcase,
  FileText,
  Handshake,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: 'unreadContacts';
}

export const dashboardNavItems: readonly NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Banners',
    href: '/dashboard/banners',
    icon: ImageIcon,
  },
  {
    label: 'Blogs',
    href: '/dashboard/blogs',
    icon: FileText,
  },
  {
    label: 'Networks',
    href: '/dashboard/networks',
    icon: Handshake,
  },
  {
    label: 'Recruitment',
    href: '/dashboard/recruitments',
    icon: Briefcase,
  },
  {
    label: 'Contact Messages',
    href: '/dashboard/contacts',
    icon: Mail,
    badgeKey: 'unreadContacts',
  },
] as const;
