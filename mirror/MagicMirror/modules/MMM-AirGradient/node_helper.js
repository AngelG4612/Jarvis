const NodeHelper = require('node_helper');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

module.exports = NodeHelper.create({
  start() {
    this.config = {};
    this.log('AirGradient helper started');
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'AIRG_CONFIG') {
      this.config = Object.assign({}, this.config, payload || {});
      this.log('Received AIRG_CONFIG');
      return;
    }
    if (notification === 'AIRG_REFRESH') {
      this.log('AIRG_REFRESH requested');
      this.refresh().catch(err => { this.log('Refresh error: ' + err.message); this.sendSocketNotification('AIRG_ERROR', { message: err.message }); });
    }
  },

  async refresh() {
    if (!this.config || !this.config.baseUrl) throw new Error('Missing baseUrl in config');
    const base = this.config.baseUrl.replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;

    // If explicit entities provided, use them. Otherwise fetch all states and filter
    let targetEntities = [];
    if (Array.isArray(this.config.entities) && this.config.entities.length) {
      targetEntities = this.config.entities.map(e => (e.id || e.entity_id || e));
    } else {
      // fetch all states and filter by search term
      const all = await (await fetch(base + '/api/states', { headers })).json();
      const search = (this.config.search || 'airgradient').toLowerCase();
      targetEntities = all.filter(s => (s.entity_id || '').toLowerCase().includes(search)).map(s => s.entity_id);
    }

    if (!targetEntities.length) {
      this.log('No AirGradient entities found');
      this.sendSocketNotification('AIRG_UPDATE', { entities: [] });
      return;
    }

    const results = [];
    for (const id of targetEntities) {
      try {
        const r = await fetch(base + `/api/states/${encodeURIComponent(id)}`, { headers });
        if (!r.ok) {
          this.log(`Failed to fetch ${id}: ${r.status}`);
          continue;
        }
        const json = await r.json();
        results.push(json);
      } catch (e) {
        this.log('Fetch error for ' + id + ': ' + e.message);
      }
    }

    this.log('Refresh complete, sending AIRG_UPDATE with ' + results.length + ' entities');
    this.sendSocketNotification('AIRG_UPDATE', { entities: results });
  },

  log(m) { console.log('[MMM-AirGradient] ' + m); }
});
