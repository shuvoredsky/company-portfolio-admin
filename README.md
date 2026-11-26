# Company Portfolio — Admin Dashboard (`company-admin`)

Next.js (App Router) + TypeScript + Tailwind CSS v4 admin panel for managing banners, blogs, partner networks, recruitments, and contact inquiries. Features a single-button Light/Dark theme toggle (defaulting to OS preference on first visit with zero flash).

See [PLAN.md](./PLAN.md) for the full architecture and roadmap.

## Getting Started

1. Ensure the backend server (`../company-server`) is running on `http://localhost:5000`.
2. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```
3. Run the development server on port **3001**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001).

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the `company-server` v1 API | `http://localhost:5000/api/v1` |

## Available Scripts

- `npm run dev` — Start dev server on port `3001`
- `npm run build` — Production build (`next build`)
- `npm start` — Start production server on port `3001`
- `npm run lint` — Run ESLint

## Mini-Guide: How to Rename the Company

Edit **only** `src/config/site.ts`:
```ts
export const siteConfig = {
  brandName: 'Your Agriculture Co.',
  brandShortName: 'YA',
  adminTitle: 'Admin Panel',
  tagline: 'Your tagline here.',
  description: 'Your description here.',
} as const;
```
Every page `<title>`, navbar brand, login page, and metadata updates automatically. To swap the text/icon logo for an image later, follow the comment at the top of `src/components/common/Brand.tsx`.

## Mini-Guide: How to Change Brand Colors

Edit **only** the `BRAND COLORS - EDIT HERE` block at the top of `src/app/globals.css`:
```css
:root {
  --brand-primary: #14532d;
  --brand-secondary: #ecfdf5;
}

.dark {
  --brand-primary: #4ade80;
  --brand-secondary: #102a1d;
}
```
All accents, borders, focus rings, muted surfaces, and buttons derive automatically from these two variables in both light and dark modes.


## Deployment (Vercel)

### Environment Variables
- `NEXT_PUBLIC_API_URL` — Full HTTPS base URL of the deployed backend API (e.g., `https://api.example.com/api/v1`).

### Build & Start Commands
- **Build:** `npm run build`
- **Start:** `npm start` (port `3001` locally; Vercel manages ports automatically)

### Backend CORS & Cookie Requirements
1. On `company-server`, add the deployed admin origin (e.g., `https://admin.example.com`) to `ADMIN_URL` (comma-separated origins supported for preview deployments).
2. Both the admin frontend and the backend API **must run on HTTPS** in production because `accessToken` is issued with `HttpOnly; Secure; SameSite=None`.
3. **Important — Shared Parent Domain Recommendation:** If the admin app and API are hosted on completely different registrable domains (for example `my-admin.vercel.app` and `my-api.onrender.com`), modern browsers with strict third-party cookie blocking (Safari ITP, Firefox ETP, Chrome privacy modes) can block the `accessToken` cookie and break login. For reliable production sessions, deploy both under a **shared parent domain** (e.g., `admin.example.com` and `api.example.com`).
