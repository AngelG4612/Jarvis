/* global Module, Log */

Module.register("MMM-SpotifyControl", {
  defaults: {
    clientID: null,
    clientSecret: null,
    refreshToken: null,
    accessToken: null // optional
  },

  start() {
    this.sendSocketNotification("SPOTIFY_CONFIG", this.config);
  }
});
