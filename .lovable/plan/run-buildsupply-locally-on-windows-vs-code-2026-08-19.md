# Run BuildSupply locally on Windows (VS Code)

Analysis only — no app code changed. Findings first, then the exact steps.

## What the project is today

- **Framework:** TanStack Start v1 (React 19 + TanStack Router file routes in `src/routes`, TanStack Query for data).
- **Build system:** Vite 8 via `@lovable.dev/vite-tanstack-config` (already bundles the TanStack Start plugin, Tailwind v4, path aliases, Nitro for production builds).
- **Styling:** Tailwind CSS v4 through `src/styles.css` + shadcn/Radix components.
- **Package manager:** Bun (`bun.lock`, `bunfig.toml` present). npm also works but would generate a second lockfile.
- **Backend:** Supabase (Lovable Cloud project), accessed entirely from the browser client `src/integrations/supabase/client.ts`. No `createServerFn` calls exist in app code, so no service-role key is needed to run the app.
- **Database:** 4 SQL migrations in `supabase/migrations/` (profiles, user_roles, categories, materials, delivery_rules, orders, order_items, notifications, RLS policies, `admin_exists`/`claim_admin` RPCs) plus `supabase/config.toml`.
- **Auth:** Supabase email/password auth. `src/lib/auth-context.tsx` holds session + profile + admin flag; `src/routes/_authenticated/route.tsx` gates protected routes client-side; `/auth`, `/forgot-password`, `/reset-password`, `/claim-admin` handle the flows.

## Is it ready for local development?

Yes, essentially. Once the source and a `.env` are on your machine, `bun install` + `bun run dev` boots the same app. Nothing in the code assumes the Lovable sandbox.

### Missing / worth adding for a smooth local setup

1. `.env` is **not** listed in `.gitignore` — it should be, before you push this anywhere.
2. No `.env.example` documenting which variables are needed.
3. No `.vscode/extensions.json` recommendations (optional convenience).
4. README has no local-setup section for this specific project (optional).

### Files that would be created/changed (only after your approval)

| File | Change |
| --- | --- |
| `.gitignore` | add `.env` and `.env.*.local` |
| `.env.example` | new — variable names only, no values |
| `README.md` | new "Run locally on Windows" section |
| `.vscode/extensions.json` | optional — recommend ESLint, Prettier, Tailwind IntelliSense |

No application source, database, auth, or route files need to change.

## Exporting the source code

There is no ZIP export in the editor. The safe, complete way is **GitHub sync**:

1. In the Lovable editor, top-right → **GitHub** → **Connect to GitHub**, authorize, and create the repository.
2. Lovable pushes the full project (including `supabase/migrations`, excluding `node_modules`).
3. On Windows, clone it.

`.env` is currently tracked in the project, so the sync carries the Supabase URL and publishable key with it — those two are safe to expose (the publishable/anon key is designed for browsers and is protected by RLS). If you prefer a private repo anyway, make it private at creation.

## Windows commands

Install prerequisites once: [Git for Windows](https://git-scm.com/download/win), [Node.js LTS](https://nodejs.org), and Bun (`powershell -c "irm bun.sh/install.ps1 | iex"`).

```powershell
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
bun install
bun run dev
```

Open `http://localhost:8080` (the config sets the port; if it differs, use the URL the terminal prints). Then `code .` to open in VS Code.

npm alternative if you'd rather not install Bun:

```powershell
npm install
npm run dev
```

Production check: `bun run build` then `bun run preview`.

## Environment variables

Create `.env` in the project root (values come from the copy already in the project — never post them in chat or a public repo):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
```

The `VITE_` pair is what the browser client reads; the unprefixed pair is the SSR fallback. `SUPABASE_SERVICE_ROLE_KEY` is **not** required — no code path uses it, and it isn't retrievable from Lovable Cloud anyway.

## How local connects to the existing backend

Nothing is duplicated or migrated. The local dev server points at the same hosted Supabase project through `VITE_SUPABASE_URL`, so you see the same tables, users, orders, and your admin role immediately. Auth redirect URLs for the hosted project should include `http://localhost:8080` so password-reset and sign-in links come back to your local app — that's a backend setting I can apply when you're ready.

## Security notes on `.env`

- Add `.env` to `.gitignore` and keep `.env.example` (names only) in the repo.
- The publishable/anon key is browser-safe; security comes from RLS, which is already enabled on every table.
- Never place a service-role key in `.env` — any `VITE_`-prefixed variable is compiled into the client bundle and publicly visible.
- Because local and hosted share one database, actions you take locally are real production data changes.

Approve and I'll make only the four small housekeeping changes above (gitignore, `.env.example`, README section, VS Code recommendations) and add localhost to the auth redirect URLs.
