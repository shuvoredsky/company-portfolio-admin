import type { Metadata } from 'next';
import { DashboardOverview } from './DashboardOverview';

// Auth is client-side via RequireAuth; opt out of Next.js instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
