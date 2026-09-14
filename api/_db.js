const { sql } = require('@vercel/postgres');

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      phone TEXT NOT NULL,
      service TEXT NOT NULL,
      message TEXT DEFAULT '',
      source TEXT DEFAULT 'website'
    )
  `;
}

module.exports = { sql, ensureTable };
