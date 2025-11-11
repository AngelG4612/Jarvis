# Flutter Music Screen - Spotify Control Integration

## Overview
This enhancement allows the Flutter mobile app's `MusicScreen` to control the Spotify module on the MagicMirror via MQTT.

## Features

### Player Selection
- **Spotify** - Control Spotify playback on MagicMirror
- **Local** - Control local music player

### Spotify Playback Controls
- **Play** - Start playback
- **Pause** - Pause current track
- **Next** - Skip to next track
- **Previous** - Go to previous track
- **Stop** - Stop playback

### Spotify-Specific Controls
- **Like** - Add current track to liked songs
- **Shuffle** - Toggle shuffle mode
- **Repeat** - Toggle repeat mode (off → all → one)

### Volume Control
- Slider-based volume control (0-100%)
- Real-time feedback

### Local Player Controls
- Play local songs
- Internet radio playback

## Architecture

### Flutter App Structure

```
lib/
├── screens/
│   └── music_screen.dart          # Updated with player selection & controls
├── services/
│   ├── mirror_mqtt.dart           # Existing MQTT service
│   └── spotify_service.dart       # New Spotify-specific service
```

### MQTT Communication Flow

```
Flutter App (Music Screen)
    ↓ (publish to MQTT)
mirror/spotify/control topic
    ↓
MQTT Broker (localhost:1883)
    ↓ (subscribe)
MagicMirror - Spotify Module (mqtt_control.js)
    ↓ (Spotify API calls)
Spotify Web API
```

## Implementation Steps

### Step 1: Update Flutter Dependencies (if not already present)
The `mqtt_client` package is already in `pubspec.yaml`. No changes needed.

### Step 2: Use the Enhanced Music Screen
The updated `music_screen.dart` now includes:
- Player selection (Spotify/Local)
- Comprehensive playback controls
- Volume slider
- Spotify-specific controls

### Step 3: Integrate SpotifyService (Optional)
For easier code organization in other screens:

```dart
import 'package:jarvis/services/spotify_service.dart';

// In your widget
final spotifyService = SpotifyService(mqtt: mqtt);

// Use it
spotifyService.play();
spotifyService.nextTrack();
spotifyService.setVolume(75);
```

### Step 4: Update MagicMirror Spotify Module
Add MQTT control support to the Spotify module:

#### 4a. Install MQTT.js in the Spotify module directory
```bash
cd mirror/MagicMirror/modules/MMM-SpotifyPlayer
npm install mqtt
```

#### 4b. Update `node_helper.js`
Add the following to the top of `node_helper.js`:

```javascript
const SpotifyMQTTHandler = require('./mqtt_control.js');
```

#### 4c. Initialize MQTT Handler in the `start()` function
In the `start()` function of `node_helper.js`, add:

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

#### 4d. Update config initialization
Pass tokens to MQTT handler:

```javascript
socketNotificationReceived: function(notification, payload) {
    if (notification === "CONFIG") {
        this.config = payload;
        this.accessToken = payload.accessToken;
        this.refreshToken = payload.refreshToken;
        
        // Update MQTT handler with tokens
        if (this.mqttHandler) {
            this.mqttHandler.accessToken = this.accessToken;
            this.mqttHandler.refreshToken = this.refreshToken;
            this.mqttHandler.clientID = payload.clientID;
            this.mqttHandler.clientSecret = payload.clientSecret;
        }
        
        // ... rest of config handling
    }
}
```

## MQTT Command Reference

All commands are published to topic: `mirror/spotify/control`

| Command | Format | Example | Description |
|---------|--------|---------|-------------|
| Play | `play` | `play` | Start playback |
| Pause | `pause` | `pause` | Pause current track |
| Next | `next` | `next` | Skip to next track |
| Previous | `previous` | `previous` | Go to previous track |
| Stop | `stop` | `stop` | Stop playback |
| Like | `like` | `like` | Add track to liked songs |
| Shuffle | `shuffle` | `shuffle` | Toggle shuffle mode |
| Repeat | `repeat` | `repeat` | Cycle repeat mode |
| Volume | `volume:<0-100>` | `volume:50` | Set volume to 50% |
| Seek | `seek:<ms>` | `seek:120000` | Seek to 2 minutes |
| Device | `device:<id>` | `device:abc123` | Transfer to device |
| Playlist | `playlist:<id>` | `playlist:37i9dQZF1DX...` | Play playlist |
| Track | `play_track:<name>` | `play_track:Bohemian Rhapsody` | Search & play track |

## Testing

### 1. Start the MQTT Broker
```bash
cd infra
docker compose up -d
```

### 2. Verify MQTT Connection
```bash
# Subscribe to test topic
mosquitto_sub -h localhost -t 'mirror/spotify/control'
```

### 3. Run Flutter App
```bash
cd app/jarvis
flutter run
```

### 4. Test Music Screen
- Navigate to Music Screen
- Select Spotify player
- Click Play button
- Should see `play` message in mosquitto_sub terminal

## Troubleshooting

### MQTT Connection Issues
- Ensure MQTT broker is running: `docker compose ps` in `infra/` folder
- Check broker address: should be `localhost:1883`
- Verify MQTT topics in logs

### Spotify API Errors
- Check access token is valid in Spotify module config
- Ensure Spotify Premium account (required for playback control)
- Verify token hasn't expired

### No Response from Mirror
- Check Spotify module is running on MagicMirror
- Verify `mqtt_control.js` is properly integrated
- Check MagicMirror console for errors

## Future Enhancements

1. **Real-time Status Updates**
   - Display current track info
   - Show progress bar
   - Display album art

2. **Advanced Controls**
   - Create custom playlists
   - Queue management
   - Device selection UI

3. **User Preferences**
   - Save favorite tracks/playlists
   - Quick-play shortcuts
   - Control profiles

4. **Integration**
   - Home Assistant automation triggers
   - Gesture controls
   - Voice commands

## Files Modified/Created

### Modified
- `app/jarvis/lib/screens/music_screen.dart` - Enhanced with Spotify controls

### Created
- `app/jarvis/lib/services/spotify_service.dart` - Spotify control helper class
- `mirror/MagicMirror/modules/MMM-SpotifyPlayer/mqtt_control.js` - MQTT command handler

## Dependencies

### Flutter
- `mqtt_client: ^10.2.0` (already in pubspec.yaml)
- `flutter` >= 3.18.0

### MagicMirror
- `mqtt` (needs to be installed: `npm install mqtt`)
- Node.js >= 14.0

### Infrastructure
- MQTT Broker (Mosquitto) running on `localhost:1883`
