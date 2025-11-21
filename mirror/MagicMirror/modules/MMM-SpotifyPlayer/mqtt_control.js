/**
 * MMM-SpotifyPlayer MQTT Control Handler
 * 
 * This file contains the logic to handle MQTT commands for Spotify playback control.
 * Add this to the MMM-SpotifyPlayer node_helper.js socketNotificationReceived method.
 * 
 * Supported MQTT commands published to 'mirror/spotify/control':
 * - play              : Start playback
 * - pause             : Pause playback
 * - next              : Skip to next track
 * - previous          : Go to previous track
 * - stop              : Stop playback
 * - like              : Add current track to liked songs
 * - shuffle           : Toggle shuffle mode
 * - repeat            : Toggle repeat mode
 * - volume:<0-100>    : Set volume level
 * - seek:<ms>         : Seek to position in milliseconds
 * - device:<deviceId> : Transfer playback to device
 * - playlist:<id>     : Play playlist by ID
 * - play_track:<name> : Search and play track by name
 */

const mqtt = require('mqtt');
const https = require('https');

class SpotifyMQTTHandler {
    constructor(nodeHelper) {
        this.nodeHelper = nodeHelper;
        this.accessToken = null;
        this.refreshToken = null;
        this.clientID = null;
        this.clientSecret = null;
    }

    // Initialize MQTT client and subscribe to control commands
    initializeMQTT() {
        try {
            const client = mqtt.connect('mqtt://localhost:1883', {
                clientId: `spotify-controller-${Date.now()}`,
                reconnectPeriod: 1000,
            });

            client.on('connect', () => {
                console.log('Spotify Controller: Connected to MQTT broker');
                client.subscribe('mirror/spotify/control', (err) => {
                    if (err) {
                        console.error('Spotify Controller: Failed to subscribe:', err);
                    } else {
                        console.log('Spotify Controller: Subscribed to mirror/spotify/control');
                    }
                });
            });

            client.on('message', (topic, message) => {
                if (topic === 'mirror/spotify/control') {
                    const command = message.toString();
                    console.log(`Spotify Controller: Received command: ${command}`);
                    this.handleCommand(command);
                }
            });

            client.on('error', (error) => {
                console.error('Spotify Controller: MQTT error:', error);
            });

            this.mqttClient = client;
        } catch (error) {
            console.error('Spotify Controller: Failed to initialize MQTT:', error);
        }
    }

    // Parse and handle incoming commands
    handleCommand(command) {
        const [cmd, param] = command.split(':');

        switch (cmd.toLowerCase().trim()) {
            case 'play':
                this.play();
                break;
            case 'pause':
                this.pause();
                break;
            case 'next':
                this.skipNext();
                break;
            case 'previous':
                this.skipPrevious();
                break;
            case 'stop':
                this.stop();
                break;
            case 'like':
                this.likeCurrentTrack();
                break;
            case 'shuffle':
                this.toggleShuffle();
                break;
            case 'repeat':
                this.toggleRepeat();
                break;
            case 'volume':
                if (param) {
                    this.setVolume(parseInt(param));
                }
                break;
            case 'seek':
                if (param) {
                    this.seek(parseInt(param));
                }
                break;
            case 'device':
                if (param) {
                    this.transferPlayback(param);
                }
                break;
            case 'playlist':
                if (param) {
                    this.playPlaylist(param);
                }
                break;
            case 'play_track':
                if (param) {
                    this.playTrack(param);
                }
                break;
            default:
                console.warn(`Spotify Controller: Unknown command: ${cmd}`);
        }
    }

