const crypto = require('crypto');
const { sql, ensureTable } = require('./_db');
const { sendLeadNotification } = require('./_email');

const rate = globalThis.__tgbRate || (globalThis.__tgbRate = new Map());
const WINDOW = 60_000;
const MAX = 8;

function limited(ip) {
  const now = Date.now();
  const old = rate.get(ip);
  if (!old || now - old.start > WINDOW) {
    rate.set(ip, { start: now, count: 1 });
    return false;
  }
  old.count += 1;
  return old.count > MAX;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const ip = String(
    req.headers['x-forwarded-for'] ||
    req.socket?.remoteAddress ||
    ''
  ).split(',')[0].trim();

  if (limited(ip)) {
    return res.status(429).json({
      ok: false,
      message: 'Too many enquiries from this IP. Please try again later.'
    });
  }

  try {
    const b = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    if (String(b.website || '').trim()) {
      return res.status(200).json({
        ok: true,
        message: 'Enquiry received.'
      });
    }

    const required = ['name', 'brand', 'phone', 'service'];

    if (required.some(k => !String(b[k] || '').trim())) {
      return res.status(400).json({
        ok: false,
        message: 'Please complete all required fields.'
      });
    }

    await ensureTable();

    const lead = {
      id: crypto.randomUUID(),
      name: String(b.name).trim().slice(0, 120),
      brand: String(b.brand).trim().slice(0, 160),
      phone: String(b.phone).trim().slice(0, 40),
      service: String(b.service).trim().slice(0, 160),
      message: String(b.message || '').trim().slice(0, 3000)
    };

    await sql`
      INSERT INTO leads (id, name, brand, phone, service, message, source)
      VALUES (
        ${lead.id},
        ${lead.name},
        ${lead.brand},
        ${lead.phone},
        ${lead.service},
        ${lead.message},
        'website'
      )
    `;

    const email = await sendLeadNotification(lead);

    return res.status(201).json({
      ok: true,
      message: 'Enquiry received. The Growth Basket team can follow up shortly.',
      leadId: lead.id,
      emailSent: email.sent
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      message: 'Unable to save enquiry right now.'
    });
  }
};
