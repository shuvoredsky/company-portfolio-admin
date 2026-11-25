import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata: Metadata = {
  title: 'Blogs',
};

export default function BlogsPlaceholderPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Blogs"
        description="Create and manage company blog posts."
      />
      <EmptyState
        icon={FileText}
        title="Coming in the next step"
        description="Blog management with search, pagination, and Cloudinary images will be implemented in Prompt 3."
      />
    </section>
  );
}

