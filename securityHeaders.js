// @ts-check

// RabbitGram: single source of truth for the Content-Security-Policy and the
// other security response headers. Used by:
//   - server.js (production server, sent as real HTTP headers),
//   - vite.config.ts (injected as a <meta> CSP into index.html for both
//     `pnpm start` and `vite build`, so the policy also applies on hosts that
//     can't send custom headers, e.g. GitHub Pages or a bare nginx).
//
// Why this matters: the Telegram session (auth keys) lives in this origin's
// IndexedDB/localStorage. Anything that gets script execution in the page can
// steal the account. The policy below makes injected markup inert:
//   - script-src has NO 'unsafe-inline' / 'unsafe-eval', so <img onerror=...>,
//     javascript: URLs and injected <script> tags never run. Inline scripts
//     that legitimately exist (only dev tooling) are allowed by exact sha256
//     hash, computed at serve time.
//   - connect-src is pinned to Telegram plus the two card tokenizers Telegram
//     payments use, so even a hypothetical script bypass can't send the
//     session to an attacker's server with fetch/XHR/WebSocket.
//
// If a feature ever breaks under this policy, widen the one directive it
// needs here — every consumer picks the change up.

const CONNECT_SRC = [
  "'self'",
  'https://telegram.org',
  'https://*.telegram.org',
  'wss://*.telegram.org',
  // Card tokenization for Telegram Payments (src/components/popups/paymentCard.ts)
  'https://api.stripe.com',
  'https://tgb.smart-glocal.com',
  'https://tgb-playground.smart-glocal.com',
  // Reverse geocoding for location-based groups (src/components/sidebarLeft/tabs/newGroup.tsx)
  'https://nominatim.openstreetmap.org',
  'blob:',
  'data:'
];

// HMR websocket of the local Vite dev server. Never part of a production policy.
const DEV_CONNECT_SRC = [
  'ws://localhost:*',
  'wss://localhost:*',
  'ws://127.0.0.1:*',
  'wss://127.0.0.1:*'
];

/**
 * @param {{dev?: boolean, scriptHashes?: string[], meta?: boolean}} [options]
 *   dev          — allow the Vite HMR websocket
 *   scriptHashes — base64 sha256 hashes of inline scripts that must run
 *   meta         — policy is delivered via <meta>, which ignores frame-ancestors
 * @returns {string}
 */
function buildCsp({dev = false, scriptHashes = [], meta = false} = {}) {
  const directives = [
    "default-src 'self'",
    ['script-src', "'self'", "'wasm-unsafe-eval'", ...scriptHashes.map((hash) => `'sha256-${hash}'`)].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    // Bot web apps, payment providers' 3-D Secure pages and embeds open here.
    "frame-src 'self' https:",
    ['connect-src', ...CONNECT_SRC, ...(dev ? DEV_CONNECT_SRC : [])].join(' '),
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  if(!meta) {
    directives.push("frame-ancestors 'none'");
  }

  return directives.join('; ');
}

// Opt out of ad-tech/tracking APIs and hardware the client never uses.
// camera/microphone/geolocation/display-capture/fullscreen/payment are NOT
// listed: calls, voice/video notes, location sharing and Telegram Payments use
// them, and they already default to 'self'.
const PERMISSIONS_POLICY = 'browsing-topics=(), interest-cohort=(), serial=(), usb=(), bluetooth=(), hid=(), midi=()';

/**
 * Headers that are safe on every response (dev and prod).
 * @returns {Record<string, string>}
 */
function baseSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': PERMISSIONS_POLICY,
    // Keeps window.open working for OAuth/payment popups; a bare same-origin
    // would sever them.
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
}

module.exports = {
  buildCsp,
  baseSecurityHeaders,
  PERMISSIONS_POLICY
};
