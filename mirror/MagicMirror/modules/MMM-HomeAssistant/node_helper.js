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
    // Track multiple front-end instances: moduleId -> { config, lastSeen }
    this.instances = {};
    this.log("helper started");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "HA_CONFIG") {
      // payload may be { moduleId, config } for multi-instance support
      if (payload && payload.moduleId) {
        const id = payload.moduleId;
        const cfg = payload.config || {};
        this.instances[id] = { config: Object.assign({}, cfg), lastSeen: Date.now() };
        // if this helper has no baseUrl/token yet, seed from the first instance
        if (!this.config.baseUrl && cfg.baseUrl) this.config.baseUrl = cfg.baseUrl;
        if (!this.config.token && cfg.token) this.config.token = cfg.token;
        // ensure WS/REST polling is running
        if (!this.ws && this.config.useWebSocket) {
          this.connect();
        } else if (!this.ws) {
          this.startRestPolling(this.config.restPollSeconds);
        }
        return;
      }
      // legacy single-instance config
      this.config = Object.assign({}, this.config, payload || {});
      this.connect();
    } else if (notification === "HA_REQUEST_REFRESH") {
      // payload may include { moduleId }
      if (payload && payload.moduleId) {
        if (this.instances && this.instances[payload.moduleId]) this.instances[payload.moduleId].lastSeen = Date.now();
      }
      this.refreshOnce();
    } else if (notification === "HA_CALL_SERVICE") {
      this.callService(payload).catch(err =>
        this.sendSocketNotification("HA_WARN", { message: `Service call failed: ${err.message}`, moduleId: (payload && payload.moduleId) ? payload.moduleId : undefined })
      );
    } else if (notification === 'HA_REMOVE') {
      // Unregister a front-end instance
      if (payload && payload.moduleId && this.instances && this.instances[payload.moduleId]) {
        delete this.instances[payload.moduleId];
        // if no instances left, cleanup sockets/polling
        if (Object.keys(this.instances).length === 0) this.cleanup();
      }
    }
  },

  connect() {
    let { baseUrl, token, useWebSocket, restPollSeconds } = this.config;
    // Allow falling back to environment variables for baseUrl/token
    baseUrl = baseUrl || process.env.HA_BASE_URL || process.env.HA_URL || process.env.HASS_BASE_URL;
    token = token || process.env.HA_TOKEN || process.env.HASS_TOKEN;
    if (!baseUrl || !token) {
      this.sendSocketNotification("HA_ERROR", { message: "Missing baseUrl or token" });
      return;
    }
    // store resolved values back to config for later use
    this.config.baseUrl = baseUrl;
    this.config.token = token;

    this.cleanup(); // clear previous

    if (useWebSocket) {
      const tryConnectWs = (wsUrl, options = {}, triedAlt = false) => {
        try {
          this.log(`Attempting WebSocket: ${wsUrl}`);
          this.ws = new WebSocket(wsUrl, options);

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
            // If TLS protocol mismatch (WRONG_VERSION_NUMBER) or other TLS errors, try alternate ws/wsS once
            this.log("WebSocket error: " + (err && err.message ? err.message : String(err)));
            if (!triedAlt) {
              // swap wss <-> ws
              const altUrl = wsUrl.replace(/^wss:/i, 'ws:').replace(/^ws:/i, 'wss:');
              if (altUrl !== wsUrl) {
                this.log(`Retrying WebSocket with alternate protocol: ${altUrl}`);
                // cleanup current instance before retry
                try { this.ws.terminate(); } catch (e) {}
                return tryConnectWs(altUrl, options, true);
              }
            }
            // final fallback to REST polling
            this.log("WS connect failed, falling back to REST: " + (err && err.message ? err.message : String(err)));
            this.sendSocketNotification("HA_WARN", { message: `WebSocket connect failed: ${err && err.message ? err.message : String(err)}` });
            this.startRestPolling(restPollSeconds);
          });
        } catch (e) {
          this.log("WS connect exception, falling back to REST: " + e.message);
          this.sendSocketNotification("HA_WARN", { message: `WebSocket connect exception: ${e.message}` });
          this.startRestPolling(restPollSeconds);
        }
      };

      // build initial ws url and options
      const wsUrl = baseUrl.replace(/^http/i, (m) => m.toLowerCase() === "https" ? "wss" : "ws") + "/api/websocket";
      const wsOptions = {};
      // allow insecure TLS if explicitly requested in config (useful for self-signed certs)
      if (this.config.allowInsecureTLS) {
        wsOptions.rejectUnauthorized = false;
      }
      tryConnectWs(wsUrl, wsOptions, false);
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
    // compute union of all requested entity ids across instances
    const globalWanted = new Set();
    Object.keys(this.instances || {}).forEach((id) => {
      const cfg = this.instances[id].config || {};
      const ents = Array.isArray(cfg.entities) ? cfg.entities : [];
      ents.forEach((e) => { if (e && e.id) globalWanted.add(e.id); });
    });

    allStates.forEach((s) => {
      if (s && globalWanted.has(s.entity_id)) {
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
    // For multi-instance support: send a scoped payload to each registered instance
    const instances = this.instances || {};
    if (!instances || Object.keys(instances).length === 0) {
      // legacy: send full payload
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
      this.sendSocketNotification("HA_STATES", { moduleId: null, data: payload });
      return;
    }

    for (const moduleId of Object.keys(instances)) {
      const cfg = instances[moduleId].config || {};
      const wanted = new Set(Array.isArray(cfg.entities) ? cfg.entities.map(e => e.id) : []);
      const payload = {};
      Object.keys(this.entitiesCache).forEach((id) => {
        if (!wanted.has(id)) return;
        const s = this.entitiesCache[id];
        if (!s) return;
        payload[id] = {
          entity_id: id,
          state: s.state,
          attributes: s.attributes || {},
          last_changed: s.last_changed || null
        };
      });
      this.sendSocketNotification("HA_STATES", { moduleId, data: payload });
    }
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
