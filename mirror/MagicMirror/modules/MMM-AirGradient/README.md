MMM-AirGradient
=================

MagicMirror module to display AirGradient One sensor readings from Home Assistant.

Config (in `config.js` module block):

{
  module: 'MMM-AirGradient',
  position: 'top_right',
  config: {
    baseUrl: 'http://localhost:8123',
    token: 'LONG_HA_TOKEN', // recommended to provide via server-side env, not client config
    updateInterval: 15000,
    // Optional: explicit entities (array) or leave empty to auto-discover by search
    entities: [],
    search: 'airgradient'
  }
}

Notes:
- The helper uses the Home Assistant REST API and requires a long-lived access token. Prefer server-side injection of secrets.
