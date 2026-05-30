# Missions — Quest System

Personal goal-planning system with a Pip-Boy phosphor-terminal aesthetic. PWA installable, Supabase-backed, real-time synced across devices.

**Model:** one self-referential `items` table. **Quests** (high-level) own **Missions** (the work). Missions are recursive — a mission's parent can be its quest (top-level) or another mission (nested, any depth). Every mission stores both its immediate `parent_id` and its owning root `quest_id`.

**Views:**
- **Weekly** — day-column time-slot planner; quick-add creates a mission under the selected quest. Completed missions stay (checked/dimmed).
- **Missions** — flat list of *active* missions across all quests; completing one removes it from this list only. Each row badges its owning quest.
- **Quests** — two-pane Pip-Boy quest log: selectable quest list (Active / History filter) on the left, the selected quest's threaded mission tree on the right.

**Cascade rules:** completing a quest completes all its missions then archives the quest; completing a mission completes its whole subtree (not the parent/quest); deletes cascade through the subtree. All actions are immediate — no confirmations.

---

## Local dev setup

```bash
cd missions
npm install
cp .env.example .env   # then fill in Supabase credentials (see below)
npm run dev            # → http://localhost:5173
```

### Environment variables

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon (public) key |

---

## Supabase setup (one-time)

### 1. Create a project

Go to [supabase.com](https://supabase.com), create a new project. Note the URL and anon key.

### 2. Create a user account for yourself

Supabase Dashboard → Authentication → Users → Add user  
Enter your email and password. This is the single account that gates the app.

### 3. Run the migration in the SQL Editor

Open [`migrations/0001_quests_and_missions.sql`](migrations/0001_quests_and_missions.sql), copy its **entire contents**, paste into the Supabase SQL Editor, and **Run**.

It creates the self-referential `items` table (with shape constraints), the per-user RLS policies, the `updated_at` trigger, the `complete_subtree` and `complete_quest` cascade functions, and enables Realtime on `items`. It also drops the old placeholder `tasks` table.

> If the Supabase CLI is linked (`supabase link`), you can instead run `supabase db push` from the repo to apply everything in `migrations/`.

After running it, **create your first quest** in the Quests view — the Weekly quick-add stays disabled until at least one quest exists (a mission must belong to a quest).

---

## Cloudflare Pages deployment

### Build settings (set in the Pages dashboard)

| Setting | Value |
|---|---|
| Framework preset | None (manual) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `missions` (if repo root is the parent `Coding/` folder) |
| Node.js version | 18 or 20 |

### Environment variables (set in Pages → Settings → Environment variables)

Add these to both **Production** and **Preview** environments:

```
VITE_SUPABASE_URL      = https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
```

### Custom domain

Pages → Custom domains → `missions.laertleba.com`  
Add the CNAME record Cloudflare shows you to your DNS.

---

## Backup & restore

- **Export** (toolbar → ↓ Export) saves a `missions-backup-YYYY-MM-DD.json` containing all quests and missions (schema v2).
- **Import** (toolbar → ↑ Import) reads that file, remaps IDs (preserving the quest/mission tree), and inserts parents-before-children. Choose **Replace All** to wipe first, or **Merge** to append.

---

## Installing to your Android home screen

Once deployed to `missions.laertleba.com`:

1. Open Chrome on your Android phone and navigate to the URL.
2. Sign in once — the session persists.
3. Tap the **⋮ menu** → **Add to Home screen** → **Add**.
4. The app icon appears on your home screen. Tap it — it launches fullscreen, no browser chrome.

Chrome may also show an automatic "Add to Home screen" banner after a few visits.

---

## PWA icon sizes

The existing 192×192 and 512×512 icons from the old app are reused. If you want to replace them with custom artwork, provide:

- `public/icons/icon-192.png` — 192×192 px
- `public/icons/icon-512.png` — 512×512 px

Use a square design with at least 20px safe-zone padding so it looks good as a maskable icon on Android adaptive icon systems.
