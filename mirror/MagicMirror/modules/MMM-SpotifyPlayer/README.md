# MMM-SpotifyPlayer

A MagicMirror² module to display currently playing music from Spotify.

## Features

- 🎵 Current track info (song, artist, album)
- 🖼️ Album artwork
- 📊 Progress bar with time
- 🔊 Volume and device info
- 🔄 Auto token refresh

## Prerequisites

- Spotify Premium account
- Spotify Developer app credentials

## Quick Setup

1. **Create Spotify App**: Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. **Add Redirect URI**: `http://127.0.0.1:8080/callback`
3. **Get tokens**: Run `node spotify-auth.js` (add your credentials first)
4. **Configure**: Add tokens to `config/config.js`

## Configuration

```javascript
{
    module: "MMM-SpotifyPlayer",
    position: "top_center",
    config: {
        clientID: "your_client_id",
        clientSecret: "your_client_secret",
        accessToken: "your_access_token",
        refreshToken: "your_refresh_token",
        updateInterval: 5000,
        showAlbumArt: true,
        showProgress: true,
        showVolume: true,
        maxWidth: "400px"
    }
}
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `updateInterval` | 5000 | Update frequency (ms) |
| `showAlbumArt` | true | Show album artwork |
| `showProgress` | true | Show progress bar |
| `showVolume` | true | Show volume info |
| `maxWidth` | "400px" | Module max width |

For detailed setup instructions, see `SETUP.md`.