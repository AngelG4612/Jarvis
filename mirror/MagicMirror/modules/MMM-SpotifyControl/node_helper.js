/* Minimal, correct node_helper for Spotify control */
const NodeHelper = require('node_helper');
const fs = require('fs');
const path = require('path');

let fetchFn = null;
try {
  if (typeof fetch !== 'undefined') fetchFn = fetch;
  else {
    const nf = require('node-fetch');
    fetchFn = nf && (nf.default || nf);
  }
} catch (e) {
  // fetch may be unavailable; ensureToken/api will throw with clear message
}

function base64Encode(s) { return Buffer.from(String(s)).toString('base64'); }

module.exports = NodeHelper.create({
  start() {
    this.config = {};
    this.accessToken = null;
    this.expiry = 0;
    this._refreshPromise = null;
    this.tokensFile = path.join(this.path || process.cwd(), '.spotify_tokens.json');
    this.log('SpotifyControl helper started');
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'SPOTIFY_CONFIG' && payload && typeof payload === 'object') {
      Object.assign(this.config, payload);
      try { fs.writeFileSync(this.tokensFile, JSON.stringify({ refreshToken: this.config.refreshToken }), { mode: 0o600 }); } catch (e) {}
      return;
    }
    if (notification === 'SPOTIFY_REFRESH_NOW') {
      (async () => {
        try { await this.ensureToken(); this.sendSocketNotification('SPOTIFY_REFRESH_RESULT', { success: true, expiry: this.expiry }); }
        catch (e) { this.sendSocketNotification('SPOTIFY_REFRESH_RESULT', { success: false, error: e.message }); }
      })();
      return;
    }
    // Only handle USER_ACTION socket notifications. We no longer respond to
    // raw BUTTON_PRESS socket notifications here to avoid reacting to global
    // BUTTON_PRESS messages emitted by other helpers (e.g. MMM-PhysicalButtons).
    // Physical button presses should be forwarded via the front-end as
    // USER_ACTION when appropriate.
    if (notification === 'USER_ACTION') {
      const action = payload && payload.action;
      this.handleAction(action).catch(e => this.log('Action error: ' + e.message));
    }
  },

  async ensureToken() {
    if (!fetchFn) throw new Error('fetch not available; install node-fetch or use Node.js 18+');
    const now = Date.now() / 1000;
    if (this.accessToken && this.expiry > now + 30) return this.accessToken;

    this.config.clientID = this.config.clientID || process.env.SPOTIFY_CLIENT_ID;
    this.config.clientSecret = this.config.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;
    this.config.refreshToken = this.config.refreshToken || process.env.SPOTIFY_REFRESH_TOKEN;

    try { if (!this.config.refreshToken && fs.existsSync(this.tokensFile)) { const p = JSON.parse(fs.readFileSync(this.tokensFile, 'utf8') || '{}'); if (p && p.refreshToken) this.config.refreshToken = p.refreshToken; } } catch (e) {}

    // Best-effort: try to extract credentials from global MagicMirror config file as a fallback
    if (!this.config.clientID || !this.config.clientSecret || !this.config.refreshToken) {
      try {
        const cfgPath = path.resolve(this.path || process.cwd(), '..', 'config', 'config.js');
        if (fs.existsSync(cfgPath)) {
          const cfgRaw = fs.readFileSync(cfgPath, 'utf8');
          const extract = (key) => {
            const re = new RegExp(key + "\\s*:\\s*[\"']([^\"']+)[\"']");
            const m = cfgRaw.match(re);
            return m ? m[1] : null;
          };
          if (!this.config.clientID) this.config.clientID = extract('clientID');
          if (!this.config.clientSecret) this.config.clientSecret = extract('clientSecret');
          if (!this.config.refreshToken) this.config.refreshToken = extract('refreshToken');
          if (this.config.clientID || this.config.clientSecret || this.config.refreshToken) this.log('Recovered Spotify credentials from config.js (best-effort)');
        }
      } catch (e) { /* ignore */ }
    }

    if (!this.config.clientID || !this.config.clientSecret || !this.config.refreshToken) throw new Error('Missing Spotify credentials for refresh');

    if (this._refreshPromise) return await this._refreshPromise;

    this._refreshPromise = (async () => {
      const body = new URLSearchParams(); body.append('grant_type', 'refresh_token'); body.append('refresh_token', this.config.refreshToken);
      const resp = await fetchFn('https://accounts.spotify.com/api/token', { method: 'POST', headers: { Authorization: 'Basic ' + base64Encode(`${this.config.clientID}:${this.config.clientSecret}`), 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      const txt = await resp.text(); if (!resp.ok) throw new Error('Token refresh failed: ' + txt);
      const data = JSON.parse(txt);
      this.accessToken = data.access_token; this.expiry = Date.now() / 1000 + (data.expires_in || 3600);
      if (data.refresh_token) this.config.refreshToken = data.refresh_token;
      try { fs.writeFileSync(this.tokensFile, JSON.stringify({ accessToken: this.accessToken, expiry: this.expiry, refreshToken: this.config.refreshToken }), { mode: 0o600 }); } catch (e) {}
      return this.accessToken;
    })();

    try { return await this._refreshPromise; } finally { this._refreshPromise = null; }
  },

  async api(method, path, body) {
    if (!fetchFn) throw new Error('fetch not available');
    const token = await this.ensureToken();
    const opts = { method, headers: { Authorization: `Bearer ${token}` } };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const url = 'https://api.spotify.com' + path;
    let r = await fetchFn(url, opts);
    if (r.status === 401) {
      this.accessToken = null; await this.ensureToken(); opts.headers.Authorization = `Bearer ${this.accessToken}`; r = await fetchFn(url, opts);
    }
    const txt = await r.text().catch(() => null);
    if (!r.ok && r.status !== 204) throw new Error(`Spotify API ${r.status}: ${txt || '<no body>'}`);
    if (r.status === 204) return null; try { return JSON.parse(txt); } catch (e) { return txt; }
  },

  async handleAction(action) {
    if (!action) return;
    // Map common button names to spotify actions (physical buttons often emit 'up','down','select')
    const actionMap = {
      down: 'spotify_next',
      up: 'spotify_prev',
      select: 'spotify_toggle',
      enter: 'spotify_toggle',
      next: 'spotify_next',
      prev: 'spotify_prev'
    };
    if (actionMap[action]) action = actionMap[action];

    switch (action) {
      case 'spotify_next': await this.api('POST', '/v1/me/player/next'); break;
      case 'spotify_prev': await this.api('POST', '/v1/me/player/previous'); break;
      case 'spotify_pause': await this.api('PUT', '/v1/me/player/pause'); break;
      case 'spotify_play': await this.api('PUT', '/v1/me/player/play'); break;
      default: this.log('Unknown action: ' + action); break;
    }
  },

  log(msg) { console.log('[MMM-SpotifyControl] ' + msg); }
});
