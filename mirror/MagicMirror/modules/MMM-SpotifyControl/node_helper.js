/* node_helper for Spotify control */
const NodeHelper = require('node_helper');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

function base64Encode(s) { return Buffer.from(s).toString('base64'); }

module.exports = NodeHelper.create({
  start() {
    this.config = {};
    this.accessToken = null;
    this.expiry = 0;
    this.log('SpotifyControl helper started');
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'SPOTIFY_CONFIG') {
      this.config = Object.assign({}, this.config, payload || {});
      if (this.config.accessToken) {
        this.accessToken = this.config.accessToken;
      }
      return;
    }
    if (notification === 'BUTTON_PRESS' || notification === 'USER_ACTION') {
      const action = payload && payload.action;
      this.handleAction(action).catch(err => this.log('Action error: ' + err.message));
    }
  },

  async ensureToken() {
    const now = Date.now() / 1000;
    if (this.accessToken && this.expiry > now + 30) return this.accessToken;
    if (this.config.accessToken) {
      this.accessToken = this.config.accessToken;
      // no expiry info - assume valid short term
      this.expiry = now + 300;
      return this.accessToken;
    }
    // Support environment variable fallbacks for safer secret storage
    this.config.clientID = this.config.clientID || process.env.SPOTIFY_CLIENT_ID || process.env.CLIENT_ID || null;
    this.config.clientSecret = this.config.clientSecret || process.env.SPOTIFY_CLIENT_SECRET || process.env.CLIENT_SECRET || null;
    this.config.refreshToken = this.config.refreshToken || process.env.SPOTIFY_REFRESH_TOKEN || process.env.REFRESH_TOKEN || null;

    if (!this.config.clientID || !this.config.clientSecret || !this.config.refreshToken) {
      throw new Error('Missing Spotify credentials (clientID, clientSecret, refreshToken or accessToken)');
    }
    const body = new URLSearchParams();
    body.append('grant_type','refresh_token');
    body.append('refresh_token', this.config.refreshToken);

    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + base64Encode(`${this.config.clientID}:${this.config.clientSecret}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
    if (!resp.ok) throw new Error('Token refresh failed ' + resp.status);
    const data = await resp.json();
    this.accessToken = data.access_token;
    this.expiry = now + (data.expires_in || 3600);
    this.log('Obtained Spotify access token');
    return this.accessToken;
  },

  async api(method, path, body) {
    const token = await this.ensureToken();
    const opts = { method, headers: { Authorization: `Bearer ${token}` } };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const url = 'https://api.spotify.com' + path;
    const r = await fetch(url, opts);
    if (!r.ok && r.status !== 204) {
      const txt = await r.text();
      throw new Error(`Spotify API ${r.status}: ${txt}`);
    }
    if (r.status === 204) return null;
    return r.json();
  },

  async handleAction(action) {
    if (!action) return;
    switch(action) {
      case 'spotify_next':
        await this.api('POST','/v1/me/player/next');
        break;
      case 'spotify_prev':
        await this.api('POST','/v1/me/player/previous');
        break;
      case 'spotify_pause':
        await this.api('PUT','/v1/me/player/pause');
        break;
      case 'spotify_play':
        await this.api('PUT','/v1/me/player/play');
        break;
      case 'spotify_toggle':
        // get playback state, then pause or play
        try {
          const state = await this.api('GET','/v1/me/player');
          if (state && state.is_playing) await this.api('PUT','/v1/me/player/pause'); else await this.api('PUT','/v1/me/player/play');
        } catch (e) {
          // if error, attempt play
          await this.api('PUT','/v1/me/player/play');
        }
        break;
      default:
        // ignore
        break;
    }
  },

  log(msg) { console.log('[MMM-SpotifyControl] ' + msg); }
});
