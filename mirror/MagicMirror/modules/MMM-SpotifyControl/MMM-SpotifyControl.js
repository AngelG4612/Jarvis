/* global Module, Log */

Module.register("MMM-SpotifyControl", {
  defaults: {
    clientID: null,
    clientSecret: null,
    refreshToken: null,
    accessToken: null // optional
    ,
    // When false the control module will not forward actions or send config
    visible: true
  },

  start() {
    // If configured hidden, mark disabled and don't send config to helper
    this._disabled = !!(this.config && this.config.visible === false);
    if (this._disabled) {
      Log.info('MMM-SpotifyControl: disabled via config.visible=false');
      return;
    }
    // Send only defined config values to avoid overwriting server-side persisted credentials with nulls
    const cfg = {};
    ['clientID','clientSecret','refreshToken','accessToken','rateLimit'].forEach(k => {
      if (this.config[k] !== null && this.config[k] !== undefined) cfg[k] = this.config[k];
    });
    this.sendSocketNotification("SPOTIFY_CONFIG", cfg);
  }
,

  // Render nothing when configured hidden. Without a getDom() override
  // MagicMirror will still create a module wrapper; return an empty hidden
  // element so the module appears absent in the UI when `visible:false`.
  getDom() {
    if (this.config && this.config.visible === false) {
      try {
        const n = document.createElement('div');
        n.style.display = 'none';
        return n;
      } catch (e) {
        return document.createElement('div');
      }
    }
    // Minimal placeholder (no visible UI)
    try { return document.createElement('div'); } catch (e) { return document.createElement('div'); }
  },

  // Listen for user actions and forward relevant ones to the node_helper to
  // perform Spotify API calls. Ignore generic navigation `up`/`down` broadcasts
  // that originate from other modules to avoid accidental skips.
  notificationReceived(notification, payload, sender) {
    if (this._disabled) return;
    // Ignore raw BUTTON_PRESS broadcasts here. The front-end modules (e.g.
    // MMM-SpotifyPlayer) will respond to BUTTON_PRESS for UI selection. We
    // avoid forwarding BUTTON_PRESS to the control helper to prevent
    // accidental mapping of navigation (up/down) to spotify_prev/next.
    if (notification === 'BUTTON_PRESS') {
      Log.info(`MMM-SpotifyControl: ignoring BUTTON_PRESS (front-end handles navigation)`, payload);
      return;
    }

    // For USER_ACTION, be selective:
    // - forward if action already names a spotify_* command
    // - forward if the action originates from this module's own UI (sender matches)
    // - otherwise ignore navigation actions from external broadcasters
    if (notification === 'USER_ACTION') {
      const action = payload && payload.action;
      const isSpotify = typeof action === 'string' && action.startsWith && action.startsWith('spotify');
      const isLocal = sender && sender.name === this.name;
      if (isSpotify || isLocal) {
        Log.info(`MMM-SpotifyControl: forwarding USER_ACTION -> USER_ACTION`, payload);
        this.sendSocketNotification('USER_ACTION', payload);
      } else {
        Log.info(`MMM-SpotifyControl: ignoring external USER_ACTION`, payload);
      }
    }
  }
});
