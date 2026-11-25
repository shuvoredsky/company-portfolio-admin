import type { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata: Metadata = {
  title: 'Contact Messages',
};

export default function ContactsPlaceholderPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Contact Messages"
        description="Review and manage visitor inquiries."
      />
      <EmptyState
        icon={Mail}
        title="Coming in the next step"
        description="Contact inbox with read/unread filters, search, and detail view will be implemented in Prompt 4."
      />
    </section>
  );
}

