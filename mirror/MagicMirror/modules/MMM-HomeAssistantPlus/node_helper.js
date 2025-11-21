/* node_helper for MMM-HomeAssistantPlus */
const NodeHelper = require('node_helper');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

module.exports = NodeHelper.create({
  start() {
    this.config = {};
    this.log('HomeAssistantPlus helper started');
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'HA_PLUS_CONFIG') {
      this.log('Received HA_PLUS_CONFIG');
      this.config = Object.assign({}, this.config, payload || {});
      this.log(`Config entities: ${Array.isArray(this.config.entities) ? this.config.entities.length : 'none'}`);
      return;
    }
    if (notification === 'HA_PLUS_PING') {
      this.log('Received HA_PLUS_PING from frontend: ' + JSON.stringify(payload || {}));
      return;
    }
    if (notification === 'HA_PLUS_ACK') {
      this.log('Received HA_PLUS_ACK from frontend: ' + JSON.stringify(payload || {}));
      return;
    }
    if (notification === 'HA_PLUS_REFRESH') {
      this.log('HA_PLUS_REFRESH requested');
      this.refresh().catch(err => { this.log('Refresh error: ' + err.message); this.sendSocketNotification('HA_PLUS_ERROR', { message: err.message }); });
    }
  },

  async refresh() {
    if (!this.config || !this.config.baseUrl || !Array.isArray(this.config.entities)) {
      throw new Error('Missing configuration (baseUrl or entities)');
    }

    const base = this.config.baseUrl.replace(/\/$/, '');
    const headers = {};
    if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;

    this.log(`Refreshing ${this.config.entities.length} entities from ${base}`);

    const results = [];
    const snapshots = {};

    for (const e of this.config.entities) {
      const id = e.id || e.entity_id || e;
      try {
        // fetch entity state
        const s = await fetch(base + `/api/states/${encodeURIComponent(id)}`, { headers });
        if (!s.ok) {
          this.log(`Failed to fetch state for ${id}: ${s.status}`);
          results.push({ entity_id: id, state: null, attributes: {} });
          continue;
        }
        const json = await s.json();
        results.push(json);

        // if camera, fetch a snapshot (binary) and convert to base64
        if ((id || '').startsWith('camera')) {
          try {
            // camera snapshot endpoint
            const snapUrl = base + `/api/camera_proxy/${encodeURIComponent(id)}`;
            const r = await fetch(snapUrl, { headers });
            if (r.ok) {
              const buf = Buffer.from(await r.arrayBuffer());
              snapshots[id] = buf.toString('base64');
            } else {
              this.log(`Camera snapshot fetch failed for ${id}: ${r.status}`);
            }
          } catch (e) {
            this.log('Snapshot error for ' + id + ': ' + e.message);
          }
        }
      } catch (e) {
        this.log('Fetch error for ' + id + ': ' + e.message);
        results.push({ entity_id: id, state: null, attributes: {} });
      }
    }

    this.log('Refresh complete, sending update to frontend');
    this.sendSocketNotification('HA_PLUS_UPDATE', { entities: results, snapshots });
  },

  log(msg) { console.log('[MMM-HomeAssistantPlus] ' + msg); }
});
