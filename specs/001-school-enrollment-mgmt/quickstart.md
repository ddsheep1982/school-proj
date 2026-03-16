# Quickstart: Local Development Setup

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally
- npm

## Steps

### 1. Clone and install

```bash
git clone <repo>
cd school-proj
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/school_mgmt?schema=public"
NEXTAUTH_SECRET="a-random-secret-at-least-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
```

> The `.env` file is used by Prisma CLI. `.env.local` is used by Next.js at runtime.
> Both should have the same `DATABASE_URL`.

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE school_mgmt;"
```

### 4. Run migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables, indexes, and constraints from `prisma/schema.prisma`.

### 5. Seed the database

```bash
npx ts-node --project tsconfig.json prisma/seed.ts
```

This creates:
- **Admin**: `admin@school.com` / `admin123456`
- **Staff**: `staff@school.com` / `staff123456`
- 3 classes, 2 teachers, 2 agents, 10 students in mixed statuses
- 1 sample payment record

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

### 7. Run tests

```bash
# Unit tests (no DB required)
npm run test:unit

# Integration tests (requires test DB — set DATABASE_URL in .env.test)
npm run test:integration
```

## Project Structure

```
school-proj/
├── prisma/               # Schema + migrations + seed
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/login/ # Public login page
│   │   └── (dashboard)/  # All authenticated pages
│   ├── actions/          # Server Actions ("use server")
│   ├── components/       # React components
│   ├── lib/              # prisma.ts, auth.ts, audit.ts, dashboard.queries.ts
│   └── types/            # Zod schemas + TypeScript types
├── __tests__/            # Jest tests
│   ├── unit/             # Schema and utility tests (no DB)
│   └── integration/      # Action tests (require test DB)
└── .env.local            # Local secrets (not committed)
```

## Default Accounts

| Email | Password | Role |
|---|---|---|
| admin@school.com | admin123456 | Admin (full access) |
| staff@school.com | staff123456 | Staff (no delete/config) |
