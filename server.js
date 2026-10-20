const compression = require('compression');
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const {buildCsp, baseSecurityHeaders} = require('./securityHeaders');

const app = express();

const thirdTour = process.argv[2] == 3;
const forcePort = process.argv[3];
const useHttp = process.argv[4] !== 'https';

// RabbitGram: `--local` (used by `pnpm serve:local`) serves a fresh
// `vite build` (dist/, with the static assets from public/ behind it) on
// loopback only, at the same origin as the dev server (localhost:8080) so an
// existing login carries over. HOST / PORT override individual values.
// Without the flag the historical behaviour is kept (serve public/ on every
// interface).
const local = process.argv.includes('--local');
const publicFolderName = local ? 'dist' : (thirdTour ? 'public3' : 'public');
const staticRoots = (local ? ['dist', 'public'] : [publicFolderName]).map((dir) => path.resolve(__dirname, dir));
const port = process.env.PORT ? +process.env.PORT : (local ? 8080 : (forcePort ? +forcePort : (thirdTour ? 8443 : 80)));
const host = process.env.HOST || (local ? '127.0.0.1' : undefined);

// RabbitGram: strict Content-Security-Policy + hardening headers. The policy
// itself lives in securityHeaders.js (shared with the Vite dev server and the
// <meta> CSP baked into the built index.html) — see the rationale there.
const CSP = buildCsp();
const SECURITY_HEADERS = baseSecurityHeaders();

app.set('etag', false);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set(SECURITY_HEADERS);
  res.set('Content-Security-Policy', CSP);
  if(!useHttp) {
    res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }

  next();
});
app.use(compression());
for(const root of staticRoots) {
  app.use(express.static(root, {dotfiles: 'deny'}));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(staticRoots[0], 'index.html'));
});

const server = useHttp ? http : https;

let options = {};
if(!useHttp) {
  options.key = fs.readFileSync(__dirname + '/certs/server-key.pem');
  options.cert = fs.readFileSync(__dirname + '/certs/server-cert.pem');
}

server.createServer(options, app).listen(port, host, () => {
  console.log('Listening:', `${host || '*'}:${port}`, 'folder:', publicFolderName);
  if(local) {
    console.log(`Open http://localhost:${port}/`);
  }
});
