# Step-by-Step: Integrating Spotify MQTT Control into node_helper.js

This guide shows exactly what to add to `mirror/MagicMirror/modules/MMM-SpotifyPlayer/node_helper.js`

## 📍 Location 1: Top of the File

**Find this line (should be near the top):**
```javascript
const NodeHelper = require("node_helper");
```

**Add this AFTER that line:**
```javascript
const SpotifyMQTTHandler = require('./mqtt_control.js');
```

**Result should look like:**
```javascript
const NodeHelper = require("node_helper");
const https = require("https");
const querystring = require("querystring");
const SpotifyMQTTHandler = require('./mqtt_control.js');  // 👈 ADD THIS

module.exports = NodeHelper.create({
    // ... rest of code
```

---

## 📍 Location 2: Inside the `start()` Function

**Find this section:**
```javascript
start: function() {
    console.log("Starting node helper for: " + this.name);
    this.config = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpires = null;
},
```

**Replace it with:**
```javascript
start: function() {
    console.log("Starting node helper for: " + this.name);
    this.config = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpires = null;

    // Initialize MQTT handler for control commands
    this.mqttHandler = new SpotifyMQTTHandler(this);
    this.mqttHandler.initializeMQTT();
},
```

---

## 📍 Location 3: Inside `socketNotificationReceived()` Function

**Find this section in the CONFIG handler:**
```javascript
socketNotificationReceived: function(notification, payload) {
    if (notification === "CONFIG") {
        this.config = payload;
        this.accessToken = payload.accessToken;
        this.refreshToken = payload.refreshToken;
        console.log("MMM-SpotifyPlayer: Config received");
        
        // Validate required config
        if (!this.config.clientID || !this.config.clientSecret) {
            this.sendSocketNotification("SPOTIFY_ERROR", "Missing clientID or clientSecret in config");
            return;
        }
        
        // If we have tokens, validate them
        if (this.accessToken) {
            this.getCurrentTrack();
        } else {
            this.sendSocketNotification("SPOTIFY_ERROR", "No access token provided. Please authenticate with Spotify first.");
        }
    }
    // ... rest of code
},
```

**Update it to:**
```javascript
socketNotificationReceived: function(notification, payload) {
    if (notification === "CONFIG") {
        this.config = payload;
        this.accessToken = payload.accessToken;
        this.refreshToken = payload.refreshToken;
        console.log("MMM-SpotifyPlayer: Config received");
        
        // Update MQTT handler with credentials
        if (this.mqttHandler) {
            this.mqttHandler.accessToken = this.accessToken;
            this.mqttHandler.refreshToken = this.refreshToken;
            this.mqttHandler.clientID = payload.clientID;
            this.mqttHandler.clientSecret = payload.clientSecret;
        }
        
        // Validate required config
        if (!this.config.clientID || !this.config.clientSecret) {
            this.sendSocketNotification("SPOTIFY_ERROR", "Missing clientID or clientSecret in config");
            return;
        }
        
        // If we have tokens, validate them
        if (this.accessToken) {
            this.getCurrentTrack();
        } else {
            this.sendSocketNotification("SPOTIFY_ERROR", "No access token provided. Please authenticate with Spotify first.");
        }
    }
    // ... rest of code
},
```

---

## ✅ Verification Checklist

After making changes:

- [ ] 1. Added `const SpotifyMQTTHandler = require('./mqtt_control.js');` at top
- [ ] 2. Added MQTT handler initialization in `start()` function
- [ ] 3. Updated token assignment in CONFIG handler
- [ ] 4. File has no syntax errors (check with `node -c node_helper.js`)

---

## 🔍 Full Section Example

Here's what the relevant part of your node_helper.js should look like:

```javascript
const NodeHelper = require("node_helper");
const https = require("https");
const querystring = require("querystring");
const SpotifyMQTTHandler = require('./mqtt_control.js');

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.config = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpires = null;

        // Initialize MQTT handler for control commands
        this.mqttHandler = new SpotifyMQTTHandler(this);
        this.mqttHandler.initializeMQTT();
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.accessToken = payload.accessToken;
            this.refreshToken = payload.refreshToken;
            console.log("MMM-SpotifyPlayer: Config received");
            
            // Update MQTT handler with credentials
            if (this.mqttHandler) {
                this.mqttHandler.accessToken = this.accessToken;
                this.mqttHandler.refreshToken = this.refreshToken;
                this.mqttHandler.clientID = payload.clientID;
                this.mqttHandler.clientSecret = payload.clientSecret;
            }
            
            // Validate required config
            if (!this.config.clientID || !this.config.clientSecret) {
                this.sendSocketNotification("SPOTIFY_ERROR", "Missing clientID or clientSecret in config");
                return;
            }
            
            // If we have tokens, validate them
            if (this.accessToken) {
                this.getCurrentTrack();
            } else {
                this.sendSocketNotification("SPOTIFY_ERROR", "No access token provided. Please authenticate with Spotify first.");
            }
        } else if (notification === "GET_CURRENT_TRACK") {
            this.getCurrentTrack();
        }
    },

    // ... rest of your existing functions (getCurrentTrack, refreshAccessToken, etc.)
});
```

---

## 🚀 Installation & Testing

### 1. Install MQTT Package
```bash
cd mirror/MagicMirror/modules/MMM-SpotifyPlayer
npm install mqtt
```

### 2. Check for Syntax Errors
```bash
node -c node_helper.js
```

### 3. Verify Files
```bash
ls -la
# You should see:
# - node_helper.js
# - mqtt_control.js
# - package.json (updated with mqtt dependency)
```

### 4. Restart MagicMirror
```bash
cd ~/MagicMirror
npm start
```

### 5. Test MQTT Connection
```bash
# In another terminal, subscribe to the topic
mosquitto_sub -h localhost -t 'mirror/spotify/control'

# Now use the Flutter app's Music Screen and click buttons
# You should see messages like: play, pause, next, volume:50, etc.
```

---

## 🐛 Troubleshooting

### "mqtt_control.js not found"
- Make sure the file is in the same directory as node_helper.js
- Check file path: `mirror/MagicMirror/modules/MMM-SpotifyPlayer/mqtt_control.js`

### "Cannot find module 'mqtt'"
```bash
npm install mqtt
npm list mqtt  # verify it's installed
```

### No MQTT messages being received
- Check MQTT broker is running: `docker compose ps` (in infra/ folder)
- Verify broker address is localhost:1883
- Check MagicMirror console logs for errors

### "No access token available"
- Make sure Spotify config has valid access token
- Check token hasn't expired
- Verify token is being passed correctly

---

## 📝 Notes

- The MQTT handler will start automatically when the module starts
- Commands are listened on: `mirror/spotify/control`
- All commands are case-insensitive
- Commands with parameters use colon format: `command:param`

---

## ✨ What Happens After?

Once integrated:

1. ✅ MQTT handler listens on startup
2. ✅ Flutter app publishes commands
3. ✅ Handler receives and translates to Spotify API calls
4. ✅ Spotify responds and music changes
5. ✅ User sees results immediately

---

## 🎉 You're Done!

If everything works, you should be able to:
- Click Play/Pause in Flutter app
- See Spotify respond on your mirror
- Control all playback features from your phone

Enjoy! 🎵
