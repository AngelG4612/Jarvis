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
│   └── jarvis/              # Main Flutter project
│       ├── lib/             # Source code (API clients, models, UI, state)
│       ├── test/            # Unit & widget tests
│       ├── android/         # Android platform files
│       ├── ios/             # iOS platform files
│       ├── web/             # Web platform files
│       ├── windows/         # Windows platform files
│       ├── linux/           # Linux platform files
│       ├── macos/           # macOS platform files
│       └── pubspec.yaml     # Flutter dependencies
│
├── mirror/                  # MagicMirror integration
│   ├── MagicMirror/         # Complete MagicMirror codebase (integrated)
│   │   ├── js/              # Core JavaScript files
│   │   ├── css/             # Styling and themes
│   │   ├── modules/         # Default and custom modules
│   │   ├── config/          # Configuration files
│   │   ├── translations/    # Language files
│   │   └── package.json     # Node.js dependencies
│   ├── install.sh           # MagicMirror setup script
│   └── ReadMe.txt           # Mirror-specific documentation
│
├── infra/                   # Infrastructure configs
    ├── docker-compose.yml   # HA + Mosquitto stack
│   ├── home-assistant/      # HA configs (YAML)
│   ├── mosquitto/           # Broker config + ACLs
│   └── ReadMe.txt           # Infrastructure documentation
│
└── README.md                # Main project documentation
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
Installing Docker
```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install git curl ca-certificates apt-transport-https
```
```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```
```bash
# Docker Compose plugin
sudo apt -y install docker-compose-plugin
```

```bash
# Reboot to apply group changes
sudo reboot
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