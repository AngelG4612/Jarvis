# J.A.R.V.I.S. – Just A Reflective Virtual Interactive System  
Smart Mirror with IoT Integration

---

## 📖 Overview
**J.A.R.V.I.S.** is a smart mirror project built for the ECE/CS Smart & Connected Embedded Systems course.  
It combines:

- **MagicMirror²** (Electron/Node.js) → Displays widgets (time, calendar, weather, traffic, news, IoT devices).  
- **Home Assistant** (Docker) → Central hub for IoT monitoring and automation.  
- **Mosquitto MQTT Broker** → Fast messaging backbone for ESP32 and sensors.  
- **Flutter/Dart Mobile App** → Companion app for configuration and control.

---

## 🏗️ Repository Structure

```
jarvis/
├── app/                     # Flutter mobile app
│   ├── lib/                 # source code (API clients, models, UI, state)
│   ├── test/                # unit & widget tests
│   └── integration_test/    # optional end-to-end tests
│
├── mirror/                  # MagicMirror modules + config API
│   ├── modules/
│   │   └── mmm-jarvis-ha/   # Custom HA integration module
│   └── services/config-api/ # Node/Express API for layout + brightness
│
├── infra/                   # Infrastructure configs
│   ├── docker-compose.yml   # HA + Mosquitto stack
│   ├── home-assistant/      # HA configs (YAML)
│   └── mosquitto/           # Broker config + ACLs
│
├── docs/                    # Documentation
│   └── architecture.md
│
└── README.md             
```


---

## ⚙️ Features
- 📅 **Mirror UI**: Time, calendar, weather, newsfeed, Spotify, IoT device tiles.  
- 💡 **IoT Control**: Toggle lights, scenes, thermostats directly from the mirror or app.  
- 📱 **Flutter App**: Manage mirror layout, brightness, themes, and run automations.  
- 🔔 **Presence & Automation**: PIR/BLE sensors to dim/sleep the mirror automatically.  
- 🛡️ **Privacy-first**: Local control works without internet; secure API tokens & TLS for MQTT.  

---

## 🚀 Getting Started

If Node.js not installed, you can use the NodeSource repo (works great on Raspberry Pi OS/Debian 12)
```bash
# Add NodeSource repo for Node 22.x and install
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions as MagicMirror v2.33.0 needs Node v22.18.0
node -v
npm -v

```

### 1) Clone the repo
```bash
git clone git@github.com:AngelG4612/Jarvis.git
```
### 2) Install MagicMirror dependencies
```bash
# This compiles native deps and pulls Electron, can take a while
cd jarvis/mirror/MagicMirror
node --run install-mm
```

### 3) (Optional) Start MagicMirror
```bash
node --run start:wayland
```

