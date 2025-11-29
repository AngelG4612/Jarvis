/* global Module, Log */

Module.register("MMM-PhysicalButtons", {
  defaults: {
    // mapping of logical actions to pins (on Pi) or keys (for laptop testing)
    gpio: {
      up: null,
      down: null,
      select: null,
      back: null,
      spotify_next: null,
      spotify_prev: null,
      spotify_pause: null
    },
    // keyboard fallback for local testing: map actions to key codes or key names
    keys: {
      up: "ArrowUp",
      down: "ArrowDown",
      select: "Enter",
      spotify_next: ">",
      spotify_prev: "<",
      spotify_pause: " "
    }
  },

  start() {
    this.sendSocketNotification("PB_CONFIG", this.config);
  }
,

  socketNotificationReceived(notification, payload) {
    // The helper emits BUTTON_PRESS via sendSocketNotification; re-broadcast
    // it as a front-end notification so other modules (e.g. MMM-SpotifyControl)
    // that listen via notificationReceived can react to physical buttons.
    if (notification === 'BUTTON_PRESS') {
      Log.info('MMM-PhysicalButtons: received BUTTON_PRESS from helper, broadcasting');
      this.sendNotification('BUTTON_PRESS', payload);
    }
  }
});
