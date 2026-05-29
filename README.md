# Missions — Weekly Task Planner

Personal weekly time-slot planner. PWA installable, Supabase-backed, syncs across devices.

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

### 3. Run this SQL in the SQL Editor

```sql
-- ─── Schema ───────────────────────────────────────────────────
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_str    TEXT NOT NULL,          -- 'YYYY-MM-DD'
  title       TEXT NOT NULL DEFAULT '',
  duration    INT  NOT NULL DEFAULT 30,   -- minutes
  start_time  INT  NOT NULL DEFAULT 540,  -- minutes from midnight
  end_time    INT  NOT NULL DEFAULT 570,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  position    INT  NOT NULL DEFAULT 0,    -- sort order within a day
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tasks_user_date ON tasks (user_id, date_str);

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own tasks" ON tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update own tasks" ON tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete own tasks" ON tasks
  FOR DELETE USING (user_id = auth.uid());

-- ─── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Enable Realtime (cross-device live sync) ─────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

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

## Migrating existing tasks from the old app

1. Open the old `Weekly Schedule Personal.html` app.
2. Toolbar → **↓ Export** — saves `tasks-backup-YYYY-MM-DD.json`.
3. Open the new Missions app, sign in.
4. Toolbar → **↑ Import** → select the JSON file → choose **Replace All** (clean start) or **Merge**.

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
