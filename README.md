# Smart Farmer Assistant 🌾

Bilingual (English + தமிழ்) AI-powered farming assistant for Tamil Nadu smallholder farmers. Built with TanStack Start + React 19 + Tailwind v4 + Lovable Cloud (Supabase) + Lovable AI Gateway.

## Features

1. Farmer Auth (Email + Google)
2. Farmer Profile
3. Land Management (soil, water source, area)
4. AI Crop Planning (season + soil based recommendations)
5. Weather Monitoring (7-day forecast + AI farming advice)
6. Irrigation Planner (crop stage aware)
7. Fertilizer Advisor (NPK + staged plan)
8. Disease & Pest Detection (photo → AI vision)
9. Harvest Prediction (yield + window + risks)
10. Market Price Analysis (mandi prices)
11. Expenses & Sales tracking
12. Profit/Loss Reports
13. Bilingual AI Chatbot (streaming)

---

## Run in VS Code (Local Setup)

### 1. Prerequisites

- **Node.js 20+** → https://nodejs.org
- **Bun** (recommended) → https://bun.sh  (or use `npm`)
- **VS Code** → https://code.visualstudio.com
  - Recommended extensions: ESLint, Prettier, Tailwind CSS IntelliSense

### 2. Clone / Open

```bash
git clone <your-repo-url> smart-farmer-assistant
cd smart-farmer-assistant
code .
```

### 3. Install dependencies

```bash
bun install
# or
npm install
```

### 4. Environment variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Lovable Cloud (Supabase) — required
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"

SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"

# Lovable AI Gateway — required for AI features
LOVABLE_API_KEY="your-lovable-api-key"
```

> When you use this project inside Lovable, these values are injected automatically. For local VS Code runs, copy them from your Lovable project (Cloud → Settings) or from your own Supabase project.

### 5. Run the dev server

```bash
bun run dev
# or
npm run dev
```

Open http://localhost:8080

### 6. Build for production

```bash
bun run build
bun run preview
```

---

## Project Structure

```
src/
├── routes/                     # File-based routing (TanStack Router)
│   ├── __root.tsx              # Root layout (head, providers)
│   ├── index.tsx               # Landing page
│   ├── auth.tsx                # Login / Signup
│   ├── _authenticated/         # Protected routes (require login)
│   │   ├── route.tsx           # Auth gate
│   │   ├── dashboard.tsx       # Main dashboard (12 feature tiles)
│   │   ├── profile.tsx
│   │   ├── land.tsx
│   │   ├── crop-planning.tsx
│   │   ├── weather.tsx
│   │   ├── irrigation.tsx
│   │   ├── fertilizer.tsx
│   │   ├── disease.tsx
│   │   ├── harvest.tsx
│   │   ├── market.tsx
│   │   ├── expenses.tsx
│   │   ├── reports.tsx
│   │   └── chatbot.tsx
│   └── api/
│       └── chat.ts             # Streaming chat endpoint
├── lib/
│   ├── i18n.tsx                # English + Tamil translations
│   ├── ai-gateway.server.ts    # Lovable AI provider
│   ├── crop-advice.functions.ts
│   ├── weather-advice.functions.ts
│   ├── disease-detect.functions.ts
│   ├── fertilizer-advice.functions.ts
│   ├── harvest-predict.functions.ts
│   └── market-price.functions.ts
├── integrations/supabase/      # Auto-generated Supabase client
├── components/                 # Reusable UI (shadcn)
└── styles.css                  # Tailwind v4 + design tokens
```

---

## Tech Stack

- **Framework:** TanStack Start v1 (React 19, SSR)
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Backend:** Lovable Cloud (Supabase — Postgres, Auth, Storage, RLS)
- **AI:** Lovable AI Gateway (Google Gemini via OpenAI-compatible API)
- **Weather:** Open-Meteo (free, no key)
- **Language:** TypeScript strict, i18n (English + Tamil)

---

## User Flow

```
Landing → Register / Login → Dashboard
   ↓
Add Land Details → Soil Analysis
   ↓
Crop Recommendation → Planting Schedule
   ↓
Weather Monitoring → Irrigation Management
   ↓
Fertilizer Recommendation → Disease & Pest Detection
   ↓
Harvest Prediction → Market Price Analysis
   ↓
Expenses / Sales → Profit / Loss Report
```

---

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Start dev server on `http://localhost:8080` |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier format all files |

---

## Troubleshooting

- **`Missing LOVABLE_API_KEY`** → add it to your `.env` (see step 4).
- **Auth redirects to `/auth` loop** → make sure `VITE_SUPABASE_*` values are correct.
- **Port 8080 in use** → change `server.port` in `vite.config.ts`.
- **Tamil fonts not showing** → `@fontsource/noto-sans-tamil` is already installed; just re-run `bun install`.

Happy farming! 🚜
