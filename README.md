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

jarvis/
├── app/ # Flutter mobile app
│ ├── lib/ # source code (API clients, models, UI, state)
│ ├── test/ # unit & widget tests
│ └── integration_test/ # optional end-to-end tests
│
├── mirror/ # MagicMirror modules + config API
│ ├── modules/
│ │ └── mmm-jarvis-ha/ # Custom HA integration module
│ └── services/config-api/ # Node/Express API for layout + brightness
│
├── infra/ # Infrastructure configs
│ ├── docker-compose.yml # HA + Mosquitto stack
│ ├── home-assistant/ # HA configs (YAML)
│ └── mosquitto/ # Broker config + ACLs
│
├── docs/ # Documentation
│ └── architecture.md
│
└── README.md # You are here


---

## ⚙️ Features
- 📅 **Mirror UI**: Time, calendar, weather, newsfeed, Spotify, IoT device tiles.  
- 💡 **IoT Control**: Toggle lights, scenes, thermostats directly from the mirror or app.  
- 📱 **Flutter App**: Manage mirror layout, brightness, themes, and run automations.  
- 🔔 **Presence & Automation**: PIR/BLE sensors to dim/sleep the mirror automatically.  
- 🛡️ **Privacy-first**: Local control works without internet; secure API tokens & TLS for MQTT.  

---

## 🚀 Getting Started

### 1) Clone the repo
```bash
git clone https://github.com/<your-org>/jarvis.git
cd jarvis

2) Setup Infrastructure (Home Assistant + Mosquitto)
cd infra
docker compose up -d


Access Home Assistant at: http://localhost:8123

MQTT broker runs on port 1883 (default).

3) Setup MagicMirror²

On your Raspberry Pi:

# Install MagicMirror² (if not already)
git clone https://github.com/MichMich/MagicMirror
cd MagicMirror
npm install

# Symlink custom module
ln -s ~/jarvis/mirror/modules/mmm-jarvis-ha ~/MagicMirror/modules/mmm-jarvis-ha


Start the mirror:

npm run start