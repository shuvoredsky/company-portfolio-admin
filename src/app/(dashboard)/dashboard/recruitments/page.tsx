import type { Metadata } from 'next';
import { RecruitmentsManager } from './RecruitmentsManager';

// Auth is client-side via RequireAuth; opt out of Next.js instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: 'Recruitment',
};

export default function RecruitmentsPage() {
  return <RecruitmentsManager />;
}
