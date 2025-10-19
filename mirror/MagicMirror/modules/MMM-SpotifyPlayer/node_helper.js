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