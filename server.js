const compression = require('compression');
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');

const app = express();

const thirdTour = process.argv[2] == 3;
const forcePort = process.argv[3];
const useHttp = process.argv[4] !== 'https';

const publicFolderName = thirdTour ? 'public3' : 'public';
const port = forcePort ? +forcePort : (thirdTour ? 8443 : 80);

app.set('etag', false);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');

  // RabbitGram: baseline security headers. Deliberately narrow — this is an
  // MTProto client that needs blob:/data: media, WebSocket connections to
  // Telegram DCs, workers, and WASM, so a full script-src/connect-src CSP
  // has real potential to break core functionality if written without
  // testing against a live production build. These directives hardening
  // against specific, well-understood attack classes (clickjacking, MIME
  // sniffing, base-tag hijacking, plugin content) without touching any of
  // that, so they're safe to ship without a production-build test pass.
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Content-Security-Policy', "object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  if(!useHttp) {
    res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }

  next();
});
app.use(compression());
app.use(express.static(publicFolderName));

app.get('/', (req, res) => {
  res.sendFile(__dirname + `/${publicFolderName}/index.html`);
});

const server = useHttp ? http : https;

let options = {};
if(!useHttp) {
  options.key = fs.readFileSync(__dirname + '/certs/server-key.pem');
  options.cert = fs.readFileSync(__dirname + '/certs/server-cert.pem');
}

server.createServer(options, app).listen(port, () => {
  console.log('Listening port:', port, 'folder:', publicFolderName);
});
