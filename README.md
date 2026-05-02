# OpenHealth

OpenHealth is a Next.js app with Convex as the backend.

## Prerequisites

- Node.js 20 or newer
- A Convex account, or a GitHub account you can use to log in to Convex

## Local Setup

Install dependencies:

```bash
npm install
```

Start Convex in one terminal:

```bash
npx convex dev
```

On the first run, Convex will ask you to log in and choose or create a project. After setup, it writes the deployment values to `.env.local`, including `NEXT_PUBLIC_CONVEX_URL`.

Keep this terminal running while you work. It watches files in `convex/`, syncs backend functions, and regenerates the typed API files in `convex/_generated/`.

Start Next.js in a second terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seed Sample Data

The app currently reads tasks from the Convex `tasks` table. To add the sample tasks used by the starter screen, run this after `npx convex dev` has connected successfully:

```bash
npx convex import --table tasks sampleData.jsonl
```

Only run the import once per Convex deployment unless you intentionally want duplicate sample rows.

## Convex Project Notes

- Backend schema lives in `convex/schema.ts`.
- Backend functions live in `convex/`, such as `convex/tasks.ts`.
- The frontend Convex provider is in `app/ConvexClientProvider.tsx`.
- The task list calls `api.tasks.get` from `app/page.tsx`.
- Do not commit `.env.local`; each teammate should create their own local Convex deployment config by running `npx convex dev`.

## Useful Commands

```bash
npm run lint
npm run build
npx convex dev
npx convex codegen
```
