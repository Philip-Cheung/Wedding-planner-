# Wedding Planner

A personal-use wedding planner application with a clear planning journey, flexible views, and a premium website CMS.

## Stack

- **Frontend:** Vite + React + TypeScript
- **UI:** Tailwind CSS + Radix + custom design system
- **Backend:** Supabase
- **Hosting:** Vercel
- **Email:** Resend

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   ```
   Add your Supabase URL and anon key to `.env`.

3. **Shadcn blocks** (optional – if scaffolding UI)
   ```bash
   npm run shadcn:dashboard
   npm run shadcn:login
   ```

4. **Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run migrations: `supabase db push` (or apply `supabase/migrations/00001_initial_schema.sql` manually)

5. **Run**
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run test:run` - Run unit tests
- `npm run test:e2e` - Run E2E tests (Playwright)
- `npm run shadcn:dashboard` - Add dashboard-01 block
- `npm run shadcn:login` - Add/refresh login-02 block

## Project Structure

```
src/
  app/          - App shell, routing
  features/     - Auth, onboarding, planning, guests, messaging, website
  design-system/- Tokens, theme, components
  lib/          - Utilities, Supabase client
  test/         - Test setup
```

## Build Plan

See [wedding_planner_v_1_build_plan.md](https://github.com/Philip-Cheung/Wedding-planner-) for the full V1 scope and phases.
