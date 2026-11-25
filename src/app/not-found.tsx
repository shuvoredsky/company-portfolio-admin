import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <FileQuestion className="h-6 w-6" aria-hidden="true" />
          </span>
          <CardTitle className="mt-2 text-2xl">Page not found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

