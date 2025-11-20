/* node_helper.js - emits BUTTON_PRESS messages from GPIO or keyboard for other modules to consume */
const NodeHelper = require("node_helper");
const { spawn } = require("child_process");

let Gpio; // lazily require onoff when available
try { Gpio = require("onoff").Gpio; } catch (e) { Gpio = null; }

module.exports = NodeHelper.create({
  start() {
    this.config = { gpio: {}, keys: {} };
    this.gpioPins = {};
    this.log("PhysicalButtons helper started");
    this.keyListener = null;
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "PB_CONFIG") {
      this.config = Object.assign({}, this.config, payload || {});
      this.setupGpio();
      this.setupKeyboard();
    }
  },

  setupGpio() {
    if (!Gpio) {
      this.log("onoff not installed or not available; GPIO disabled. Use keyboard mapping for testing.");
      return;
    }
    // Clean previous
    Object.values(this.gpioPins).forEach((p) => { try { p.unexport(); } catch (e) {} });
    this.gpioPins = {};
    for (const action of Object.keys(this.config.gpio || {})) {
      const pin = this.config.gpio[action];
      if (pin === null || typeof pin === "undefined") continue;
      try {
        const gpio = new Gpio(pin, "in", "rising", { debounceTimeout: 50 });
        gpio.watch((err, value) => {
          if (err) return;
          this.sendButton(action);
        });
        this.gpioPins[action] = gpio;
        this.log(`Mapped GPIO ${pin} -> action ${action}`);
      } catch (e) {
        this.log(`Failed to setup GPIO ${pin} for ${action}: ${e.message}`);
      }
    }
  },

  setupKeyboard() {
    // For laptop testing, spawn a tiny node child that listens to stdin key presses.
    // We'll only spawn once.
    if (this.keyListener) return;

    try {
      // Use 'python3 -m readchar' or 'node' approach is platform dependent. We'll use 'node' child that reads stdin raw.
      const script = `
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  // Send the key name or sequence to parent
  process.stdout.write(JSON.stringify({ key: key.name || str }) + '\n');
  if (key && key.ctrl && key.name === 'c') process.exit();
});
`;
      this.keyListener = spawn(process.execPath, ["-e", script], { stdio: [ 'inherit', 'pipe', 'ignore' ] });
      this.keyListener.stdout.on('data', (buf) => {
        const lines = buf.toString().split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj && obj.key) {
              this.handleKey(obj.key);
            }
          } catch (e) {}
        }
      });
      this.keyListener.on('exit', () => { this.keyListener = null; });
      this.log('Keyboard listener started (stdin)');
    } catch (e) {
      this.log('Failed to start keyboard listener: ' + e.message);
    }
  },

  handleKey(keyName) {
    // Look up actions mapped to this key
    const keys = this.config.keys || {};
    for (const action of Object.keys(keys)) {
      const k = keys[action];
      if (!k) continue;
      if (String(k) === String(keyName) || k === keyName) {
        this.sendButton(action);
        return;
      }
    }
    // For single-char keys maybe match by first char
    for (const action of Object.keys(keys)) {
      const k = keys[action];
      if (!k) continue;
      if (typeof k === 'string' && k.length === 1 && k === keyName) {
        this.sendButton(action);
        return;
      }
    }
  },

  sendButton(action) {
    this.sendSocketNotification('BUTTON_PRESS', { action });
    this.log('BUTTON_PRESS -> ' + action);
  },

  stop() {
    Object.values(this.gpioPins).forEach((p) => { try { p.unexport(); } catch (e) {} });
    this.gpioPins = {};
    if (this.keyListener) {
      try { this.keyListener.kill(); } catch (e) {}
      this.keyListener = null;
    }
  },

  log(msg) { console.log(`[MMM-PhysicalButtons] ${msg}`); }
});
