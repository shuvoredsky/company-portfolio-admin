import type { Metadata } from 'next';
import { BannersManager } from './BannersManager';

export const metadata: Metadata = {
  title: 'Banners',
};

export default function BannersPage() {
  return <BannersManager />;
}

