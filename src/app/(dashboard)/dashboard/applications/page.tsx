import type { Metadata } from 'next';
import { ApplicationsManager } from './ApplicationsManager';

// Auth is client-side via RequireAuth; opt out of Next.js instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: 'Applications',
};

export default function ApplicationsPage() {
  return <ApplicationsManager />;
}

