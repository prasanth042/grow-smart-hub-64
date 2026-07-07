## Smart Farmer Assistant — Phased Build Plan

Building a full farmer-facing web app on Lovable's stack (TanStack Start + React + Tailwind + Lovable Cloud + Lovable AI). Bilingual **Tamil / English** with a language toggle. All backend runs on Lovable Cloud (no separate Node/MySQL server).

### Stack mapping (from your folder tree → Lovable)
- `.html` pages → React routes under `src/routes/`
- `css/*.css` → Tailwind + design tokens in `src/styles.css`
- `js/*.js` → React components / hooks
- `backend/` (Express + MySQL) → Lovable Cloud (Postgres + auth + storage + server functions)
- `database/*.sql` → Lovable Cloud migrations
- `uploads/plant-images/` → Lovable Cloud Storage bucket
- `admin/` → protected admin routes gated by an `admin` role in a `user_roles` table

### Phase 1 — Foundation (this turn)
1. Enable Lovable Cloud (auth, DB, storage).
2. Design system: warm agri palette (deep green, harvest gold, soil brown, cream) + Tamil-capable fonts (Noto Sans Tamil + Inter).
3. Bilingual i18n (Tamil / English toggle, saved per user).
4. Landing page (`/`) — hero, features, CTA.
5. Auth: farmer register / login / logout, password reset page.
6. `profiles` table (name, phone, village, district, preferred language) + `user_roles` table (`farmer` / `admin`) with `has_role()` security-definer function.
7. Protected farmer dashboard (`/_authenticated/dashboard`) with feature tiles for all 12 modules (placeholders for later phases).
8. Land management (`/_authenticated/land`): add / edit / delete land parcels (area, soil type, water source, location).

### Phase 2 — Crop & Weather
- Crop planning with **AI crop recommendation** (Lovable AI, structured output) based on soil + land + season.
- Planting schedule / calendar.
- Weather monitoring (Open-Meteo, no key needed) + AI-generated farming advice for the forecast.
- Irrigation planner.

### Phase 3 — Health & Yield
- **Disease & pest detection** (photo upload → Gemini vision → diagnosis + treatment, stored in DB with image in Storage).
- **Fertilizer advisor** (AI structured recommendation from crop + soil + growth stage).
- Harvest prediction.

### Phase 4 — Market, Finance, Reports
- Market price tracker (seed with common Tamil Nadu mandi crops; admin can update).
- Expenses tracker + profit/loss report (PDF export).
- Reports dashboard.
- **Farmer chatbot** (bilingual, uses profile + land + crop context).

### Phase 5 — Admin
- Admin login gate (role check).
- Manage farmers, crops, diseases library, market prices.
- Analytics dashboard.

### Technical notes
- Routes: TanStack file-based routing under `src/routes/`. Protected pages under `src/routes/_authenticated/`, admin under `src/routes/_authenticated/_admin/`.
- AI: Lovable AI Gateway, default `google/gemini-3-flash-preview` for chat/vision (multimodal), structured output via AI SDK for recommendations.
- Storage bucket `plant-images` (private, RLS by owner).
- Every table gets explicit `GRANT`s + RLS policies scoped to `auth.uid()`.
- SEO: distinct `head()` per public route, `sitemap.xml`, `robots.txt`, `llms.txt`.

### After you approve
I'll ship Phase 1 in the next turn (Cloud + auth + dashboard + land management + bilingual UI), then continue phase-by-phase. Each phase ends with a working, testable app.
