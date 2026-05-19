const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  // Vercel serves static files automatically
  // This handler is only for paths that don't exist
  if (req.url === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
  res.status(404).json({ error: 'Not found' });
}