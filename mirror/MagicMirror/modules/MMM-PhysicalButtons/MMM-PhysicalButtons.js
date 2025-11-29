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
    this.pressedAction = null;
    // Render the UI once config is sent
    this.updateDom(0);
    // Attach front-end keyboard listener so browser key presses trigger actions
    this._bindKeyboard();
  }
  ,
  // Map of active DOM keyboard handler so we can remove it on stop
  _bindKeyboard() {
    if (this._kbHandler) return;
    this._kbHandler = (ev) => {
      try {
        const key = ev.key;
        if (!key) return;
        // Look up mapping in config.keys (supports single-char or named keys)
        const keys = this.config && this.config.keys ? this.config.keys : {};
        for (const action of Object.keys(keys)) {
          const mapped = keys[action];
          if (!mapped) continue;
          if (String(mapped) === String(key) || mapped === key) {
            // simulate a press
            this.sendNotification('BUTTON_PRESS', { action });
            this._flashButton(action);
            // update debug
            this._dbg = { last: action, when: Date.now() };
            this.updateDom(0);
            ev.preventDefault();
            return;
          }
        }
      } catch (e) { Log.warn('kb handler error: ' + e.message); }
    };
    if (typeof document !== 'undefined' && document && document.addEventListener) {
      document.addEventListener('keydown', this._kbHandler);
      Log.info('MMM-PhysicalButtons: front-end keyboard listener attached');
    }
  },
  // Visible debug indicator for last action (helps confirm buttons work)
  _debugIndicator() {
    const now = new Date();
    if (!this._dbg) this._dbg = { last: null };
    return this._dbg;
  },

  socketNotificationReceived(notification, payload) {
    // The helper emits BUTTON_PRESS via sendSocketNotification; re-broadcast
    // it as a front-end notification so other modules (e.g. MMM-SpotifyControl)
    // that listen via notificationReceived can react to physical buttons.
    if (notification === 'BUTTON_PRESS') {
      Log.info('MMM-PhysicalButtons: received SOCKET BUTTON_PRESS from helper', payload);
      if (typeof console !== 'undefined' && console.log) console.log('MMM-PhysicalButtons socket BUTTON_PRESS', payload);
      // broadcast as front-end notification for other modules
      try { this.sendNotification('BUTTON_PRESS', payload); } catch (e) {}
      // update UI highlight
      try {
        const action = payload && payload.action;
        if (action) this._flashButton(action);
      } catch (e) { Log.warn('flashButton error: ' + (e && e.message)); }
    }
  },

  // Flash/highlight the button in the UI for a short time
  _flashButton(action) {
    this.pressedAction = action;
    this.updateDom(0);
    setTimeout(() => {
      this.pressedAction = null;
      this.updateDom(0);
    }, 350);
  },

  // Allow clicking the UI buttons to simulate a press (sends front-end notification)
  _onClickAction(action) {
    try {
      // Broadcast as front-end notification so listeners behave the same as real buttons
      this.sendNotification('BUTTON_PRESS', { action });
      // also locally flash the button
      this._flashButton(action);
      // update debug indicator
      this._dbg = { last: action, when: Date.now() };
      this.updateDom(0);
    } catch (e) {}
  },

  // Build the DOM for the module: show configured actions as clickable buttons
  getDom() {
    const wrapper = document.createElement('div');
    wrapper.className = 'mmm-physical-buttons';

    const header = document.createElement('div');
    header.className = 'pb-header';
    header.textContent = 'Buttons';
    wrapper.appendChild(header);

    const actions = new Set();
    (this.config && this.config.gpio) && Object.keys(this.config.gpio).forEach(a => { if (this.config.gpio[a] !== null) actions.add(a); });
    (this.config && this.config.keys) && Object.keys(this.config.keys).forEach(a => { if (this.config.keys[a] !== null) actions.add(a); });

    const grid = document.createElement('div');
    grid.className = 'pb-grid';

    if (actions.size === 0) {
      const n = document.createElement('div'); n.className = 'pb-none'; n.textContent = 'No actions configured'; grid.appendChild(n);
    } else {
      for (const action of Array.from(actions)) {
        const btn = document.createElement('button');
        btn.className = 'pb-btn';
        btn.dataset.action = action;
        btn.textContent = action.replace(/_/g, ' ');
        if (this.pressedAction === action) btn.classList.add('pressed');
        btn.addEventListener('click', () => this._onClickAction(action));
        grid.appendChild(btn);
      }
    }

    wrapper.appendChild(grid);
    // debug footer showing last pressed action and timestamp (always visible)
    const dbg = document.createElement('div'); dbg.className = 'pb-debug';
    const last = (this._dbg && this._dbg.last) ? this._dbg.last : 'none';
    const when = (this._dbg && this._dbg.when) ? new Date(this._dbg.when).toLocaleTimeString() : '-';
    dbg.textContent = `last: ${last} @ ${when}`;
    wrapper.appendChild(dbg);
    return wrapper;
  },

  getStyles() { return [this.file('styles.css')];
  },

  stop() {
    // remove front-end keyboard listener
    try {
      if (this._kbHandler && typeof document !== 'undefined' && document && document.removeEventListener) {
        document.removeEventListener('keydown', this._kbHandler);
        this._kbHandler = null;
      }
    } catch (e) {}
  },

  notificationReceived(notification, payload, sender) {
    // React to front-end notifications as well so the UI highlights when
    // other modules emit BUTTON_PRESS or USER_ACTION.
    if (notification === 'BUTTON_PRESS' || notification === 'USER_ACTION') {
      const action = payload && payload.action;
      Log.info('MMM-PhysicalButtons: notificationReceived ' + notification + ' -> ' + action);
      if (typeof console !== 'undefined' && console.log) console.log('MMM-PhysicalButtons notification', notification, payload);
      if (action) this._flashButton(action);
    }
  },
});
