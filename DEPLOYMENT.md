# The Growth Basket — Live Deployment Guide

This package is ready for Node.js hosting. It includes the frontend, backend, protected admin dashboard, lead storage, CSV export, health check, Docker support and a Render deployment file.

## Option 1 — cPanel / Hostinger / Any Node.js hosting

1. Extract the ZIP and upload the contents of `the-growth-basket-full` to your Node.js application folder.
2. Create a Node.js application in your hosting panel.
3. Use Node.js 18 or newer (Node 20 recommended).
4. Set the application startup file to `server.js` or the start command to `npm start`.
5. Set an environment variable:
   - `ADMIN_TOKEN` = a long random secret (at least 32 characters recommended).
   - `NODE_ENV` = `production`.
6. Run `npm install` if your hosting panel asks for dependencies.
7. Start/restart the Node.js application.
8. Point your domain/subdomain to the Node.js application using your hosting panel's domain/proxy settings.
9. Open your domain in the browser. The homepage is served by `server.js`.
10. Admin: `https://YOUR-DOMAIN.com/admin?token=YOUR_ADMIN_TOKEN`. After the first login, the token is stored only in an HttpOnly session cookie.

### Important for lead storage
The backend stores enquiries in `data/leads.json`. Your hosting must provide persistent storage for this folder. Do not deploy this app on a serverless-only platform without persistent storage or change the storage layer to a database.

## Option 2 — Render

1. Put this project in a GitHub repository.
2. Create a new Web Service on Render and connect the repository.
3. Render can use the included `render.yaml` as a Blueprint.
4. The service starts with `npm start`.
5. The included persistent disk is mounted at `/var/data`; set `DATA_DIR=/var/data` in the service environment if Render does not apply it automatically.
6. Set `ADMIN_TOKEN` to your own secret.
7. Deploy and open the Render URL.

## Option 3 — Docker VPS

Run:

```bash
docker compose up -d --build
```

Put Nginx/Caddy/another reverse proxy in front of port 3000 and enable HTTPS.

## Backend endpoints

- `GET /api/health` — server health check.
- `POST /api/leads` — receives website enquiries.
- `GET /api/leads` — protected lead API.
- `GET /admin` — protected admin dashboard.
- `GET /admin/export` — protected CSV export.
- `GET /admin/logout` — ends the admin session.

## Form flow

Website contact form → `POST /api/leads` → validation + basic rate limiting + honeypot → persistent `data/leads.json` → admin dashboard/CSV.

## Security checklist before launch

- Replace `ADMIN_TOKEN` with a strong secret and never commit it to GitHub.
- Use HTTPS on the public domain.
- Keep the `data` directory writable by the Node process.
- Back up `data/leads.json` regularly if you use file storage.
- For high traffic, migrate leads to PostgreSQL/MySQL and add transactional email/CRM integration.
