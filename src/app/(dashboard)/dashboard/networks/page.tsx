import type { Metadata } from 'next';
import { NetworksManager } from './NetworksManager';

// Auth is client-side via RequireAuth; opt out of Next.js instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: 'Networks',
};

export default function NetworksPage() {
  return <NetworksManager />;
}

