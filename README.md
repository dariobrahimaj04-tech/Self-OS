# SelfOS

SelfOS is a private, full-stack personal self-improvement MVP built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, Neon/PostgreSQL, Better Auth, Recharts, and Zod.

## Features

- Email/password signup, login, logout, session handling, and protected routes.
- Private user-scoped data for dashboard, check-ins, fitness, nutrition, mood, journal, habits, goals, learning, finance, analytics, and settings.
- Evidence-based fitness planner with weekly volume, RIR, MEV/MAV/MRV zones, recovery feedback, deload logic, and exercise quality scoring.
- Nutrition, mood, habit, goal, learning, finance, and workout CRUD with Zod validation.
- Dark-mode-first responsive dashboard UI with sidebar navigation, charts, tables, forms, empty states, and mobile drawer navigation.
- Rule-based AI Coach placeholder. No AI API is called by default.
- Safe seed strategy: global exercises are shared; demo tracker data is attached only to the demo user.

## Environment Variables

Create `.env.local` from `.env.example`.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
BETTER_AUTH_SECRET="replace-with-secure-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a strong auth secret before deploying:

```bash
pnpm dlx auth@latest secret
```

`DATABASE_URL`, `BETTER_AUTH_SECRET`, and production URLs must come from environment variables. Do not commit real credentials. `.env`, `.env.local`, and `.env*.local` are ignored.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure a local PostgreSQL or Neon database and set the environment variables above.

3. Apply migrations and generate Prisma Client:

   ```bash
   pnpm exec prisma migrate dev
   pnpm prisma:generate
   ```

4. Seed global exercises and demo-user data:

   ```bash
   pnpm db:seed
   ```

5. Run the app:

   ```bash
   pnpm dev
   ```

Open `http://localhost:3000`, create an account, and SelfOS will keep your tracker data scoped to that account.

## Useful Commands

```bash
pnpm run typecheck
pnpm run lint
pnpm exec prisma validate
pnpm run build
pnpm exec prisma migrate deploy
pnpm db:seed
```

## Deployment

1. Push the repo to GitHub.
2. Create a Vercel project from the repository.
3. Add `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL` in Vercel Project Settings.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the deployed Vercel URL.
5. Apply database migrations:

   ```bash
   pnpm exec prisma migrate deploy
   ```

6. Deploy with the default build command:

   ```bash
   pnpm run build
   ```

`postinstall` runs `prisma generate`, so the Prisma Client is available during Vercel builds.

If you already created tables with `prisma db push` before migrations existed, baseline that database before using `prisma migrate deploy`, or use a fresh Neon branch for the first migration-backed deployment.

## Privacy Model

All private API routes require an authenticated Better Auth session. Prisma reads and writes are scoped by `userId`, and update/delete operations verify ownership before mutating records. Exercise records are global shared reference data; meals, workouts, journals, habits, goals, finance records, learning logs, check-ins, insights, and settings surfaces are private to the logged-in user.

## Safety Notes

SelfOS is an educational planning and tracking tool. It does not provide medical advice. Pain, injuries, medical conditions, major diet changes, or major financial decisions should be discussed with qualified professionals. Fitness recommendations are conservative by design: pain or poor recovery reduces volume or suggests substitutions rather than encouraging users to push through.
