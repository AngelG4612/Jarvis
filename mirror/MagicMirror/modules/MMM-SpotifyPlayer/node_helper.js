const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  start() {
    console.log("[MMM-SpotifyPlayer] Node helper started");
    this.accessToken = null;
    this.tokenExpiry = 0;
  },

  async socketNotificationReceived(notification, payload) {
    switch (notification) {
      case "GET_SPOTIFY_DATA":
        await this.ensureAccessToken(payload);
        const data = await this.fetchSpotifyData();
        this.sendSocketNotification("SPOTIFY_DATA", data);
        break;
      case "SPOTIFY_PLAYPAUSE":
        await this.ensureAccessToken(payload);
        await this.togglePlayPause();
        break;
      case "SPOTIFY_NEXT":
        await this.ensureAccessToken(payload);
        await this.nextTrack();
        break;
      case "SPOTIFY_PREV":
        await this.ensureAccessToken(payload);
        await this.prevTrack();
        break;
    }
  },

  async ensureAccessToken(config) {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry - 60000) return; // still valid

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
      client_id: config.clientID,
      client_secret: config.clientSecret
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!response.ok) {
      console.error("[MMM-SpotifyPlayer] Failed to refresh token");
      return;
    }

    const json = await response.json();
    this.accessToken = json.access_token;
    this.tokenExpiry = now + json.expires_in * 1000;
    console.log("[MMM-SpotifyPlayer] Access token refreshed ✅");
  },

  async fetchSpotifyData() {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });

    if (!response.ok) return { track: null, isPlaying: false };
    const json = await response.json();

    return {
      track: {
        title: json.item.name,
        artist: json.item.artists.map(a => a.name).join(", "),
        albumArt: json.item.album.images[0].url
      },
      isPlaying: json.is_playing
    };
  },

  async togglePlayPause() {
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    const data = await response.json();
    const isPlaying = data.is_playing;

    const url = isPlaying
      ? "https://api.spotify.com/v1/me/player/pause"
      : "https://api.spotify.com/v1/me/player/play";

    await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
  },

  async nextTrack() {
    await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
  },

  async prevTrack() {
    await fetch("https://api.spotify.com/v1/me/player/previous", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
  }
});
