const crypto = require('crypto');

function tokenMatches(value) {
  const expected = process.env.ADMIN_TOKEN || '';
  const a = Buffer.from(String(value || ''));
  const b = Buffer.from(expected);
  return !!expected && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function makeCookie(token) {
  const secret = process.env.ADMIN_TOKEN || '';
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret).update(ts).digest('hex');
  return `gb_admin=${ts}.${sig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`;
}

function cookieValid(req) {
  const raw = (req.headers.cookie || '').split(';').find(x => x.trim().startsWith('gb_admin='));
  if (!raw) return false;
  const value = raw.trim().slice('gb_admin='.length);
  const [ts, sig] = value.split('.');
  if (!ts || !sig || !process.env.ADMIN_TOKEN) return false;
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > 8 * 60 * 60 * 1000) return false;
  const expected = crypto.createHmac('sha256', process.env.ADMIN_TOKEN).update(ts).digest('hex');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isAdmin(req, queryToken) {
  if (tokenMatches(queryToken)) return true;
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ') && tokenMatches(auth.slice(7))) return true;
  return cookieValid(req);
}

module.exports = { tokenMatches, makeCookie, cookieValid, isAdmin };
