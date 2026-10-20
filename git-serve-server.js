// @ts-check

const https = require('https');
const http = require('http');
const fs = require('fs');

const gitstatic = require("./git-serve");
const express = require("express");

const repository = '.git';

// SECURITY: this is a LOCAL developer tool that serves the raw git repository
// (every file at every revision, including .env) over HTTP and has no auth.
// Never expose it on a public interface — bind it to localhost only, or don't
// run it on anything reachable from the internet.

// Escape values interpolated into the HTML listing below. Commit subjects and
// refs come from `git log`, i.e. they're author-controlled, so without this a
// crafted commit message could inject markup/script into this page.
function esc(value) {
  return String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
}

const app = express();
app.get(/^\/.+/, gitstatic.route().repository(repository));
app.get(/\//, (req, res) => {
  gitstatic.listAllCommits(repository, (err, commits) => {
    console.log(err, commits);

    res.type('html');
    res.send(
      commits.map((commit) => {
        const shaPath = encodeURIComponent(commit.sha);
        return `<a href="/${shaPath}/public/index.html" target="_blank" rel="noopener"><span style="font-family: monospace;">${esc(String(commit.sha).slice(0, 7))} - ${esc(commit.date.toISOString())}</span></a> - <a href="https://github.com/morethanwords/tweb/commit/${shaPath}" target="_blank" rel="noopener">${esc(commit.subject)}</a><br>`;
      }).join('')
    );
  });
});

const useHttp = false;
const transport = useHttp ? http : https;
let options = {};
if(!useHttp) {
  options.key = fs.readFileSync(__dirname + '/certs/server-key.pem');
  options.cert = fs.readFileSync(__dirname + '/certs/server-cert.pem');
}

const port = 3000;
const protocol = useHttp ? 'http' : 'https';
console.log('Listening port:', port);
function createServer(host) {
  const server = transport.createServer(options, app);
  server.listen(port, host, () => {
    console.log('Host:', `${protocol}://localhost:${port}/`);
  });

  server.on('error', (e) => {
    // @ts-ignore
    if(e.code === 'EADDRINUSE') {
      console.log('Address in use:', host);
      server.close();
    }
  });
}

// Loopback only (it used to also bind every LAN address, publishing the whole
// repository history to anyone on the same network).
createServer('127.0.0.1');
