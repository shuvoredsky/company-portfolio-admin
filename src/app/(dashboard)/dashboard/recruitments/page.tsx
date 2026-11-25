import type { Metadata } from 'next';
import { Briefcase } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata: Metadata = {
  title: 'Recruitment',
};

export default function RecruitmentsPlaceholderPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Recruitment"
        description="Publish and manage open positions."
      />
      <EmptyState
        icon={Briefcase}
        title="Coming in the next step"
        description="Recruitment post management with active status toggles will be implemented in Prompt 3."
      />
    </section>
  );
}

