// build.js — injects GOOGLE_MAPS_API_KEY into index.html at deploy time
// Cloudflare Pages runs this via: node build.js

const fs = require('fs');
const path = require('path');

const key = process.env.GOOGLE_MAPS_API_KEY;

if (!key) {
  console.error('❌  GOOGLE_MAPS_API_KEY environment variable is not set.');
  console.error('    Set it in Cloudflare Pages → Settings → Environment Variables.');
  process.exit(1);
}

const srcPath  = path.join(__dirname, 'src', 'index.html');
const distPath = path.join(__dirname, 'dist', 'index.html');

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

const html = fs.readFileSync(srcPath, 'utf8');
const out  = html.replace(/%%MAPS_KEY%%/g, key);

fs.writeFileSync(distPath, out, 'utf8');

console.log('✅  Built dist/index.html with API key injected.');
