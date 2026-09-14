const { sql, ensureTable } = require('./_db');
const { isAdmin } = require('./_auth');
function cell(s) { return '"' + String(s ?? '').replace(/"/g, '""') + '"'; }
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  if (!isAdmin(req, req.query?.token)) return res.status(401).send('Unauthorized');
  try {
    await ensureTable();
    const result = await sql`SELECT created_at, name, brand, phone, service, message FROM leads ORDER BY created_at DESC`;
    const header = ['Date','Name','Brand','Phone','Service','Message'];
    const rows = result.rows.map(x => [x.created_at, x.name, x.brand, x.phone, x.service, x.message].map(cell).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="growth-basket-leads.csv"');
    return res.status(200).send([header.map(cell).join(','), ...rows].join('\n'));
  } catch (err) { console.error(err); return res.status(500).send('Unable to export leads.'); }
};
