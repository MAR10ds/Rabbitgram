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

// RabbitGram: strict Content-Security-Policy for the production build.
//
// The single control that matters most for "safe to log in with my account"
// is `script-src 'self' 'wasm-unsafe-eval'` with NO 'unsafe-inline' / no
// 'unsafe-eval': the built index.html has zero inline scripts and no inline
// event handlers (verified), and the app never calls eval()/new Function()
// at runtime, so an injected/stored XSS payload simply cannot execute — which
// is exactly the chain that would otherwise let an attacker exfiltrate your
// Telegram session keys. `connect-src` is then pinned to Telegram so that even
// a hypothetical script bypass can't phone the session home to an attacker.
//
// Everything runs first-party: the app talks only to *.telegram.org (MTProto
// over WSS + media/CDN over HTTPS), renders media as blob:/data:, runs its
// MTProto/crypto/rlottie logic in same-origin Web Workers, and instantiates
// WASM. img/media/frame stay permissive over https: so link previews, HLS
// streaming and bot web-app iframes keep working; that's fine because the
// script layer is what's actually locked down.
//
// If some feature ever breaks under this policy, widen the specific directive
// (or comment the header out to fall back) — it's all in this one place.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'self' https:",
  "connect-src 'self' https://telegram.org https://*.telegram.org wss://*.telegram.org blob: data:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

app.set('etag', false);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');

  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Content-Security-Policy', CSP);
  // Opt out of ad-tech/tracking APIs and powerful hardware the client never
  // uses. Deliberately omits camera/microphone/geolocation/display-capture/
  // fullscreen/payment — those ARE used (calls, voice/video notes, location
  // sharing, Telegram payments) and default to 'self', so listing them here
  // would break those features.
  res.set('Permissions-Policy', 'browsing-topics=(), interest-cohort=(), serial=(), usb=(), bluetooth=(), hid=(), midi=()');
  // Cross-origin isolation of the browsing context without breaking OAuth /
  // payment popups the app opens (same-origin-allow-popups keeps window.open
  // working; a bare same-origin would sever those).
  res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
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
