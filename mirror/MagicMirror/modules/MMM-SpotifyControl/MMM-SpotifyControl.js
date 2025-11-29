/* global Module, Log */

Module.register("MMM-SpotifyControl", {
  defaults: {
    clientID: null,
    clientSecret: null,
    refreshToken: null,
    accessToken: null // optional
  },

  start() {
    // Send only defined config values to avoid overwriting server-side persisted credentials with nulls
    const cfg = {};
    ['clientID','clientSecret','refreshToken','accessToken','rateLimit'].forEach(k => {
      if (this.config[k] !== null && this.config[k] !== undefined) cfg[k] = this.config[k];
    });
    this.sendSocketNotification("SPOTIFY_CONFIG", cfg);
  }
,

  // Listen for user actions broadcasted by other modules and forward them to
  // this module's node_helper via sendSocketNotification so the helper can
  // perform API calls.
  notificationReceived(notification, payload, sender) {
    if (notification === 'USER_ACTION' || notification === 'BUTTON_PRESS') {
      // payload: { action: 'spotify_next' | 'spotify_pause' | ... }
      Log.info(`MMM-SpotifyControl: forwarding ${notification} -> USER_ACTION`, payload);
      this.sendSocketNotification('USER_ACTION', payload);
    }
  }
});
