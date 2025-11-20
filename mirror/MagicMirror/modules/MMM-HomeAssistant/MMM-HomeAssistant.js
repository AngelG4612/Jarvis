/* global Module, Log */

Module.register("MMM-HomeAssistant", {
  defaults: {
    title: "Home Assistant",
    baseUrl: '', // from secrets.yaml
    token: '', // from secrets.yaml
    useWebSocket: true,
    restPollSeconds: 15,
    showLastChanged: true,
    showUnavailable: false,
    sortBy: "name", // or "state"
    entities: [
      // { id: "light.master_bedroom_main_lights", name: "Master Bedroom Lights", icon: "fa-lightbulb" }
    ],
    // New: enable responding to external button events
    enableButtonControl: true
  },

  start() {
    this.states = {}; // entity_id -> { state, attributes, last_changed }
    this.loaded = false;
    this.selectedIndex = 0; // which row is currently selected
    this.records = [];
    this.sendSocketNotification("HA_CONFIG", this.config);
  },

  // Compute a simple render key for the configured records (ids, names, icons)
  _computeRecordsKey(records) {
    if (!Array.isArray(records)) return '';
    return records.map(r => `${r.id}::${(r.conf && r.conf.name)||''}::${(r.conf && r.conf.icon)||''}`).join('|');
  },

  // Build a lightweight records array from current config and states (no DOM creation)
  _buildRecordsArray() {
    const cfg = Array.isArray(this.config.entities) ? this.config.entities : [];
    const confMap = new Map(cfg.map((e) => [e.id, e]));

    const records = [];
    for (const [id, c] of confMap.entries()) {
      const s = this.states[id];
      if (!s) {
        if (this.config.showUnavailable) {
          records.push({ id, conf: c, state: { state: "unavailable", attributes: {}, last_changed: null } });
        }
        continue;
      }
      records.push({ id, conf: c, state: s });
    }

    if (this.config.sortBy === "state") {
      records.sort((a, b) => String(a.state.state).localeCompare(String(b.state.state)));
    } else {
      records.sort((a, b) => String(a.conf.name || a.id).localeCompare(String(b.conf.name || b.id)));
    }
    return records;
  },

  getStyles() {
    // MagicMirror provides Font Awesome globally as 'font-awesome.css'
    return [this.file("styles.css"), "font-awesome.css"];
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-ha";

    const heading = document.createElement("div");
    heading.className = "mmm-ha-title";
    heading.textContent = this.config.title;
    wrapper.appendChild(heading);

    const list = document.createElement("div");
    list.className = "mmm-ha-list";

    const items = this.buildItems();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "mmm-ha-empty";
      if (!this.loaded) {
        empty.textContent = "Loading...";
      } else if (this.errorMessage) {
        empty.textContent = `Error: ${this.errorMessage}`;
      } else {
        empty.textContent = "No entities configured or available.";
      }
      list.appendChild(empty);
    } else {
      items.forEach((row) => list.appendChild(row));
    }

    wrapper.appendChild(list);
    return wrapper;
  },

  buildItems() {
    const out = [];
    const cfg = Array.isArray(this.config.entities) ? this.config.entities : [];
    const confMap = new Map(cfg.map((e) => [e.id, e]));

    const records = [];
    for (const [id, c] of confMap.entries()) {
      const s = this.states[id];
      if (!s) {
        if (this.config.showUnavailable) {
          records.push({ id, conf: c, state: { state: "unavailable", attributes: {}, last_changed: null } });
        }
        continue;
      }
      records.push({ id, conf: c, state: s });
    }

    if (this.config.sortBy === "state") {
      records.sort((a, b) => String(a.state.state).localeCompare(String(b.state.state)));
    } else {
      records.sort((a, b) => String(a.conf.name || a.id).localeCompare(String(b.conf.name || b.id)));
    }

    // Save records for selection logic
    this.records = records;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const row = document.createElement("div");
      row.className = "mmm-ha-row";
      if (i === this.selectedIndex) row.classList.add("selected");

      const left = document.createElement("div");
      left.className = "mmm-ha-left";

      if (r.conf.icon) {
        const iEl = document.createElement("i");
        iEl.className = `fa ${r.conf.icon}`;
        left.appendChild(iEl);
      }

      const name = document.createElement("span");
      name.className = "mmm-ha-name";
      name.textContent = r.conf.name || r.id;
      left.appendChild(name);

      const right = document.createElement("div");
      right.className = "mmm-ha-right";

      const state = document.createElement("span");
      state.className = "mmm-ha-state";
      state.textContent = this.formatState(r.id, r.state);
      right.appendChild(state);

      if (this.config.showLastChanged && r.state.last_changed) {
        const time = document.createElement("span");
        time.className = "mmm-ha-time";
        time.textContent = new Date(r.state.last_changed).toLocaleTimeString();
        right.appendChild(time);
      }

      row.appendChild(left);
      row.appendChild(right);
      out.push(row);
    }
    return out;
  },

  formatState(id, s) {
    const domain = (id.split(".")[0] || "").toLowerCase();
    const state = s.state;
    const attr = s.attributes || {};

    if (domain === "sensor" && typeof attr.unit_of_measurement !== "undefined") {
      return `${state} ${attr.unit_of_measurement}`;
    }
    if (domain === "light" || domain === "switch") {
      return state === "on" ? "On" : "Off";
    }
    return String(state);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "HA_STATES") {
      this.loaded = true;
      this.states = payload || {};
      // Build a lightweight records array from the new states for comparison
      const newRecords = this._buildRecordsArray();
      const newKey = this._computeRecordsKey(newRecords);
      const oldKey = this._computeRecordsKey(this.records || []);

      // Keep selected index within bounds (use newRecords length)
      this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, newRecords.length - 1));

      if (oldKey !== newKey) {
        // Structural change (different entities / names / icons) -> full re-render
        this.records = newRecords;
        this.updateDom(0);
      } else {
        // Only state values changed; update in-place to avoid flicker
        this.records = newRecords;
        this._updateRowsInPlace();
      }
    } else if (notification === "HA_WARN") {
      Log.warn("MMM-HomeAssistant: " + (payload && payload.message ? payload.message : ""));
      this.loaded = true; // stop showing persistent 'Loading...'
      this.errorMessage = payload && payload.message ? payload.message : null;
      this.updateDom(300);
    } else if (notification === "HA_ERROR") {
      Log.error("MMM-HomeAssistant: " + (payload && payload.message ? payload.message : ""));
      this.loaded = true;
      this.errorMessage = payload && payload.message ? payload.message : null;
      this.updateDom(300);
    } else if (notification === "BUTTON_PRESS" && this.config.enableButtonControl) {
      // payload: { action: 'up'|'down'|'toggle'|'select'|'spotify_next' ... }
      const action = payload && payload.action;
      this.handleButton(action);
    }
  },

  handleButton(action) {
    if (!action) return;
    if (!this.records) this.records = [];
    switch (action) {
      case "up":
      case "ha_prev":
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this._updateSelectionInPlace();
        break;
      case "down":
      case "ha_next":
        this.selectedIndex = Math.min(Math.max(0, this.records.length - 1), this.selectedIndex + 1);
        this._updateSelectionInPlace();
        break;
      case "toggle":
      case "select":
        // Call HA toggle on the currently selected entity
        if (this.records.length === 0) return;
        const rec = this.records[this.selectedIndex];
        if (!rec || !rec.id) return;
        const domain = (rec.id.split(".")[0] || "").toLowerCase();
        // Use 'toggle' where supported; otherwise try turn_on/turn_off fallback is not implemented here.
        this.sendSocketNotification("HA_CALL_SERVICE", { domain, service: "toggle", data: { entity_id: rec.id } });
        break;
      default:
        // Unhandled actions may be relevant to other modules (spotify etc.) - re-broadcast globally
          // Use sendNotification so other modules' front-ends can receive and forward to their node_helpers
          this.sendNotification("USER_ACTION", { action });
        break;
    }
  }

  ,

  _updateRowsInPlace() {
    if (typeof document === 'undefined' || !this.identifier) return;
    const moduleWrapper = document.getElementById(this.identifier);
    if (!moduleWrapper) return this.updateDom(0);
    const content = moduleWrapper.getElementsByClassName('module-content');
    if (!content || content.length === 0) return this.updateDom(0);
    const list = content[0].querySelector('.mmm-ha-list');
    if (!list) return this.updateDom(0);
    const rows = list.querySelectorAll('.mmm-ha-row');
    if (!rows || rows.length !== this.records.length) return this.updateDom(0);

    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i];
      const row = rows[i];
      if (!row) continue;
      // update selected class
      if (i === this.selectedIndex) row.classList.add('selected'); else row.classList.remove('selected');
      // update state text
      const stateEl = row.querySelector('.mmm-ha-state');
      if (stateEl) stateEl.textContent = this.formatState(r.id, r.state);
      // update last changed time
      const timeEl = row.querySelector('.mmm-ha-time');
      if (this.config.showLastChanged && r.state && r.state.last_changed) {
        if (timeEl) {
          timeEl.textContent = new Date(r.state.last_changed).toLocaleTimeString();
        } else {
          // if missing, rebuild full DOM to be safe
          return this.updateDom(0);
        }
      } else {
        if (timeEl) timeEl.parentNode.removeChild(timeEl);
      }
    }
  },

  _updateSelectionInPlace() {
    if (typeof document === 'undefined' || !this.identifier) return this.updateDom(0);
    const moduleWrapper = document.getElementById(this.identifier);
    if (!moduleWrapper) return this.updateDom(0);
    const content = moduleWrapper.getElementsByClassName('module-content');
    if (!content || content.length === 0) return this.updateDom(0);
    const list = content[0].querySelector('.mmm-ha-list');
    if (!list) return this.updateDom(0);
    const rows = list.querySelectorAll('.mmm-ha-row');
    if (!rows || rows.length !== this.records.length) return this.updateDom(0);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (i === this.selectedIndex) row.classList.add('selected'); else row.classList.remove('selected');
    }
  }
});

