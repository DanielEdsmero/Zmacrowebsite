# Z Macro

Macro download site. Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Postgres, Auth, Storage). Deploys to Vercel.

- Public home grid of published macros.
- Public detail page with screenshots + signed-URL downloads.
- Single-admin backend (gated by `ADMIN_EMAIL`) for CRUD + uploads.
- Download counter + `download_logs` table for basic analytics.

Active visual theme is pinned in `lib/theme.ts` (currently `cyber-terminal` — black background, lime-green mono, CRT scanlines on hero).

---

## 1. Local setup

```bash
npm install
```

## 2. Create a Supabase project

1. Go to <https://supabase.com>, create a new project.
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret; server-only)

## 3. Run the SQL migration

Open **SQL Editor** in the Supabase dashboard, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. This creates:

- `macros` table (with the schema from the spec + an `updated_at` trigger)
- `download_logs` table
- `increment_download_count(p_macro_id uuid)` RPC used by the download route
- RLS policies: public can `SELECT` rows where `published = true`; all other access goes through the service-role key server-side.

## 4. Create storage buckets

In **Storage**, create three buckets:

| Bucket        | Public? | Purpose                                 |
| ------------- | ------- | --------------------------------------- |
| `covers`      | **Yes** | Cover images shown on cards and detail  |
| `screenshots` | **Yes** | Detail-page gallery images              |
| `files`       | **No**  | The actual macro binaries (signed URLs) |

## 5. Create the admin user

In **Authentication → Users**, click **Add user** → **Create new user**, and
set an email + password. Use that email in `ADMIN_EMAIL` below. Any other
signed-in email is rejected by the admin layout.

## 6. Configure environment

Copy `.env.example` → `.env.local` and fill in the four values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=you@example.com
```

## 7. Run

```bash
npm run dev
```

Visit <http://localhost:3000>.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import Project** → pick the repo.
3. Framework preset is auto-detected as Next.js.
4. Set the four env vars from step 6 under **Environment Variables**.
5. Deploy.

The `experimental.serverActions.bodySizeLimit` is set to `50mb` in
`next.config.js` so macro binaries can be uploaded through the admin form.
For larger files, upload directly via the Supabase Storage dashboard and set
the macro's `file_path` manually.

---

## Smoke-test checklist

- [ ] `/` renders with the hero, scanlines, and an empty grid.
- [ ] `/admin` redirects to `/admin/login` when signed out.
- [ ] Logging in with a non-admin email signs out and shows `NOT AUTHORIZED`.
- [ ] Logging in with the admin email lands on the dashboard.
- [ ] Creating a macro with cover, screenshots, a `.zip`, and `published = true` works.
- [ ] The macro appears on `/`, clicking it shows the detail page.
- [ ] Clicking the Download button on the detail page triggers a file download.
- [ ] `macros.download_count` increments and a row appears in `download_logs`.
- [ ] Unchecking Published hides the macro from `/` but it is still in the admin dashboard.
- [ ] Delete removes the macro from the dashboard.
- [ ] Responsive at 375 / 768 / 1280 px.

---

## Repo layout

```
app/
  page.tsx                      # public home grid
  layout.tsx                    # root layout + mono font
  globals.css                   # tailwind + CRT scanline CSS
  macro/[slug]/page.tsx         # public detail page
  api/download/[id]/route.ts    # signed-URL + log + increment
  admin/
    login/page.tsx              # login form (client)
    logout/route.ts             # POST signOut + redirect
    (protected)/                # auth-gated group
      layout.tsx                # session + ADMIN_EMAIL check
      page.tsx                  # dashboard list
      macro/
        actions.ts              # server actions: create/update/delete
        new/page.tsx
        [id]/edit/page.tsx
components/
  Nav.tsx, ScanlineOverlay.tsx
  MacroCard.tsx, DownloadButton.tsx, MacroForm.tsx
lib/
  theme.ts                      # THEME = "cyber-terminal"
  types.ts, slug.ts
  supabase/server.ts            # cookie-based server client
  supabase/client.ts            # browser client
  supabase/admin.ts             # service-role client (server-only)
middleware.ts                   # refreshes session cookie
supabase/migrations/0001_init.sql
```
