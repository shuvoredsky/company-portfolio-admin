# Company Portfolio — Admin Dashboard (`company-admin`)

Next.js (App Router) + TypeScript + Tailwind CSS v4 admin panel for managing banners, blogs, recruitments, and contact inquiries.

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
