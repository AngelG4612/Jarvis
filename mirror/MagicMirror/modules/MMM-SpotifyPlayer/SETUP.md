# MMM-SpotifyPlayer Setup Guide 

## 🎵 Spotify Module Setup Instructions

This guide helps set your own Spotify integration for the MagicMirror.

### Prerequisites
- Spotify Premium account (required for Web API playback features)
- Access to Spotify Developer Dashboard

## Quick Setup Steps

### Step 1: Create Your Own Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Login with your Spotify account
3. Click **"Create an App"**
4. Fill in:
   - **App name**: `J.A.R.V.I.S. Mirror Spotify`
   - **App description**: `Spotify integration for MagicMirror smart display`
   - **Website**: `http://localhost:8080`
5. Click **"Save"**

### Step 2: Configure Redirect URI
1. Click **"Edit Settings"** on your new app
2. Add **Redirect URI**: `http://127.0.0.1:8080/callback`
3. Click **"Add"** then **"Save"**

### Step 3: Get Your Credentials
1. Copy your **Client ID** (visible on app dashboard)
2. Click **"Show Client Secret"** and copy it
3. Keep these secure - don't share them!

### Step 4: Run Authentication Script
1. Navigate to the module directory:
   ```bash
   cd mirror/MagicMirror/modules/MMM-SpotifyPlayer
   ```

2. Edit `spotify-auth.js` and replace:
   ```javascript
   const CLIENT_ID = 'your_actual_client_id_here';
   const CLIENT_SECRET = 'your_actual_client_secret_here';
   ```

3. Run the authentication script:
   ```bash
   node spotify-auth.js
   ```

4. Follow the authorization link that appears
5. Login to Spotify and authorize the app
6. Copy the generated configuration

### Step 5: Update MagicMirror Config
1. Open `config/config.js`
2. Find the MMM-SpotifyPlayer section
3. Replace the placeholder values with your real tokens:
   ```javascript
   {
       module: "MMM-SpotifyPlayer",
       position: "top_center",
       config: {
           clientID: "your_real_client_id",
           clientSecret: "your_real_client_secret", 
           accessToken: "your_real_access_token",
           refreshToken: "your_real_refresh_token",
           // ... other settings stay the same
       }
   }
   ```

### Step 6: Test It
1. Start MagicMirror: `npm run server`
2. Open `http://localhost:8080` in browser
3. Play music on Spotify and see it appear on the mirror!

## Security Notes

**NEVER commit real credentials to git!**
- Keep your Client ID/Secret private
- Don't share access tokens
- Each team member needs their own Spotify app
- The module works with any Spotify Premium account

## Configuration Options

You can customize the module in `config.js`:

| Setting | Description | Default |
|---------|-------------|---------|
| `position` | Where to display the module | `"top_center"` |
| `updateInterval` | How often to check for updates (ms) | `5000` |
| `showAlbumArt` | Show album artwork | `true` |
| `showProgress` | Show progress bar | `true` |
| `showVolume` | Show volume percentage | `true` |
| `maxWidth` | Maximum width of module | `"400px"` |

## Troubleshooting

### Common Issues
1. **"Invalid client" error**: Check your Client ID/Secret are correct
2. **"No music playing"**: Ensure you're using Spotify Premium and music is actively playing
3. **Token expired**: Module should auto-refresh, but you can re-run authentication if needed

### Getting Help
- Check the console logs: `F12` in browser or terminal output
- Verify your Spotify app settings match the redirect URI
- Ensure you're playing music on a Spotify Connect device

## Files You'll Modify
- `spotify-auth.js` - Add your credentials temporarily for setup
- `config/config.js` - Add your tokens permanently

**Remember: Never commit your real credentials to the repository!**