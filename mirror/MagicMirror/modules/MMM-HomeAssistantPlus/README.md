# MMM-HomeAssistantPlus

A small MagicMirror module that displays richer Home Assistant data and camera snapshots. It polls the Home Assistant REST API from the node_helper and sends entity states and camera snapshots to the frontend. Camera snapshots are sent as base64 data URLs so the frontend can render them without exposing your HA token to the browser.

Configuration (example in `config/config.js`):

```js
{
  module: 'MMM-HomeAssistantPlus',
  position: 'top_left',
  config: {
    baseUrl: 'http://localhost:8123',
    token: process.env.HA_TOKEN, // set in environment or systemd
    updateInterval: 10000,
    entities: [
      { id: 'camera.living_room', name: 'Living Room Cam' },
      { id: 'sensor.outdoor_temp', name: 'Outside Temp' }
    ]
  }
}
```

Notes
- The module's node_helper makes requests to Home Assistant with your token. Keep tokens out of browser-served `config.js` — use environment variables or systemd/Docker env files.
- Camera image snapshots are fetched server-side and forwarded to the frontend as base64 images, which avoids sending HA token to the browser.
- This module fetches snapshots (static images) periodically; it does not yet implement MJPEG streaming. For live-like view, reduce `updateInterval` for the cameras.

Troubleshooting
- If you see authentication errors, check that `baseUrl` is reachable from the host running MagicMirror and that the token is valid.
- For cameras, if the snapshot fetch returns status 403 or 401, verify the token has the camera: view permission.
