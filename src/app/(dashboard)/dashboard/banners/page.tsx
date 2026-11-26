import type { Metadata } from 'next';
import { BannersManager } from './BannersManager';

// Auth is client-side via RequireAuth; opt out of Next.js instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: 'Banners',
};

export default function BannersPage() {
  return <BannersManager />;
}