    // Spotify API call helper
    makeSpotifyRequest(method, path, body = null) {
        return new Promise((resolve, reject) => {
            if (!this.accessToken) {
                reject(new Error('No access token available'));
                return;
            }

            const options = {
                hostname: 'api.spotify.com',
                port: 443,
                path: path,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data ? JSON.parse(data) : null);
                    } else if (res.statusCode === 401) {
                        reject(new Error('Unauthorized - token expired'));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }

    // Command implementations
    async play() {
        try {
            await this.makeSpotifyRequest('PUT', '/v1/me/player/play', {});
            console.log('Spotify Controller: Play command sent');
        } catch (error) {
            console.error('Spotify Controller: Play failed:', error.message);
        }
    }

    async pause() {
        try {
            await this.makeSpotifyRequest('PUT', '/v1/me/player/pause', {});
            console.log('Spotify Controller: Pause command sent');
        } catch (error) {
            console.error('Spotify Controller: Pause failed:', error.message);
        }
    }

    async skipNext() {
        try {
            await this.makeSpotifyRequest('POST', '/v1/me/player/next', null);
            console.log('Spotify Controller: Skip next command sent');
        } catch (error) {
            console.error('Spotify Controller: Skip next failed:', error.message);
        }
    }

    async skipPrevious() {
        try {
            await this.makeSpotifyRequest('POST', '/v1/me/player/previous', null);
            console.log('Spotify Controller: Skip previous command sent');
        } catch (error) {
            console.error('Spotify Controller: Skip previous failed:', error.message);
        }
    }

    async stop() {
        try {
            await this.makeSpotifyRequest('PUT', '/v1/me/player/pause', {});
            console.log('Spotify Controller: Stop command sent');
        } catch (error) {
            console.error('Spotify Controller: Stop failed:', error.message);
        }
    }

    async likeCurrentTrack() {
        try {
            const currentTrack = await this.makeSpotifyRequest('GET', '/v1/me/player/currently-playing', null);
            if (currentTrack && currentTrack.item) {
                const trackId = currentTrack.item.id;
                await this.makeSpotifyRequest('PUT', `/v1/me/tracks?ids=${trackId}`, {});
                console.log('Spotify Controller: Track liked');
            }
        } catch (error) {
            console.error('Spotify Controller: Like track failed:', error.message);
        }
    }

    async toggleShuffle() {
        try {
            const playerState = await this.makeSpotifyRequest('GET', '/v1/me/player', null);
            const newState = !playerState.shuffle_state;
            await this.makeSpotifyRequest('PUT', `/v1/me/player/shuffle?state=${newState}`, {});
            console.log(`Spotify Controller: Shuffle ${newState ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Spotify Controller: Toggle shuffle failed:', error.message);
        }
    }

    async toggleRepeat() {
        try {
            const playerState = await this.makeSpotifyRequest('GET', '/v1/me/player', null);
            let newRepeatState = 'off';
            if (playerState.repeat_state === 'off') {
                newRepeatState = 'context';
            } else if (playerState.repeat_state === 'context') {
                newRepeatState = 'track';
            }
            await this.makeSpotifyRequest('PUT', `/v1/me/player/repeat?state=${newRepeatState}`, {});
            console.log(`Spotify Controller: Repeat mode set to ${newRepeatState}`);
        } catch (error) {
            console.error('Spotify Controller: Toggle repeat failed:', error.message);
        }
    }

    async setVolume(volume) {
        try {
            if (volume < 0 || volume > 100) {
                throw new Error('Volume must be between 0 and 100');
            }
            await this.makeSpotifyRequest('PUT', `/v1/me/player/volume?volume_percent=${volume}`, {});
            console.log(`Spotify Controller: Volume set to ${volume}%`);
        } catch (error) {
            console.error('Spotify Controller: Set volume failed:', error.message);
        }
    }

    async seek(milliseconds) {
        try {
            await this.makeSpotifyRequest('PUT', `/v1/me/player/seek?position_ms=${milliseconds}`, {});
            console.log(`Spotify Controller: Seek to ${milliseconds}ms`);
        } catch (error) {
            console.error('Spotify Controller: Seek failed:', error.message);
        }
    }

    async transferPlayback(deviceId) {
        try {
            await this.makeSpotifyRequest('PUT', '/v1/me/player', {
                device_ids: [deviceId],
                play: true
            });
            console.log(`Spotify Controller: Playback transferred to device ${deviceId}`);
        } catch (error) {
            console.error('Spotify Controller: Transfer playback failed:', error.message);
        }
    }

    async playPlaylist(playlistId) {
        try {
            await this.makeSpotifyRequest('PUT', '/v1/me/player/play', {
                context_uri: `spotify:playlist:${playlistId}`
            });
            console.log(`Spotify Controller: Playing playlist ${playlistId}`);
        } catch (error) {
            console.error('Spotify Controller: Play playlist failed:', error.message);
        }
    }

    async playTrack(trackName) {
        try {
            const searchResults = await this.makeSpotifyRequest('GET', `/v1/search?q=${encodeURIComponent(trackName)}&type=track&limit=1`, null);
            if (searchResults.tracks && searchResults.tracks.items.length > 0) {
                const trackUri = searchResults.tracks.items[0].uri;
                await this.makeSpotifyRequest('PUT', '/v1/me/player/play', {
                    uris: [trackUri]
                });
                console.log(`Spotify Controller: Playing track "${trackName}"`);
            } else {
                console.warn(`Spotify Controller: No track found for "${trackName}"`);
            }
        } catch (error) {
            console.error('Spotify Controller: Play track failed:', error.message);
        }
    }
}

module.exports = SpotifyMQTTHandler;
