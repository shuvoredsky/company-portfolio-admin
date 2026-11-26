import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader } from '@/components/common/Loader';
import { ContactsManager } from './ContactsManager';

// Auth is client-side via RequireAuth; opt out of Next.js instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: 'Contact Messages',
};

export default function ContactsPage() {
  return (
    <Suspense fallback={<Loader label="Loading messages..." />}>
      <ContactsManager />
    </Suspense>
  );
}
