/* global Module, Log */

Module.register('MMM-HomeAssistantPlus', {
  defaults: {
    baseUrl: 'http://localhost:8123',
    token: null,
    updateInterval: 10000,
    entities: [], // [{ id: 'camera.living_room', name: 'Living Room' }, { id: 'sensor.xxx' }]
    // Fallback debug UI options
    fallbackEnabled: true,
    fallbackPosition: 'bottom_right', // one of: top_left, top_right, bottom_left, bottom_right
    fallbackMaxWidth: 420
  },

  start() {
    this.data = { entities: [] , snapshots: {} };
    // styles are provided via getStyles(); avoid manipulating document here
    Log.info('MMM-HomeAssistantPlus: start() called, sending config');
    this.sendSocketNotification('HA_PLUS_CONFIG', this.config);
  // Send a ping so the node_helper can log that the front-end started
  try { this.sendSocketNotification('HA_PLUS_PING', { moduleId: this.identifier }); } catch (e) {}
    // request initial refresh
    this.sendSocketNotification('HA_PLUS_REFRESH');
    this.updateTimer = setInterval(() => this.sendSocketNotification('HA_PLUS_REFRESH'), this.config.updateInterval || 10000);
    // don't call updateDom here because the module may not be attached to the DOM yet
    this._pendingUpdate = false;

    // Use an internal status string for lightweight debug info that is rendered
    // inside the module's DOM. Avoid creating any floating or fixed-position
    // elements that would override MagicMirror's configured layout/positioning.
    this._status = 'starting';

    // Do not poll or touch the DOM here. MagicMirror will call getDom when
    // the module container is ready. We'll render on incoming data.
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'HA_PLUS_UPDATE') {
      Log.info('MMM-HomeAssistantPlus: received HA_PLUS_UPDATE');
      this.data = payload || { entities: [], snapshots: {} };
      // acknowledge update for debugging
      try { this.sendSocketNotification('HA_PLUS_ACK', { count: (this.data.entities || []).length }); } catch(e) {}
      // Update lightweight internal status and render the module DOM.
      // Call updateDom() so MagicMirror will place the returned DOM into the
      // configured region. Avoid touching document.body or creating global DOM.
      try {
        this._status = 'updated: ' + ((this.data && this.data.entities) ? this.data.entities.length : 0) + ' entities';
      } catch (e) {
        this._status = 'updated';
      }
  try { this.updateDom(0); this._pendingUpdate = false; } catch (e) { Log.warn('MMM-HomeAssistantPlus: updateDom failed: ' + (e && e.message)); }
  // update (or create) the floating fallback so user can always see data
  try { this._updateFallback(); } catch (e) { Log.warn('MMM-HomeAssistantPlus: fallback update failed: ' + (e && e.message)); }
    } else if (notification === 'HA_PLUS_ERROR') {
      Log.error('MMM-HomeAssistantPlus: ' + (payload && payload.message ? payload.message : 'error'));
      this._status = 'ERROR: ' + (payload && payload.message ? payload.message : 'error');
    }
  },

  getDom() {
    const wrapper = document.createElement('div');
    wrapper.className = 'mmm-ha-plus';
  // do not set a custom id on the root wrapper; MagicMirror provides the
  // module container element with the module identifier. Avoid creating
  // conflicting or unexpected ids.
  try { /* no-op: intentionally not setting wrapper.id */ } catch(e) {}
  // helpful console log for runtime debugging when devtools are open
  try { if (typeof console !== 'undefined' && console.log) console.log('MMM-HomeAssistantPlus.getDom called; module identifier=', this.identifier); } catch(e) {}
  Log.info('MMM-HomeAssistantPlus: getDom() rendering, entities count = ' + (this.data && Array.isArray(this.data.entities) ? this.data.entities.length : 'no-data'));

  // Always show a small header with a lightweight status so the module is
  // visible and reports basic state inside the module DOM.
  const count = (this.data && Array.isArray(this.data.entities) ? this.data.entities.length : 0);
  const status = (this._status ? ' — ' + this._status : '');
  const hdr = document.createElement('div'); hdr.style.fontWeight = 'bold'; hdr.style.marginBottom = '6px'; hdr.textContent = 'HomeAssistantPlus — entities: ' + count + status;
    wrapper.appendChild(hdr);

    if (!this.data || !Array.isArray(this.data.entities)) {
      wrapper.textContent = 'No data';
      return wrapper;
    }

    const grid = document.createElement('div');
    grid.className = 'ha-plus-grid';

    for (const ent of this.data.entities) {
      const el = document.createElement('div');
      el.className = 'ha-plus-card';
      const title = document.createElement('div'); title.className = 'ha-plus-title'; title.textContent = ent.name || ent.entity_id || ent.entity_id;
      el.appendChild(title);

      // camera entity: show snapshot image if available
      if ((ent.entity_id || '').startsWith('camera')) {
        const snap = this.data.snapshots && this.data.snapshots[ent.entity_id];
        if (snap) {
          const img = document.createElement('img'); img.className = 'ha-plus-camera'; img.src = 'data:image/jpeg;base64,' + snap;
          el.appendChild(img);
        } else {
          const msg = document.createElement('div'); msg.className = 'ha-plus-empty'; msg.textContent = 'No camera image'; el.appendChild(msg);
        }
        // show state/attributes small
        const stateLine = document.createElement('div'); stateLine.className = 'ha-plus-state'; stateLine.textContent = ent.state || '';
        el.appendChild(stateLine);
      } else {
        // generic entity: show state and key attributes
        const s = document.createElement('div'); s.className = 'ha-plus-state-large'; s.textContent = ent.state || '';
        el.appendChild(s);
        if (ent.attributes) {
          const attrs = document.createElement('div'); attrs.className = 'ha-plus-attrs';
          const keys = ['unit_of_measurement','friendly_name','battery_level'];
          for (const k of keys) {
            if (typeof ent.attributes[k] !== 'undefined') {
              const kv = document.createElement('div'); kv.className = 'ha-plus-attr'; kv.textContent = `${k}: ${ent.attributes[k]}`; attrs.appendChild(kv);
            }
          }
          el.appendChild(attrs);
        }
      }

      grid.appendChild(el);
    }

    wrapper.appendChild(grid);
    // If an update was deferred while the module wasn't displayed, schedule an update
    if (this._pendingUpdate) {
      setTimeout(() => {
        try {
          if (typeof document !== 'undefined' && document.getElementById(this.identifier)) {
            this.updateDom(0);
            this._pendingUpdate = false;
            this._status = 'DOM updated after deferred';
          }
        } catch (e) {}
      }, 50);
    }

    // Do not create floating/fixed DOM outside of the module container. The
    // module must render inside the region specified in config.js so it does
    // not overlap or block other modules.

    return wrapper;
  },

  // Let MagicMirror include our stylesheet via its built-in loader.
  getStyles() {
    return [this.file('styles.css')];
  },

  // Create or update a floating fallback element (center-right) when
  // `fallbackEnabled` is true. This mirrors the previous behavior the user
  // found helpful. The element is injected into document.body and cleaned up
  // on stop().
  _updateFallback() {
    try {
      const enabled = (this.config && typeof this.config.fallbackEnabled !== 'undefined') ? this.config.fallbackEnabled : true;
      if (!enabled) {
        this._removeFallback();
        return;
      }
      if (typeof document === 'undefined' || !document.body) return;
      const fbId = 'mmm-ha-plus-fallback-' + (this.identifier || 'unknown');
      let fb = document.getElementById(fbId);
      if (!fb) {
        fb = document.createElement('div');
        fb.id = fbId;
        fb.style.position = 'fixed';
        // center-right placement
        fb.style.top = '50%';
        fb.style.right = '8px';
        fb.style.transform = 'translateY(-50%)';
        fb.style.zIndex = '999999';
        fb.style.background = 'rgba(0,0,0,0.9)';
        fb.style.color = '#fff';
        fb.style.padding = '10px';
        fb.style.borderRadius = '6px';
        fb.style.pointerEvents = 'none';
        fb.style.maxWidth = (this.config && this.config.fallbackMaxWidth) ? String(this.config.fallbackMaxWidth) + 'px' : '420px';
        fb.style.maxHeight = '80vh';
        fb.style.overflow = 'auto';
        document.body.appendChild(fb);
      }
      // fill content
      fb.innerHTML = '';
      const h = document.createElement('div'); h.style.fontWeight = 'bold'; h.style.marginBottom = '8px'; h.textContent = 'HomeAssistantPlus — ' + (this.data && Array.isArray(this.data.entities) ? this.data.entities.length : 0) + ' entities';
      fb.appendChild(h);
      for (const ent of (this.data && this.data.entities) || []) {
        const item = document.createElement('div'); item.style.marginBottom = '6px';
        const label = document.createElement('div'); label.textContent = (ent.entity_id || ent.id || '') + ': ' + (ent.state || '');
        item.appendChild(label);
        if ((ent.entity_id || '').startsWith('camera')) {
          const snap = this.data.snapshots && this.data.snapshots[ent.entity_id];
          if (snap) {
            const img = document.createElement('img'); img.src = 'data:image/jpeg;base64,' + snap; img.style.width = '240px'; img.style.display = 'block'; img.style.marginTop = '6px'; img.style.borderRadius = '4px'; item.appendChild(img);
          }
        }
        fb.appendChild(item);
      }
    } catch (e) {
      Log.warn('MMM-HomeAssistantPlus: _updateFallback error: ' + (e && e.message));
    }
  },

  _removeFallback() {
    try {
      if (typeof document === 'undefined') return;
      const fb = document.getElementById('mmm-ha-plus-fallback-' + (this.identifier || 'unknown'));
      if (fb && fb.parentNode) fb.parentNode.removeChild(fb);
    } catch (e) {
      // ignore
    }
  },


  notificationReceived(notification, payload, sender) {
    // allow external refresh triggers
    if (notification === 'HA_PLUS_REFRESH') this.sendSocketNotification('HA_PLUS_REFRESH');
  },

  stop() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    // remove fallback if present
    try { this._removeFallback(); } catch (e) {}
  }
});
