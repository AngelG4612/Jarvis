/* global Module, Log */

Module.register('MMM-AirGradient', {
  defaults: {
    baseUrl: 'http://localhost:8123',
    token: null,
    updateInterval: 15000,
    // Either provide explicit entity ids, or a search string to match entity_id
    entities: [],
    search: 'airgradient',
    showAttributes: ['unit_of_measurement','friendly_name']
  },

  start() {
    this.data = { entities: [] };
    Log.info('MMM-AirGradient: starting, sending config to helper');
    this.sendSocketNotification('AIRG_CONFIG', this.config);
    this.sendSocketNotification('AIRG_REFRESH');
    this.updateTimer = setInterval(() => this.sendSocketNotification('AIRG_REFRESH'), this.config.updateInterval || 15000);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'AIRG_UPDATE') {
      this.data = payload || { entities: [] };
      this.updateDom(0);
    } else if (notification === 'AIRG_ERROR') {
      Log.error('MMM-AirGradient: ' + (payload && payload.message));
      this.data = { entities: [], error: payload && payload.message };
      this.updateDom(0);
    }
  },

  getDom() {
    const wrapper = document.createElement('div');
    wrapper.className = 'mmm-airgradient';

    const title = document.createElement('div');
    title.className = 'ag-title';
    title.textContent = 'AirGradient Sensors';
    wrapper.appendChild(title);

    if (this.data && this.data.error) {
      const err = document.createElement('div'); err.className = 'ag-error'; err.textContent = 'Error: ' + this.data.error; wrapper.appendChild(err); return wrapper;
    }

    const list = document.createElement('div'); list.className = 'ag-list';
    const ents = Array.isArray(this.data.entities) ? this.data.entities : [];
    if (ents.length === 0) {
      const empty = document.createElement('div'); empty.className = 'ag-empty'; empty.textContent = 'No AirGradient sensors found'; list.appendChild(empty);
    } else {
      for (const s of ents) {
        const card = document.createElement('div'); card.className = 'ag-card';
        const name = document.createElement('div'); name.className = 'ag-name'; name.textContent = s.attributes && s.attributes.friendly_name ? s.attributes.friendly_name : s.entity_id;
        const val = document.createElement('div'); val.className = 'ag-value'; val.textContent = (s.state || '') + (s.attributes && s.attributes.unit_of_measurement ? ' ' + s.attributes.unit_of_measurement : '');
        card.appendChild(name); card.appendChild(val);

        // show some attributes if present
        const attrs = document.createElement('div'); attrs.className = 'ag-attrs';
        const keys = Array.isArray(this.config.showAttributes) ? this.config.showAttributes : [];
        for (const k of keys) {
          if (s.attributes && typeof s.attributes[k] !== 'undefined') {
            const a = document.createElement('div'); a.className = 'ag-attr'; a.textContent = `${k}: ${s.attributes[k]}`; attrs.appendChild(a);
          }
        }
        if (attrs.childNodes.length) card.appendChild(attrs);
        list.appendChild(card);
      }
    }

    wrapper.appendChild(list);
    return wrapper;
  },

  getStyles() { return [this.file('styles.css')]; },

  notificationReceived(notification, payload, sender) {
    if (notification === 'AIRG_REFRESH') this.sendSocketNotification('AIRG_REFRESH');
  },

  stop() {
    if (this.updateTimer) clearInterval(this.updateTimer);
  }

});
