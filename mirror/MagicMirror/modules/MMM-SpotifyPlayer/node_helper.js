<<<<<<< HEAD
const NodeHelper = require("node_helper");
const https = require("https");
const querystring = require("querystring");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.config = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpires = null;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.accessToken = payload.accessToken;
            this.refreshToken = payload.refreshToken;
            console.log("MMM-SpotifyPlayer: Config received");
            
            // Validate required config
            if (!this.config.clientID || !this.config.clientSecret) {
                this.sendSocketNotification("SPOTIFY_ERROR", "Missing clientID or clientSecret in config");
                return;
            }
            
            // If we have tokens, validate them
            if (this.accessToken) {
                this.getCurrentTrack();
            } else {
                this.sendSocketNotification("SPOTIFY_ERROR", "No access token provided. Please authenticate with Spotify first.");
            }
        } else if (notification === "GET_CURRENT_TRACK") {
            this.getCurrentTrack();
        }
    },

    getCurrentTrack: function() {
        if (!this.accessToken) {
            this.sendSocketNotification("SPOTIFY_ERROR", "No access token available");
            return;
        }

        // Check if token needs refresh
        if (this.tokenExpires && Date.now() > this.tokenExpires) {
            this.refreshAccessToken();
            return;
        }

        const options = {
            hostname: 'api.spotify.com',
            port: 443,
            path: '/v1/me/player/currently-playing',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const spotifyData = JSON.parse(data);
                        this.sendSocketNotification("SPOTIFY_DATA", spotifyData);
                    } catch (error) {
                        console.error("MMM-SpotifyPlayer: Error parsing JSON:", error);
                        this.sendSocketNotification("SPOTIFY_ERROR", "Error parsing Spotify response");
                    }
                } else if (res.statusCode === 204) {
                    // No content - no music playing
                    this.sendSocketNotification("SPOTIFY_NO_PLAYBACK");
                } else if (res.statusCode === 401) {
                    // Unauthorized - token expired or invalid
                    console.log("MMM-SpotifyPlayer: Token expired, attempting to refresh");
                    this.refreshAccessToken();
                } else {
                    console.error(`MMM-SpotifyPlayer: HTTP ${res.statusCode}: ${data}`);
                    this.sendSocketNotification("SPOTIFY_ERROR", `HTTP ${res.statusCode}: ${data}`);
                }
            });
        });

        req.on('error', (error) => {
            console.error("MMM-SpotifyPlayer: Request error:", error);
            this.sendSocketNotification("SPOTIFY_ERROR", "Network error: " + error.message);
        });

        req.end();
    },

    refreshAccessToken: function() {
        if (!this.refreshToken) {
            this.sendSocketNotification("SPOTIFY_ERROR", "No refresh token available. Please re-authenticate.");
            return;
        }

        const postData = querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken
        });

        const auth = Buffer.from(`${this.config.clientID}:${this.config.clientSecret}`).toString('base64');

        const options = {
            hostname: 'accounts.spotify.com',
            port: 443,
            path: '/api/token',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const tokenData = JSON.parse(data);
                        this.accessToken = tokenData.access_token;
                        
                        // Update refresh token if provided
                        if (tokenData.refresh_token) {
                            this.refreshToken = tokenData.refresh_token;
                        }
                        
                        // Set expiration time
                        this.tokenExpires = Date.now() + (tokenData.expires_in * 1000);
                        
                        console.log("MMM-SpotifyPlayer: Access token refreshed successfully");
                        
                        // Retry the original request
                        this.getCurrentTrack();
                    } catch (error) {
                        console.error("MMM-SpotifyPlayer: Error parsing token response:", error);
                        this.sendSocketNotification("SPOTIFY_ERROR", "Error refreshing token");
                    }
                } else {
                    console.error(`MMM-SpotifyPlayer: Token refresh failed with status ${res.statusCode}: ${data}`);
                    this.sendSocketNotification("SPOTIFY_ERROR", "Failed to refresh access token");
                }
            });
        });

        req.on('error', (error) => {
            console.error("MMM-SpotifyPlayer: Token refresh error:", error);
            this.sendSocketNotification("SPOTIFY_ERROR", "Network error during token refresh");
        });

        req.write(postData);
        req.end();
    }
});
=======
/* node_helper for MMM-SpotifyPlayer: polls Spotify /v1/me/player and sends SPOTIFY_PLAYER_STATE */
const NodeHelper = require('node_helper');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

function base64Encode(s) { return Buffer.from(s).toString('base64'); }

module.exports = NodeHelper.create({
  start() {
    this.config = {};
    this.accessToken = null;
    this.expiry = 0;
    this.pollRef = null;
    this.log('SpotifyPlayer helper started');
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'SPOTIFY_PLAYER_CONFIG') {
      this.config = Object.assign({}, this.config, payload || {});
      this.startPolling();
    } else if (notification === 'SPOTIFY_PLAYER_REFRESH') {
      this.fetchState().catch(err => this.sendSocketNotification('SPOTIFY_PLAYER_ERROR', { message: err.message }));
    }
  },

  async ensureToken() {
    const now = Date.now() / 1000;
    if (this.accessToken && this.expiry > now + 30) return this.accessToken;
    // env fallbacks
    this.config.clientID = this.config.clientID || process.env.SPOTIFY_CLIENT_ID || null;
    this.config.clientSecret = this.config.clientSecret || process.env.SPOTIFY_CLIENT_SECRET || null;
    this.config.refreshToken = this.config.refreshToken || process.env.SPOTIFY_REFRESH_TOKEN || null;

    if (!this.config.clientID || !this.config.clientSecret || !this.config.refreshToken) {
      throw new Error('Missing Spotify credentials (clientID, clientSecret, refreshToken)');
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

  async fetchState() {
    const token = await this.ensureToken();
    const r = await fetch('https://api.spotify.com/v1/me/player', { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 204) {
      // no active device or no content
      this.sendSocketNotification('SPOTIFY_PLAYER_STATE', null);
      return null;
    }
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Spotify API ${r.status}: ${txt}`);
    }
    const json = await r.json();
    this.sendSocketNotification('SPOTIFY_PLAYER_STATE', json);
    return json;
  },

  startPolling() {
    if (this.pollRef) clearInterval(this.pollRef);
    const period = Math.max(2000, Number(this.config.updateInterval) || 5000);
    this.fetchState().catch(err => this.sendSocketNotification('SPOTIFY_PLAYER_ERROR', { message: err.message }));
    this.pollRef = setInterval(() => this.fetchState().catch(err => this.sendSocketNotification('SPOTIFY_PLAYER_ERROR', { message: err.message })), period);
    this.log(`Spotify polling every ${period}ms`);
  },

  stop() {
    if (this.pollRef) clearInterval(this.pollRef);
  },

  log(msg) { console.log('[MMM-SpotifyPlayer] ' + msg); }
});
>>>>>>> origin/controls
