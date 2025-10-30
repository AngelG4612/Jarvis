/* node_helper.js - backend bridge to Home Assistant (CommonJS)
   MagicMirror expects this exact filename (node_helper.js) for helpers.
*/
const NodeHelper = require("node_helper");
const WebSocket = require("ws");
const fetch = (...args) => import("node-fetch").then(({default: f}) => f(...args));

function buildRest({ baseUrl, token }) {
  const base = String(baseUrl || "").replace(/\/$/, "");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  return { base, headers };
}

module.exports = NodeHelper.create({
  start() {
    this.config = {
      baseUrl: "",
      token: "",
      useWebSocket: true,
      restPollSeconds: 15,
      entities: []
    };
    this.ws = null;
    this.connected = false;
    this.haId = 0;                // incrementing id for HA WS messages
    this.subscriptions = new Set();
    this.entitiesCache = {};      // entity_id -> state obj
    this.restIntervalRef = null;
    this.log("helper started");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "HA_CONFIG") {
      this.config = Object.assign({}, this.config, payload || {});
      this.connect();
    } else if (notification === "HA_REQUEST_REFRESH") {
      this.refreshOnce();
    } else if (notification === "HA_CALL_SERVICE") {
      this.callService(payload).catch(err =>
        this.sendSocketNotification("HA_WARN", { message: `Service call failed: ${err.message}` })
      );
    }
  },

  connect() {
    const { baseUrl, token, useWebSocket, restPollSeconds } = this.config;
    if (!baseUrl || !token) {
      this.sendSocketNotification("HA_ERROR", { message: "Missing baseUrl or token" });
      return;
    }

    this.cleanup(); // clear previous

    if (useWebSocket) {
      try {
        const wsUrl = baseUrl.replace(/^http/i, (m) => m.toLowerCase() === "https" ? "wss" : "ws") + "/api/websocket";
        this.ws = new WebSocket(wsUrl);

        this.ws.on("open", () => {
          this.connected = true;
          this.log("WebSocket connected");
        });

        this.ws.on("message", (data) => {
          try {
            const msg = JSON.parse(data);
            this.handleWsMessage(msg);
          } catch (e) {
            this.log("WS parse error: " + e.message);
          }
        });

        this.ws.on("close", () => {
          this.connected = false;
          this.log("WebSocket closed; retrying in 5s…");
          setTimeout(() => this.connect(), 5000);
        });

        this.ws.on("error", (err) => {
          this.log("WebSocket error: " + err.message);
        });
      } catch (e) {
        this.log("WS connect failed, falling back to REST: " + e.message);
        this.startRestPolling(restPollSeconds);
      }
    } else {
      this.startRestPolling(restPollSeconds);
    }

    // Prime UI quickly
    this.refreshOnce();
  },

  handleWsMessage(msg) {
    if (msg.type === "auth_required") {
      this.sendWs({ type: "auth", access_token: this.config.token }, /*forceId*/ true);
      return;
    }

    if (msg.type === "auth_ok") {
      this.log("auth_ok; subscribing to state changes");
      this.subscribeEntities();
      return;
    }

    if (msg.type === "result" && msg.success && msg.result) {
      // e.g., result of get_states
      if (Array.isArray(msg.result)) this.ingestStates(msg.result);
      return;
    }

    if (msg.type === "event" && msg.event && msg.event.data) {
      const e = msg.event.data;
      const id = e.entity_id;
      if (!id || !this.shouldKeep(id)) return;

      // e.new_state can be null (entity removed) — guard
      if (e.new_state) {
        this.entitiesCache[id] = {
          state: e.new_state.state,
          attributes: e.new_state.attributes || {},
          last_changed: e.new_state.last_changed || null
        };
      } else {
        delete this.entitiesCache[id];
      }
      this.pushUpdate();
    }
  },

  sendWs(obj, forceId = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      if (forceId || typeof obj.id === "undefined") {
        this.haId += 1;
        obj.id = this.haId;
      }
      this.ws.send(JSON.stringify(obj));
    } catch (e) {
      this.log("sendWs failed: " + e.message);
    }
  },

  subscribeEntities() {
    const configured = Array.isArray(this.config.entities) ? this.config.entities : [];
    const wanted = new Set(configured.map((e) => e.id));

    // 1) get current states
    this.sendWs({ type: "get_states" });

    // 2) subscribe to all state_changed; filter client-side
    this.sendWs({ type: "subscribe_events", event_type: "state_changed" });

    this.subscriptions = wanted; // possibly empty (means show none until REST prime)
  },

  shouldKeep(entityId) {
    return this.subscriptions.size === 0 || this.subscriptions.has(entityId);
  },

  ingestStates(allStates) {
    const configured = Array.isArray(this.config.entities) ? this.config.entities : [];
    const wantedSet = this.subscriptions.size ? this.subscriptions : new Set(configured.map((e) => e.id));

    allStates.forEach((s) => {
      if (s && wantedSet.has(s.entity_id)) {
        this.entitiesCache[s.entity_id] = {
          state: s.state,
          attributes: s.attributes || {},
          last_changed: s.last_changed || null
        };
      }
    });
    this.pushUpdate();
  },

  pushUpdate() {
    // clone a plain object for the front-end
    const payload = {};
    Object.keys(this.entitiesCache).forEach((id) => {
      const s = this.entitiesCache[id];
      if (!s) return;
      payload[id] = {
        entity_id: id,
        state: s.state,
        attributes: s.attributes || {},
        last_changed: s.last_changed || null
      };
    });
    this.sendSocketNotification("HA_STATES", payload);
  },

  async refreshOnce() {
    try {
      const { base, headers } = buildRest(this.config);
      if (!base) throw new Error("No baseUrl");
      const r = await fetch(`${base}/api/states`, { headers });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      const data = await r.json();
      this.ingestStates(data);
    } catch (e) {
      this.sendSocketNotification("HA_WARN", { message: `REST fetch failed: ${e.message}` });
    }
  },

  startRestPolling(seconds = 15) {
    if (this.restIntervalRef) clearInterval(this.restIntervalRef);
    const period = Math.max(5, Number(seconds) || 15) * 1000;
    this.restIntervalRef = setInterval(() => this.refreshOnce(), period);
    this.log(`REST polling every ${period / 1000}s`);
  },

  async callService(payload) {
    if (!payload || !payload.domain || !payload.service) {
      throw new Error("callService requires {domain, service, data?}");
    }
    const { base, headers } = buildRest(this.config);
    const url = `${base}/api/services/${payload.domain}/${payload.service}`;
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload.data || {})
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    // Ignored response on success
  },

  cleanup() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    if (this.restIntervalRef) {
      clearInterval(this.restIntervalRef);
      this.restIntervalRef = null;
    }
  },

  stop() {
    this.cleanup();
  },

  log(msg) {
    console.log(`[MMM-HomeAssistant] ${msg}`);
  }
});
