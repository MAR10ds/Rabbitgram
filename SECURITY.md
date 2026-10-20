# Security Policy

RabbitGram is a Telegram client that runs entirely in your browser. Your Telegram
session (the MTProto auth keys) is stored in this site's IndexedDB/localStorage,
so **anything that can run script on the RabbitGram origin can take over the
account**. Security work here is focused on making that impossible.

## Supported versions

Only the latest commit on `main` is supported. Please make sure you can
reproduce an issue there before reporting it.

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Use GitHub's private reporting instead: open the repository's **Security** tab →
**Report a vulnerability**. Please include steps to reproduce, the affected
browser, and what an attacker gains (e.g. script execution, session access,
leaked message content). You should get a reply within a week; fixes for
session-compromising bugs are prioritised over everything else.

Issues in upstream code that also affect [tweb](https://github.com/morethanwords/tweb)
or [web.telegram.org/k](https://web.telegram.org/k/) should additionally be
reported to Telegram through their own channels.

## What the client does to protect your session

- **Strict Content-Security-Policy** (`securityHeaders.js`), delivered both as an
  HTTP header (`server.js`) and as a `<meta>` tag baked into `index.html` — in the
  production build *and* in the dev server — so it applies on any host:
  - `script-src 'self' 'wasm-unsafe-eval'` with no `'unsafe-inline'` / `'unsafe-eval'`:
    injected markup (`<img onerror>`, `javascript:` URLs, `<script>`) never runs.
  - `connect-src` is pinned to `*.telegram.org` plus the card tokenizers Telegram
    Payments uses, so even a script bypass can't send the session elsewhere.
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
    `frame-ancestors 'none'` (no clickjacking).
- Hardening headers on every response: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`,
  `Cross-Origin-Resource-Policy`.
- No analytics, telemetry or third-party scripts. The client talks to Telegram's
  servers only (and, when you use them, card payments and location lookup).
- RabbitGram-specific data (deleted-message snapshots, edit history, view-once
  captures, filters, custom sound) never leaves the device and is encrypted at
  rest together with the session when Passcode Lock is enabled.
- Dev tooling that handles sessions (`snapshot-server`, `git-serve-server.js`)
  listens on `127.0.0.1` only and rejects path traversal / DNS rebinding.

## Using RabbitGram safely with your main account

1. **Run the production build, not the dev server**, for everyday use:
   `pnpm serve:local` builds and serves it on `http://localhost:8080` (loopback
   only, same origin as `pnpm start`, so an existing login carries over).
2. **Use a separate browser profile without extensions.** A browser extension
   with access to all sites can read the session straight out of storage — no
   CSP can stop that.
3. **Enable a Telegram cloud password (2FA)**: Settings → Privacy and Security →
   Two-Step Verification. Someone who phishes or intercepts a login code still
   can't sign in as you without it.
4. **Enable Passcode Lock** in Settings → Privacy and Security. The session and
   all locally cached data are then encrypted at rest.
5. **Check Active Sessions** from time to time (Settings → Devices) and
   terminate anything you don't recognise.
6. Don't expose the dev server to a network (`pnpm start-in-docker` /
   `vite --host`) on untrusted Wi-Fi.
7. Only run code from this repository that you have read. Don't paste anything
   into the browser DevTools console on the RabbitGram tab — "paste this to get
   feature X" is the classic way sessions get stolen.

## For contributors

- Never add `'unsafe-inline'`, `'unsafe-eval'` or a wildcard host to the CSP. If a
  feature needs a new endpoint, add that exact origin to `CONNECT_SRC` in
  `securityHeaders.js` with a comment saying which feature uses it.
- Never put user-controlled text into `innerHTML` — use `textContent`,
  `setInnerHTML` (which uses `textContent` for strings) or `wrapRichText` /
  `wrapEmojiText`, which escape.
- Never commit `.env.local`, certificates, `ssh.json`, `tmp/` preview seeds or
  storage snapshots — they contain credentials or live Telegram sessions.
