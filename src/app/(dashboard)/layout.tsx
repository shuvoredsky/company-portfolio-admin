import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/common/RequireAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';

// Auth is enforced client-side via RequireAuth, so dashboard segments cannot be instantly prerendered.
export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
