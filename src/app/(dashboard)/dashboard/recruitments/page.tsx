import type { Metadata } from 'next';
import { RecruitmentsManager } from './RecruitmentsManager';

export const metadata: Metadata = {
  title: 'Recruitment',
};

export default function RecruitmentsPage() {
  return <RecruitmentsManager />;
}
