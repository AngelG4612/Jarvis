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
,

  // Listen for user actions broadcasted by other modules and forward them to
  // this module's node_helper via sendSocketNotification so the helper can
  // perform API calls.
  notificationReceived(notification, payload, sender) {
    if (notification === 'USER_ACTION' || notification === 'BUTTON_PRESS') {
      // payload: { action: 'spotify_next' | 'spotify_pause' | ... }
      this.sendSocketNotification('USER_ACTION', payload);
    }
  }
});
