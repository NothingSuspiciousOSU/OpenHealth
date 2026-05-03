# OpenHealth 🏥
### *Medical billing is purposefully confusing.*

OpenHealth is a medical bill transparency platform that helps users search for and compare procedure and CPT prices across insurance providers, locations, hospitals, and other billing factors.

---

## ✨ Features
- **CPT Price Search:** Compare medical costs by description or CPT code across hospitals and insurers.
- **Advanced Filtering:** Narrow results by provider, plan, location, and date with smart sorting.
- **Cost Insights:** Interactive charts, price distributions, and trending procedure analytics.
- **Personalized Estimates:** Save insurance profiles to estimate deductibles and out-of-pocket costs.
- **Community Contribution:** Upload and auto-extract bill details from PDFs/images via AI.
- **AI Bill Chat:** Chat with your bill to decode charges, CPT codes, and negotiation points.
- **Agentic Data Tools:** AI agent queries real-time data for bounded cost comparisons and research.
- **Admin Controls:** Secure tools for database hydration, synthetic data, and maintenance.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or newer
- A Convex account (or GitHub to log in)

### Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Convex in one terminal:**
   ```bash
   npx convex dev
   ```
   *On the first run, Convex will ask you to log in and create a project. This writes `.env.local`.*

3. **Start Next.js in a second terminal:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Seed Sample Data
After `npx convex dev` is connected, run:
```bash
npx convex import --table procedures sampleData.jsonl
```

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 15+, Tailwind CSS, Recharts
- **Backend:** Convex (Real-time Database & Functions)
- **AI:** NVIDIA NIM, Google Gemini
- **Storage:** UploadThing

## 🏗️ Commands
```bash
npm run lint      # Run ESLint
npm run build     # Production build
npx convex dev    # Backend dev server
npx convex dashboard # View your data
```
