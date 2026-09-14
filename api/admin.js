const { sql, ensureTable } = require('./_db');
const { tokenMatches, makeCookie, isAdmin } = require('./_auth');

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function page(leads) {
  const rows = leads.map(x => `<tr><td>${esc(new Date(x.created_at).toLocaleString())}</td><td><b>${esc(x.name)}</b><br>${esc(x.brand)}</td><td><a href="tel:${esc(x.phone)}">${esc(x.phone)}</a></td><td>${esc(x.service)}</td><td>${esc(x.message || '—')}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Growth Basket — Admin</title><style>body{font-family:Inter,Arial,sans-serif;background:#f4f7f5;color:#10261b;margin:0;padding:28px}.wrap{max-width:1200px;margin:auto}.top{display:flex;justify-content:space-between;gap:20px;align-items:center;flex-wrap:wrap}h1{margin:0 0 5px}.muted{color:#66766d}.card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 8px 30px #1232}.btn{display:inline-block;padding:10px 14px;border-radius:9px;background:#0b5135;color:#fff;text-decoration:none;margin-left:6px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:12px;border-bottom:1px solid #e5eae6;text-align:left;vertical-align:top}th{background:#0b5135;color:#fff}td{font-size:14px}@media(max-width:760px){table{display:block;overflow:auto;white-space:nowrap}.btn{margin-top:8px}}</style></head><body><div class="wrap"><div class="top"><div><h1>The Growth Basket — Leads</h1><div class="muted">${leads.length} enquiries saved</div></div><div><a class="btn" href="/api/admin-export">Export CSV</a><a class="btn" href="/api/admin?logout=1">Logout</a></div></div><div class="card" style="margin-top:22px">${leads.length ? `<table><thead><tr><th>Date</th><th>Name / Brand</th><th>Phone</th><th>Service</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table>` : 'No enquiries yet.'}</div></div></body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  if (!process.env.ADMIN_TOKEN) return res.status(503).send('Admin is not configured. Set ADMIN_TOKEN in Vercel Environment Variables.');
  const { token, logout } = req.query || {};
  if (logout) {
    res.setHeader('Set-Cookie', 'gb_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    return res.redirect(302, '/api/admin');
  }
  if (tokenMatches(token)) {
    res.setHeader('Set-Cookie', makeCookie(token));
    return res.redirect(302, '/api/admin');
  }
  if (!isAdmin(req)) return res.status(401).send('Admin login required. Open /api/admin?token=YOUR_ADMIN_TOKEN');
  try {
    await ensureTable();
    const result = await sql`SELECT id, created_at, name, brand, phone, service, message, source FROM leads ORDER BY created_at DESC`;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(page(result.rows));
  } catch (err) { console.error(err); return res.status(500).send('Unable to load leads.'); }
};
