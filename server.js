const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DATA = path.join(DATA_DIR, 'leads.json');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const SITE_NAME = 'The Growth Basket';
const MAX_BODY = 1_000_000;
const RATE_WINDOW = 60_000;
const RATE_MAX = 8;
const rateMap = new Map();
const sessions = new Map();

if (!ADMIN_TOKEN) console.warn('WARNING: ADMIN_TOKEN is not set. Admin login is disabled until you configure it.');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, '[]');

const mime = {
  '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.webp':'image/webp', '.txt':'text/plain; charset=utf-8'
};

function send(res, status, body, type='text/plain; charset=utf-8', headers={}) {
  res.writeHead(status, {'Content-Type': type, 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin', 'Cache-Control':'no-store', ...headers});
  res.end(body);
}
function json(res, status, data, headers={}) { send(res, status, JSON.stringify(data), mime['.json'], headers); }
function readLeads() { try { return JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { return []; } }
function writeLeads(x) { const tmp = DATA + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(x, null, 2)); fs.renameSync(tmp, DATA); }
function parseCookies(req) { const out={}; (req.headers.cookie||'').split(';').forEach(p=>{const i=p.indexOf('='); if(i>0) out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1));}); return out; }
function validSession(req) { const sid=parseCookies(req).gb_admin; return sid && sessions.get(sid) && sessions.get(sid)>Date.now(); }
function makeSession() { const sid=crypto.randomBytes(32).toString('hex'); sessions.set(sid, Date.now()+8*60*60*1000); return sid; }
function tokenMatches(value) { const a=Buffer.from(String(value||'')); const b=Buffer.from(String(ADMIN_TOKEN||'')); return !!ADMIN_TOKEN && a.length===b.length && crypto.timingSafeEqual(a,b); }
function escapeHtml(s) { return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function csvCell(s) { return '"'+String(s??'').replace(/"/g,'""')+'"'; }
function rateLimited(ip) {
  const now=Date.now(); const item=rateMap.get(ip);
  if(!item || now-item.start>RATE_WINDOW) { rateMap.set(ip,{start:now,count:1}); return false; }
  item.count++; return item.count>RATE_MAX;
}
function readBody(req) { return new Promise((resolve,reject)=>{let b=''; req.on('data',c=>{b+=c; if(b.length>MAX_BODY){reject(new Error('Body too large')); req.destroy();}}); req.on('end',()=>{try{resolve(b?JSON.parse(b):{});}catch(e){reject(e);}}); req.on('error',reject);}); }
function safeFilePath(pathname) {
  let decoded; try { decoded=decodeURIComponent(pathname); } catch { return null; }
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const fp = path.resolve(ROOT, relative);
  if(fp!==ROOT && !fp.startsWith(ROOT + path.sep)) return null;
  return fp;
}
function adminPage(leads) {
  const rows=leads.map(x=>`<tr><td>${escapeHtml(new Date(x.createdAt).toLocaleString())}</td><td><b>${escapeHtml(x.name)}</b><br>${escapeHtml(x.brand)}</td><td><a href="tel:${escapeHtml(x.phone)}">${escapeHtml(x.phone)}</a></td><td>${escapeHtml(x.service)}</td><td>${escapeHtml(x.message||'—')}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SITE_NAME} Admin</title><style>body{font-family:Inter,Arial,sans-serif;background:#f4f7f5;color:#10261b;margin:0;padding:28px}.wrap{max-width:1200px;margin:auto}.top{display:flex;justify-content:space-between;gap:20px;align-items:center;flex-wrap:wrap}h1{margin:0 0 5px}.muted{color:#66766d}.card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 8px 30px #1232  }.btn{display:inline-block;padding:10px 14px;border-radius:9px;background:#0b5135;color:#fff;text-decoration:none;margin-left:6px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:12px;border-bottom:1px solid #e5eae6;text-align:left;vertical-align:top}th{background:#0b5135;color:#fff}td{font-size:14px}@media(max-width:760px){table{display:block;overflow:auto;white-space:nowrap}.btn{margin-top:8px}}</style></head><body><div class="wrap"><div class="top"><div><h1>${SITE_NAME} — Leads</h1><div class="muted">${leads.length} enquiries saved</div></div><div><a class="btn" href="/admin/export">Export CSV</a><a class="btn" href="/admin/logout">Logout</a></div></div><div class="card" style="margin-top:22px">${leads.length?`<table><thead><tr><th>Date</th><th>Name / Brand</th><th>Phone</th><th>Service</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table>`:'No enquiries yet.'}</div></div></body></html>`;
}

const server=http.createServer(async(req,res)=>{
  const u=url.parse(req.url,true);
  const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();

  if(req.method==='GET' && u.pathname==='/api/health') return json(res,200,{ok:true,service:'The Growth Basket backend',time:new Date().toISOString()});

  if(req.method==='POST' && u.pathname==='/api/leads') {
    if(rateLimited(ip)) return json(res,429,{ok:false,message:'Too many enquiries from this IP. Please try again later.'});
    try {
      const b=await readBody(req);
      if(String(b.website||'').trim()) return json(res,200,{ok:true,message:'Enquiry received.'}); // honeypot
      const required=['name','brand','phone','service'];
      if(required.some(k=>!String(b[k]||'').trim())) return json(res,400,{ok:false,message:'Please complete all required fields.'});
      const leads=readLeads();
      const lead={id:crypto.randomUUID(),createdAt:new Date().toISOString(),name:String(b.name).trim().slice(0,120),brand:String(b.brand).trim().slice(0,160),phone:String(b.phone).trim().slice(0,40),service:String(b.service).trim().slice(0,160),message:String(b.message||'').trim().slice(0,3000),source:'website'};
      leads.unshift(lead); writeLeads(leads);
      return json(res,201,{ok:true,message:'Enquiry received. The Growth Basket team can follow up shortly.',leadId:lead.id});
    } catch(e) { console.error(e); return json(res,500,{ok:false,message:'Unable to save enquiry right now.'}); }
  }

  if(req.method==='GET' && u.pathname==='/admin') {
    if(!ADMIN_TOKEN) return send(res,503,'Admin is not configured. Set ADMIN_TOKEN on the hosting server.');
    if(u.query.token && tokenMatches(u.query.token)) {
      const sid=makeSession(); const secure=(req.headers['x-forwarded-proto']==='https' || process.env.NODE_ENV==='production') ? '; Secure' : ''; return send(res,302,'', 'text/plain', {'Location':'/admin','Set-Cookie':`gb_admin=${encodeURIComponent(sid)}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=28800`});
    }
    if(!validSession(req)) return send(res,401,'Admin login required. Open /admin?token=YOUR_ADMIN_TOKEN');
    return send(res,200,adminPage(readLeads()),'text/html; charset=utf-8');
  }
  if(req.method==='GET' && u.pathname==='/admin/logout') {
    const sid=parseCookies(req).gb_admin; if(sid) sessions.delete(sid);
    return send(res,302,'','text/plain',{'Location':'/admin','Set-Cookie':'gb_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'});
  }
  if(req.method==='GET' && u.pathname==='/admin/export') {
    if(!validSession(req)) return send(res,401,'Unauthorized');
    const leads=readLeads(); const header=['Date','Name','Brand','Phone','Service','Message'];
    const rows=leads.map(x=>[x.createdAt,x.name,x.brand,x.phone,x.service,x.message].map(csvCell).join(','));
    return send(res,200,[header.map(csvCell).join(','),...rows].join('\n'),'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="growth-basket-leads.csv"'});
  }
  if(req.method==='GET' && u.pathname==='/api/leads') {
    if(!validSession(req) && req.headers.authorization!==`Bearer ${ADMIN_TOKEN}`) return json(res,401,{ok:false,message:'Unauthorized'});
    const leads=readLeads(); return json(res,200,{ok:true,count:leads.length,leads});
  }

  const fp=safeFilePath(u.pathname);
  if(!fp || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return send(res,404,'Not found');
  try { const ext=path.extname(fp).toLowerCase(); const cache=ext==='.html'?'no-store':'public, max-age=3600'; send(res,200,fs.readFileSync(fp),mime[ext]||'application/octet-stream',{'Cache-Control':cache}); }
  catch(e){ send(res,500,'Server error'); }
});

server.listen(PORT,()=>console.log(`${SITE_NAME} running on port ${PORT}`));
