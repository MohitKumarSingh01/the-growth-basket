# The Growth Basket — Vercel Live Version

Premium responsive website with clickable service/channel/process details, a contact enquiry form, a protected admin dashboard, CSV export, and PostgreSQL lead storage.

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Keep **Application Preset: Node** and **Root Directory: `./`**.
3. Create/connect a Postgres database from Vercel Marketplace (Neon/Postgres) and make sure `POSTGRES_URL` is available to the project.
4. Add an Environment Variable named `ADMIN_TOKEN` with a long random secret. Apply it to Production (and Preview if desired).
5. Deploy.
6. Admin dashboard: `/api/admin?token=YOUR_ADMIN_TOKEN`.
7. After the first successful enquiry or admin visit, the `leads` table is created automatically.

## Local

`npm install`

Set `POSTGRES_URL` and `ADMIN_TOKEN`, then:

`npm start`

The browser website is served by `server.js` locally; the `api/` files are the production Vercel serverless endpoints.
