const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

module.exports = (req, res) => {
  let requestPath = (req.url || '/').split('?')[0];
  if (requestPath === '/') requestPath = '/index.html';

  // Keep /api/* handled by Vercel's API functions.
  if (requestPath.startsWith('/api/')) {
    res.statusCode = 404;
    res.end('API route not found');
    return;
  }

  const safePath = path.normalize(requestPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(process.cwd(), safePath.replace(/^[/\\]+/, ''));

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.end(data);
  });
};
