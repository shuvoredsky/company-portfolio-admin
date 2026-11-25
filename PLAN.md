# Company Portfolio Admin Dashboard (`company-admin`) — Plan

## 1. Purpose & Tech Stack
Admin dashboard for managing the **Company Portfolio** platform (banners, blogs, recruitment posts, and customer contact submissions), communicating with `company-server` (`/api/v1`).

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript (`strict: true`)
- **Styling:** Tailwind CSS v4 + CSS custom properties (semantic design tokens)
- **Theme:** `next-themes` (`light`, `dark`, `system`, class-based, zero-flash)
- **Data Fetching:** `@tanstack/react-query` + typed `fetch` wrapper
- **Forms & Validation:** `react-hook-form` + `zod` + `@hookform/resolvers`
- **Icons & Notifications:** `lucide-react`, `sonner`
- **Dev/Start Port:** `3001` (`http://localhost:3001`)

---

## 2. Folder Structure
```text
src/
├── app/
│   ├── layout.tsx                    # Root layout, Plus Jakarta Sans font, metadata, Providers
│   ├── globals.css                   # Single-place brand color variables & Tailwind v4 @theme
│   ├── page.tsx                      # Redirects "/" -> "/dashboard"
│   ├── not-found.tsx                 # 404 page
│   ├── error.tsx                     # Global error boundary
│   ├── (auth)/login/
│   │   ├── page.tsx                  # Login route metadata wrapper
│   │   └── LoginForm.tsx             # Responsive login form (RHF + Zod)
│   └── (dashboard)/
│       ├── layout.tsx                # RequireAuth + Navbar shell (sidebar added in Prompt 2)
│       └── dashboard/page.tsx        # Dashboard page
├── components/
│   ├── common/                       # Brand, ThemeToggle, Loader, RequireAuth, PageHeader, EmptyState, ErrorState, ConfirmDialog, ImageUpload, Pagination, SearchInput
│   ├── ui/                           # Button, Input, Label, Card, Spinner, FormField, Badge, Switch, Textarea, Skeleton, Modal
│   ├── layout/                       # Navbar, Sidebar, DashboardShell
│   └── providers/                    # Providers (Theme, QueryClient, Auth, Toaster)
├── config/
│   ├── site.ts                       # Single-place company branding config
│   ├── env.ts                        # Zod-validated NEXT_PUBLIC_API_URL
│   └── navigation.ts                 # Single-place sidebar navigation items
├── context/
│   └── AuthContext.tsx               # Client-side auth state via GET /auth/me
├── hooks/
│   ├── useAuth.ts
│   └── useDebouncedValue.ts          # 300ms debounce helper for search inputs
└── lib/
    ├── utils.ts                      # cn() helper (clsx + tailwind-merge)
    ├── queryKeys.ts                  # Centralized TanStack Query keys
    └── api/
        ├── types.ts                  # ApiResponse, ApiError, PaginationMeta, AdminUser, Banner, Blog, Recruitment, AdminStats
        ├── client.ts                 # Fetch wrapper (always credentials: 'include')
        ├── auth.ts                   # login, logout, getMe
        ├── stats.ts                  # getStats
        ├── banners.ts                # getAdminBanners, createBanner, updateBanner, deleteBanner
        ├── blogs.ts                  # getBlogs, getBlogById, createBlog, updateBlog, deleteBlog
        └── recruitments.ts           # getAdminRecruitments, createRecruitment, updateRecruitment, deleteRecruitment
```

---

## 3. Single-Place Configuration Rules

### Branding Rule (`src/config/site.ts`)
- All company names, short names, taglines, and titles MUST be imported from `src/config/site.ts`.
- Never hard-code the company name in pages, metadata, or components.
- Renaming the company requires editing **only** `src/config/site.ts`.

### Color System Rule (`src/app/globals.css`)
- All brand colors live in the `BRAND COLORS - EDIT HERE` block at the top of `src/app/globals.css` (`--brand-primary` and `--brand-secondary` for `:root` and `.dark`).
- All semantic tokens (`--primary`, `--secondary`, `--background`, `--card`, `--muted`, `--accent`, `--border`, `--ring`, etc.) derive from those variables and are mapped to Tailwind utilities via `@theme inline`.
- Components MUST use semantic Tailwind classes only (`bg-primary`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-destructive`, etc.). **Never** use raw hex values or Tailwind palette classes like `bg-green-700`.

---

## 4. Theme System
- `next-themes` configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`, and `suppressHydrationWarning` on `<html>` to eliminate flash on load.
- `<ThemeToggle />` provides accessible `Light` / `Dark` / `System` controls with a `useSyncExternalStore` mount guard to avoid hydration mismatches.

---

## 5. API Layer & Auth Architecture
- **API Wrapper (`src/lib/api/client.ts`):**
  - Every API call goes through `src/lib/api/*`.
  - Always passes `credentials: 'include'` so the browser sends/receives the HTTP-only `accessToken` cookie.
  - Sends JSON by default and leaves `Content-Type` unset for `FormData` uploads.
  - Normalizes backend `{ success, message, data, meta? }` and throws typed `ApiError(status, message, errorSources)`.
  - Exposes a 401 unauthorized callback so `AuthContext` clears session state and redirects to `/login` without loops.
- **Why Auth Protection is Client-Side:**
  - The `accessToken` cookie is `HttpOnly` and issued by the backend API domain. In production, Next.js middleware on the admin domain cannot read cookies scoped to the API domain.
  - `AuthContext` calls `GET /api/v1/auth/me` once via TanStack Query as the source of truth, and `<RequireAuth>` guards `(dashboard)` routes. No tokens or user records are ever stored in `localStorage`, `sessionStorage`, or readable cookies.

---

## 6. Coding Rules
- TypeScript `strict: true`, **no `any`**.
- Server Components by default; add `'use client'` only where interactivity/hooks are required.
- Responsive mobile-first layout (`320px`+), zero horizontal scroll, `min-h-dvh`, accessible focus rings, `prefers-reduced-motion` respected.

---

## 7. Admin Frontend Roadmap (4 Prompts)
| Prompt | Scope | Status |
| --- | --- | --- |
| **Prompt 1** | Setup, Branding/Color System, Theme, API Layer, AuthContext, Login Page, Navbar, Placeholder Dashboard | **Done** |
| **Prompt 2** | Dashboard Layout + Responsive Sidebar + Stats (`GET /admin/stats`) + Banner Management (CRUD + image upload) | **Done** |
| **Prompt 3** | Blog Management (CRUD + search + pagination + image) + Recruitment Management (CRUD + toggle active) | **Done** |
| **Prompt 4** | Contact Messages Inbox (filter/search/read/delete), Polish, Responsive/A11y QA, Final Report | Pending |

