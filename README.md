# BuildSupply — Construction Materials Ordering

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Run locally on Windows (VS Code)

### 1. Get the source

Connect the project to GitHub from the Lovable editor (top right → GitHub → Connect),
then clone the repository on your machine.

### 2. Install prerequisites (once)

- [Git for Windows](https://git-scm.com/download/win)
- [Node.js LTS](https://nodejs.org)
- Bun — in PowerShell: `powershell -c "irm bun.sh/install.ps1 | iex"`

### 3. Install and run

```powershell
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
copy .env.example .env   # then fill in the values
bun install
bun run dev
```

Open the URL printed in the terminal (usually `http://localhost:8080`) and run `code .`
to open the project in VS Code.

Prefer npm? `npm install` then `npm run dev` works too.

Production check: `bun run build` then `bun run preview`.

### 4. Environment variables

See `.env.example` for the required names. Values come from your Lovable Cloud
backend settings. The publishable/anon key is browser-safe; the database is
protected by row-level security. Never add a service-role key to `.env` — this
app does not use one, and any `VITE_`-prefixed value ends up in the public
client bundle.

### 5. Backend connection

Local development talks to the same hosted backend as the Lovable preview, so you
see the same materials, orders, users and roles. Changes you make locally are real
data changes. For password-reset and sign-in links to return to your machine,
`http://localhost:8080` must be listed in the backend's auth redirect URLs.

## Built with

- TanStack Start (React 19, TanStack Router + Query)
- TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Lovable Cloud)
