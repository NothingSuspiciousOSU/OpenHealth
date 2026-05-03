# OpenHealth

OpenHealth is a medical bill transparency site that helps users search for
and compare procedure and CPT prices across insurance providers, locations,
hospitals, and other billing factors.

## Features

- **Procedure and CPT price search**: Search medical procedures by plain-language description or CPT code, then compare billed and allowed amounts across hospitals, locations, insurers, and plans.
- **Advanced filtering and sorting**: Narrow results by insurance provider, plan, state, city, hospital, and procedure date, then sort by relevance, lowest price, or highest price.
- **Cost insights**: View result-level price details, average cost by provider, cost distribution charts, trending procedures, and expanded CPT line items.
- **Personalized insurance estimates**: Save an insurance profile with plan, deductible, copay, coinsurance, and out-of-pocket details to prioritize matching results and estimate likely patient cost.
- **Community bill contribution flow**: Upload PDF or image bills, auto-extract procedure details, review or correct the parsed fields, and submit procedures with CPT line items to the Convex database.
- **AI bill chat**: Attach a bill PDF and ask questions about charges, CPT codes, allowed amounts, comparison data, negotiation points, insurer questions, or call scripts.
- **Price-data agent tools**: The chat agent can query OpenHealth procedure and line-item data, run bounded aggregate comparisons, and use web research for public billing terminology or CPT context.
- **Admin data controls**: Password-gated admin tools can generate synthetic demo procedure data or purge existing procedure and line-item records.

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

## Environment Variables

Copy `.env.local.example` to `.env.local` for local development. For
production, use `.env.production.example` as the checklist for your hosting
provider and Convex production deployment.

Core app data depends on Convex. AI, document parsing, external research, file
upload, and admin-only data controls also use these environment-backed services
when their corresponding features are enabled:

- Convex deployment values, including `NEXT_PUBLIC_CONVEX_URL`
- `OPENROUTER_API_KEY`
- Optional OpenRouter model overrides: `PDF_CONTEXT_MODEL`, `NEMOTRON_MODEL`
- `TAVILY_API_KEY`
- `AGENT_READ_TOKEN`
- `NIM_SECRET`
- `UPLOADTHING_TOKEN`
- `ADMIN_PAGE_PASSWORD`

Do not commit `.env.local`; each teammate should create their own local Convex
deployment config by running `npx convex dev`.

## Seed Sample Data

Use the password-gated admin page to generate synthetic demo procedure data or
purge existing procedure and line-item records. The same mock data generator is
implemented by the Convex `mockData.generate` mutation.

## Convex Project Notes

- Backend schema lives in `convex/schema.ts`.
- Backend functions live in `convex/`.
- The frontend Convex provider is in `app/ConvexClientProvider.tsx`.
- Procedure and line-item records are stored in the Convex `procedures` and
  `procedureLineItems` tables.

## Useful Commands

```bash
npm run lint
npm run build
npx convex dev
npx convex codegen
```
