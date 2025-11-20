## MMM-SpotifyControl — Spotify setup

This document explains how to configure Spotify for the  `MMM-SpotifyPlayer`/`MMM-SpotifyControl` modules and how to obtain the required tokens (client ID, client secret, and refresh token). It includes safe deployment options so you do not expose secrets to the browser.

### Overview

- `clientID` and `clientSecret` come from your Spotify Developer App.
- `refreshToken` is obtained via the Authorization Code flow and allows the node helper to request fresh access tokens.
- Do NOT place secrets (client secret, refresh token, access token) into `config/config.js` — that file is served to the browser and will expose them.

### Prerequisites

- A Spotify account.
- A registered Spotify app at https://developer.spotify.com/dashboard/applications
- Node.js available to run the helper script (already present on most systems running MagicMirror).
- The helper script shipped with this module: `modules/MMM-SpotifyControl/get_spotify_refresh.js`.

### 1) Create a Spotify Application

1. Open https://developer.spotify.com/dashboard/applications and create a new application.
2. Add a Redirect URI. For local testing use:

```
http://127.0.0.1:8888/callback (http://localhost:8888/callback )
```

3. Note the Client ID and Client Secret.

### 2) Obtain a refresh token (one-time)

This repository includes a small helper to run the Authorization Code flow and print the tokens.

From the module folder or any shell where `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are exported:

```bash
export SPOTIFY_CLIENT_ID="your_client_id_here"
export SPOTIFY_CLIENT_SECRET="your_client_secret_here"
# optionally set SPOTIFY_REDIRECT_URI if you changed it
node ./mirror/MagicMirror/modules/MMM-SpotifyControl/get_spotify_refresh.js
```

What the script does:
- Opens a browser to the Spotify auth page (if redirect URI is localhost it will run a tiny HTTP server to capture the callback).
- After you approve the app the helper prints the response JSON including `refresh_token` and `access_token`.

Copy the `refresh_token` value and keep it secret.

If your redirect URI is not a localhost address the script will prompt you to paste the full redirected URL from the browser; it will extract the authorization code from that URL and exchange it for tokens.

### 3) Make tokens available to MagicMirror (server-side)

Preferred: inject credentials into the MagicMirror process environment (examples below). The node_helpers will read from `process.env`.

- Quick test (temporary, development):

```bash
# load vars from a .env file into the shell and export them
set -a; . /home/angel/dev/new/Jarvis/.env; set +a
cd /home/angel/dev/new/Jarvis/mirror/MagicMirror
npm start
```

- Install optional dotenv auto-loader (if you prefer the helper to attempt loading `.env`):

```bash
cd /home/angel/dev/new/Jarvis/mirror/MagicMirror
npm install dotenv
```

- Systemd (recommended for production): create/modify your service file and use an EnvironmentFile. Example `/etc/systemd/system/magicmirror.service` snippet:

```ini
[Service]
User=pi
EnvironmentFile=/home/angel/dev/new/Jarvis/.env
WorkingDirectory=/home/angel/dev/new/Jarvis/mirror/MagicMirror
ExecStart=/usr/bin/npm start
```

Make sure `/home/angel/dev/new/Jarvis/.env` contains lines like:

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...
SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
```

- Docker Compose example (use `env_file`):

```yaml
services:
  magicmirror:
    image: your-magicmirror-image
    env_file:
      - ./env.list
```

`env.list` is a plain KEY=VALUE file similar to `.env`.

### 4) (Optional) Keep `config.js` free of secrets

If you previously placed tokens or secrets into `mirror/MagicMirror/config/config.js`, remove them. Use one of the options below when you need to inject non-secret values into client config:

- Template + envsubst (simple): create `config.js.template` with placeholders like `${SPOTIFY_CLIENT_ID}` then run

```bash
envsubst < config.js.template > config/config.js
npm start
```

- Node one-liner to substitute environment vars into template:

```bash
node -e "const fs=require('fs');let t=fs.readFileSync('config.js.template','utf8');Object.keys(process.env).forEach(k=>{t=t.replace(new RegExp('\\$\\{'+k+'\\}','g'),process.env[k])});fs.writeFileSync('config/config.js',t)"
```

Be careful: only substitute non-secret values into the browser-served `config.js`.

### 5) Start MagicMirror and verify

1. Start MagicMirror with the environment variables visible to the process (see step 3).
2. Check the log output from the modules — they log messages prefixed with module name. For example:

```bash
# from the MagicMirror directory
npm start
# or if running as a systemd unit use: journalctl -u magicmirror -f
```

Look for messages from `[MMM-SpotifyControl]` and `[MMM-SpotifyPlayer]` that indicate token refresh and polling succeeded.

### 6) Test controls

- Use the keyboard fallback keys defined in `config/config.js` (if using `MMM-PhysicalButtons`) or connect GPIO buttons as configured.
- Click pause/next in the UI (top center) and observe that playback reacts immediately. If the UI lags, check that the control module's node_helper logs a successful API call and that the player module polls shortly after.

### Troubleshooting

- "Missing Spotify credentials" — ensure `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN` are defined in the environment of the running MagicMirror process.
- Token refresh failed — check client ID/secret are correct and that the refresh token was copied correctly.
- Spotify API 204 response — there is no active device. Make sure a Spotify client (phone, desktop, or device) is active and available.
- 401/403 — bad or expired credentials. Confirm refresh token and client secret are correct.

### Security notes

- Never put `clientSecret`, `refreshToken`, or active `accessToken` into `config/config.js` or any file served to the browser.
- Store secrets in environment variables, an `EnvironmentFile` read by systemd, or Docker secrets.
- Limit filesystem permissions for any file containing secrets (`chmod 600`).

### Where to find things

- Helper to obtain refresh token: `modules/MMM-SpotifyControl/get_spotify_refresh.js`
- Module code: `modules/MMM-SpotifyControl` and `modules/MMM-SpotifyPlayer`
- MagicMirror config: `mirror/MagicMirror/config/config.js`

If you want, I can:
- Patch `mirror/MagicMirror/config/config.js` to remove any hard-coded Spotify secrets and add a short comment directing you to this README.
- Add an npm startup script (`prestart`) to generate `config.js` from `config.js.template` automatically.

---
Last updated: please refer to this repo's branch for the latest changes.
