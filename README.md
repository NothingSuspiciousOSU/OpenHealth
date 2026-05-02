# OpenHealth

OpenHealth is a Next.js app with Convex as the backend.

## Prerequisites

- Node.js 20 or newer
- pnpm
- A Convex account, or a GitHub account you can use to log in to Convex

If pnpm is not installed, enable it with Corepack:

```bash
corepack enable pnpm
```

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start Convex in one terminal:

```bash
pnpm exec convex dev
```

On the first run, Convex will ask you to log in and choose or create a project. After setup, it writes the deployment values to `.env.local`, including `NEXT_PUBLIC_CONVEX_URL`.

Keep this terminal running while you work. It watches files in `convex/`, syncs backend functions, and regenerates the typed API files in `convex/_generated/`.

Start Next.js in a second terminal:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seed Sample Data

The app currently reads tasks from the Convex `tasks` table. To add the sample tasks used by the starter screen, run this after `pnpm exec convex dev` has connected successfully:

```bash
pnpm exec convex import --table tasks sampleData.jsonl
```

Only run the import once per Convex deployment unless you intentionally want duplicate sample rows.

## Convex Project Notes

- Backend schema lives in `convex/schema.ts`.
- Backend functions live in `convex/`, such as `convex/tasks.ts`.
- The frontend Convex provider is in `app/ConvexClientProvider.tsx`.
- The task list calls `api.tasks.get` from `app/page.tsx`.
- Do not commit `.env.local`; each teammate should create their own local Convex deployment config by running `pnpm exec convex dev`.

## Useful Commands

```bash
pnpm lint
pnpm build
pnpm exec convex dev
pnpm exec convex codegen
```
