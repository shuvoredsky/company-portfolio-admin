'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Calendar,
  FileText,
  Pencil,
  Plus,
  SearchX,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { blogsApi } from '@/lib/api/blogs';
import { ApiError, Blog } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { BlogFormModal } from './BlogFormModal';

const PAGE_LIMIT = 9;

function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function BlogsManager() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [deletingBlog, setDeletingBlog] = useState<Blog | null>(null);

  const queryParams = {
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch.trim() || undefined,
  };

  const { data, isPending, isPlaceholderData, isError, error, refetch } =
    useQuery({
      queryKey: queryKeys.blogs.list(queryParams),
      queryFn: () => blogsApi.getBlogs(queryParams),
      placeholderData: keepPreviousData,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    });

  const blogs = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogsApi.deleteBlog(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Blog post deleted successfully');
      const wasLastOnPage = blogs.length === 1 && page > 1;
      setDeletingBlog(null);
      if (wasLastOnPage) {
        setPage((prev) => Math.max(1, prev - 1));
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.blogs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete blog post',
      );
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormOpen(true);
  };

  const isSearching = Boolean(debouncedSearch.trim());

  return (
    <section className="space-y-6">
      <PageHeader
        title="Blogs"
        description="Publish news, agricultural insights, and company updates."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Blog Post
          </Button>
        }
      />

      <div className="max-w-md">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search blogs by title..."
          ariaLabel="Search blogs by title"
        />
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load blog posts"
          message={
            error instanceof ApiError
              ? error.message
              : 'Could not fetch blog posts from the server.'
          }
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        isSearching ? (
          <EmptyState
            icon={SearchX}
            title="No matching blog posts"
            description={`No blog posts matched "${debouncedSearch.trim()}". Try a different keyword.`}
            action={
              <Button variant="outline" onClick={() => handleSearchChange('')}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="No blog posts yet"
            description="Create your first blog post to share news and expertise with visitors."
            action={
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Blog Post
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => (
              <Card
                key={blog._id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/9] w-full bg-muted">
                  <Image
                    src={blog.image.url}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
                  <div className="space-y-2">
                    <h2 className="line-clamp-2 text-base font-semibold text-card-foreground">
                      {blog.title}
                    </h2>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {blog.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDate(blog.createdAt)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(blog)}
                        aria-label={`Edit ${blog.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingBlog(blog)}
                        aria-label={`Delete ${blog.title}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              onPageChange={setPage}
              disabled={isPlaceholderData}
            />
          )}
        </>
      )}

      <BlogFormModal
        key={formOpen ? (editingBlog?._id ?? 'create') : 'closed'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        blog={editingBlog}
      />

      <ConfirmDialog
        open={Boolean(deletingBlog)}
        onClose={() => setDeletingBlog(null)}
        onConfirm={() => {
          if (deletingBlog) {
            deleteMutation.mutate(deletingBlog._id);
          }
        }}
        title="Delete blog post?"
        description={`Are you sure you want to delete "${deletingBlog?.title ?? ''}"? This action cannot be undone and its cover image will also be permanently removed from Cloudinary.`}
        confirmLabel="Delete Post"
        isLoading={deleteMutation.isPending}
      />
    </section>
  );
}
