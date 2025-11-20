# MMM-MQTTController

A MagicMirror² module that listens to MQTT messages and controls module visibility (show/hide).

## Features

- Connects to MQTT broker and listens to `mirror/#` topics
- Shows/hides modules based on MQTT messages
- No external dependencies beyond mqtt npm package
- Requires only module name and action (show/hide)

## Installation

```bash
cd ~/MagicMirror/modules
# If the directory doesn't exist, create it
npm install mqtt
```

## Configuration

Add to your `config.js`:

```javascript
{
    module: "MMM-MQTTController",
    config: {
        debug: false
    }
}
```

## Environment Variables (optional)

Set these before running MagicMirror to connect to a different broker:

```bash
export MQTT_BROKER="10.0.0.64"
export MQTT_PORT="1883"
npm start
```

## Usage

Send MQTT messages in the format `moduleName:action`:

```bash
# Show the clock module
mosquitto_pub -h 10.0.0.64 -t "mirror/module" -m "clock:show"

# Hide the weather module
mosquitto_pub -h 10.0.0.64 -t "mirror/module" -m "weather:hide"

# Toggle newsfeed
mosquitto_pub -h 10.0.0.64 -t "mirror/module" -m "newsfeed:show"
```

## Module Names

Use the exact module names from your `config.js`:
- `clock`
- `calendar`
- `weather`
- `newsfeed`
- `compliments`
- `alert`
- `updatenotification`
- etc.

## Troubleshooting

Check MagicMirror logs for debug output:
```bash
tail -f ~/MagicMirror/logs/mm.log
```

## Notes

- This module requires the `mqtt` npm package installed globally or locally
- Make sure the MQTT broker is accessible from your Pi
- Module visibility changes are smooth animations (500ms fade)
