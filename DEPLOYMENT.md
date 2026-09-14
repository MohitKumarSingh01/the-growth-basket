# Vercel deployment — The Growth Basket

## 1. GitHub
Push the complete project to the `main` branch.

## 2. Vercel
Import `the-growth-basket` from GitHub.
- Preset: Node
- Root Directory: `./`
- No build command is required for the static front end.

## 3. Permanent lead storage
Vercel serverless functions must not use a local JSON file as permanent storage. Connect a PostgreSQL database through the Vercel Marketplace (for example Neon/Postgres). Ensure the project receives `POSTGRES_URL`.

## 4. Environment variable
Add:
- `ADMIN_TOKEN` = a long random secret (Production)

Do not commit a real `.env` file or real secrets to GitHub.

## 5. Deploy
Click Deploy. The site is served from `index.html`; the API endpoints are under `/api/`.

### Endpoints
- `/api/health` — backend health check
- `POST /api/leads` — contact form endpoint
- `/api/admin?token=...` — protected admin dashboard
- `/api/admin-export` — CSV export (requires admin cookie/token)
- `/api/admin-data` — JSON lead data (requires admin cookie/token)

## 6. Custom domain
After deployment, open Vercel project → Settings → Domains → add your domain.
