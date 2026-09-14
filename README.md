# The Growth Basket — Full Website + Backend

This version keeps the premium frontend and adds a lightweight production-ready Node.js backend with no third-party npm packages.

## Included
- Your Growth Basket logo in header, footer and favicon.
- Clickable Services, Platforms and Growth Process cards with detailed information modals.
- Working navigation, WhatsApp, phone and email links.
- Contact form connected to `POST /api/leads` and persisted in `data/leads.json`.
- Admin lead dashboard at `/admin?token=YOUR_ADMIN_TOKEN`.
- Health endpoint at `/api/health`.
- Responsive mobile layout.

## Run locally
1. Install Node.js 18+.
2. Open this folder in Terminal/Command Prompt.
3. Run: `node server.js`
4. Open: `http://localhost:3000`
5. Admin: `http://localhost:3000/admin?token=growthbasket-admin-change-me`

## Production
Set a strong `ADMIN_TOKEN` environment variable before starting the server. For example:
`ADMIN_TOKEN="use-a-long-random-secret" node server.js`

For a production deployment, put the app behind HTTPS and use a real database (PostgreSQL/MySQL) and transactional email provider if you want automatic email notifications.
