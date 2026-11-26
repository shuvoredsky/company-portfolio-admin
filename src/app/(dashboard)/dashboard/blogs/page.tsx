import type { Metadata } from 'next';
import { BlogsManager } from './BlogsManager';

// Auth is client-side via RequireAuth; opt out of Next.js instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: 'Blogs',
};

export default function BlogsPage() {
  return <BlogsManager />;
}
