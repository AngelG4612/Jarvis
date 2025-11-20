#!/usr/bin/env node
// get_spotify_refresh.js
// Small OAuth helper to obtain a Spotify refresh_token for local testing.
// Usage:
//   export SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
//   node get_spotify_refresh.js

const http = require('http');
const querystring = require('querystring');
const https = require('https');
const { spawn } = require('child_process');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8888/callback';
const PORT = 8888;
const SCOPES = [
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing'
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET as environment variables.');
  process.exit(1);
}

const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
  response_type: 'code',
  client_id: CLIENT_ID,
  scope: SCOPES.join(' '),
  redirect_uri: REDIRECT_URI,
  show_dialog: true
})}`;

console.log('If browser does not open, visit this URL:\n' + authUrl + '\n');

const isLocalHttp = REDIRECT_URI.startsWith('http://') && (REDIRECT_URI.includes('localhost') || REDIRECT_URI.includes('127.0.0.1'));

function exchangeCode(code, cb) {
  const postData = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI
  });

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const tokenReq = https.request(options, (tokenRes) => {
    let raw = '';
    tokenRes.on('data', (d) => raw += d);
    tokenRes.on('end', () => {
      try {
        const json = JSON.parse(raw);
        console.log('\nTokens:\n', json);
        if (json.refresh_token) {
          console.log('\nCopy this refresh_token into MMM-SpotifyControl config or SPOTIFY_REFRESH_TOKEN env var:\n', json.refresh_token);
        } else {
          console.log('\nNo refresh_token returned. If you previously approved the app, try using show_dialog=true or generate a new code.');
        }
        if (cb) cb(null, json);
      } catch (e) {
        console.error('Failed to parse token response', e, raw);
        if (cb) cb(e);
      }
    });
  });

  tokenReq.on('error', (err) => {
    console.error('Token request error', err);
    if (cb) cb(err);
  });

  tokenReq.write(postData);
  tokenReq.end();
}

if (isLocalHttp) {
  // previous behavior: start local HTTP server and catch redirect
  const server = http.createServer((req, res) => {
    if (!req.url.startsWith(new URL(REDIRECT_URI).pathname)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const qs = (req.url.split('?')[1] || '');
    const params = querystring.parse(qs);
    const code = params.code;
    if (!code) {
      res.writeHead(400);
      res.end('Missing code');
      return;
    }
    exchangeCode(code, (err, json) => {
      if (err) {
        res.writeHead(500);
        res.end('Token exchange failed');
      } else {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end('<h2>You can close this window</h2><pre>' + JSON.stringify(json, null, 2) + '</pre>');
      }
      server.close();
    });
  });

  server.listen(PORT, () => {
    try {
      const opener = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
      spawn(opener, [authUrl], { shell: true, stdio: 'ignore', detached: true }).unref();
    } catch (e) {
      // ignore
    }
    console.log(`Listening on ${REDIRECT_URI} for the OAuth redirect...`);
  });
} else {
  // For HTTPS or non-local redirects where running a local server isn't possible, fall back to manual paste flow
  console.log('Since your redirect URI is not a local http:// URL, after granting access you will be redirected to the redirect URI in the browser.');
  console.log('Please copy the full redirect URL from your browser address bar and paste it here, then press Enter.');
  console.log('\nAuthorization URL:\n' + authUrl + '\n');

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.once('data', (input) => {
    const url = input.toString().trim();
    try {
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      if (!code) throw new Error('No code param found in URL');
      exchangeCode(code);
    } catch (e) {
      console.error('Failed to parse URL or extract code:', e.message);
    } finally {
      process.stdin.pause();
    }
  });
}
