const { sql, ensureTable } = require('./_db');
const { isAdmin } = require('./_auth');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  if (!isAdmin(req, req.query?.token)) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  try { await ensureTable(); const result = await sql`SELECT id, created_at, name, brand, phone, service, message, source FROM leads ORDER BY created_at DESC`; return res.status(200).json({ ok:true, count:result.rows.length, leads:result.rows }); }
  catch (err) { console.error(err); return res.status(500).json({ ok:false, message:'Unable to load leads.' }); }
};
