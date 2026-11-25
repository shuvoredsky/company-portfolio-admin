import type { Metadata } from 'next';
import { BlogsManager } from './BlogsManager';

export const metadata: Metadata = {
  title: 'Blogs',
};

export default function BlogsPage() {
  return <BlogsManager />;
}
