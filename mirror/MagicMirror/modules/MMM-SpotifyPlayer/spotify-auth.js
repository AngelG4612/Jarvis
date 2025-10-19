#!/usr/bin/env node

/**
 * Spotify Authentication Helper for MMM-SpotifyPlayer
 * 
 * This script helps you get the access_token and refresh_token needed
 * for the MMM-SpotifyPlayer module.
 * 
 * Usage:
 * 1. Set your CLIENT_ID and CLIENT_SECRET below
 * 2. Run: node spotify-auth.js
 * 3. Follow the instructions
 */

const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

// Configuration - FILL THESE IN WITH YOUR SPOTIFY APP CREDENTIALS
const CLIENT_ID = 'your_client_id_here';
const CLIENT_SECRET = 'your_client_secret_here';
const REDIRECT_URI = 'http://127.0.0.1:8080/callback';
const PORT = 8080;

// Spotify API scopes needed for the module
const SCOPES = [
    'user-read-currently-playing',
    'user-read-playback-state'
].join(' ');

if (CLIENT_ID === 'your_client_id_here' || CLIENT_SECRET === 'your_client_secret_here') {
    console.log('❌ Please edit this file and add your Spotify app credentials first!');
    console.log('');
    console.log('1. Go to: https://developer.spotify.com/dashboard');
    console.log('2. Create a new app or select an existing one');
    console.log('3. Copy the Client ID and Client Secret');
    console.log('4. Edit this file and replace the CLIENT_ID and CLIENT_SECRET values');
    console.log('5. In your Spotify app settings, add this redirect URI:', REDIRECT_URI);
    process.exit(1);
}

console.log('🎵 Spotify Authentication Helper for MMM-SpotifyPlayer');
console.log('');

// Create authorization URL
const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    show_dialog: true
});

console.log('🚀 Starting authentication server...');
console.log('');
console.log('👆 Click this link to authorize the app:');
console.log('   ', authUrl);
console.log('');
console.log('⏳ Waiting for authorization...');

// Create server to handle callback
const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    
    if (reqUrl.pathname === '/callback') {
        const code = reqUrl.query.code;
        const error = reqUrl.query.error;
        
        if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h1>Authorization Error</h1><p>${error}</p>`);
            console.log('❌ Authorization failed:', error);
            server.close();
            return;
        }
        
        if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Error</h1><p>No authorization code received</p>');
            console.log('❌ No authorization code received');
            server.close();
            return;
        }
        
        console.log('✅ Authorization code received, exchanging for tokens...');
        
        // Exchange code for tokens
        exchangeCodeForTokens(code, (error, tokens) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`<h1>Token Exchange Error</h1><p>${error}</p>`);
                console.log('❌ Token exchange failed:', error);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <h1>✅ Authentication Successful!</h1>
                    <p>You can now close this window and check your terminal for the configuration.</p>
                    <style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }</style>
                `);
                
                console.log('');
                console.log('🎉 Success! Here are your tokens:');
                console.log('');
                console.log('📋 Add this configuration to your MagicMirror config/config.js:');
                console.log('');
                console.log('{');
                console.log('    module: "MMM-SpotifyPlayer",');
                console.log('    position: "bottom_center",');
                console.log('    config: {');
                console.log(`        clientID: "${CLIENT_ID}",`);
                console.log(`        clientSecret: "${CLIENT_SECRET}",`);
                console.log(`        accessToken: "${tokens.access_token}",`);
                console.log(`        refreshToken: "${tokens.refresh_token}",`);
                console.log('        updateInterval: 5000,');
                console.log('        showAlbumArt: true,');
                console.log('        showProgress: true,');
                console.log('        showVolume: true,');
                console.log('        maxWidth: "400px",');
                console.log('        animationSpeed: 1000');
                console.log('    }');
                console.log('}');
                console.log('');
                console.log('⚠️  Keep these tokens secure and do not share them publicly!');
                console.log('');
            }
            server.close();
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>Not Found</h1>');
    }
});

function exchangeCodeForTokens(code, callback) {
    const postData = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
    });
    
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const options = {
        hostname: 'accounts.spotify.com',
        port: 443,
        path: '/api/token',
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const tokens = JSON.parse(data);
                if (tokens.error) {
                    callback(tokens.error_description || tokens.error);
                } else {
                    callback(null, tokens);
                }
            } catch (error) {
                callback('Failed to parse token response: ' + error.message);
            }
        });
    });
    
    req.on('error', (error) => {
        callback('Network error: ' + error.message);
    });
    
    req.write(postData);
    req.end();
}

server.listen(PORT, () => {
    console.log(`🌐 Server listening on http://localhost:${PORT}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Authentication cancelled');
    server.close();
    process.exit(0);
});