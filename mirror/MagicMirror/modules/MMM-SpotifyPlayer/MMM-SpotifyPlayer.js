Module.register("MMM-SpotifyPlayer", {
    // Default module config
    defaults: {
        clientID: "",
        clientSecret: "",
        accessToken: "",
        refreshToken: "",
        updateInterval: 5000, // 5 seconds
        showAlbumArt: true,
        showProgress: true,
        showVolume: true,
        maxWidth: "400px",
        animationSpeed: 1000,
    },

    // Required version of MagicMirror
    requiresVersion: "2.1.0",

    start: function() {
        Log.info("Starting module: " + this.name);
        this.currentTrack = null;
        this.isPlaying = false;
        this.progress = 0;
        this.duration = 0;
        this.volume = 0;
        this.device = null;
        this.error = null;
        this.loaded = false;

        // Send config to node helper
        this.sendSocketNotification("CONFIG", this.config);
        
        // Start update timer
        this.scheduleUpdate();
    },

    // Override dom generator
    getDom: function() {
        var wrapper = document.createElement("div");
        wrapper.className = "spotify-player";
        wrapper.style.maxWidth = this.config.maxWidth;

        if (this.error) {
            wrapper.innerHTML = `<div class="error">Spotify Error: ${this.error}</div>`;
            return wrapper;
        }

        if (!this.loaded) {
            wrapper.innerHTML = `<div class="loading">Loading Spotify...</div>`;
            return wrapper;
        }

        if (!this.currentTrack) {
            wrapper.innerHTML = `<div class="no-music">No music playing</div>`;
            return wrapper;
        }

        // Create track info container
        var trackContainer = document.createElement("div");
        trackContainer.className = "track-container";

        // Album art
        if (this.config.showAlbumArt && this.currentTrack.album && this.currentTrack.album.images.length > 0) {
            var albumArt = document.createElement("img");
            albumArt.className = "album-art";
            albumArt.src = this.currentTrack.album.images[0].url;
            albumArt.alt = "Album Art";
            trackContainer.appendChild(albumArt);
        }

        // Track info
        var trackInfo = document.createElement("div");
        trackInfo.className = "track-info";

        var trackName = document.createElement("div");
        trackName.className = "track-name";
        trackName.innerHTML = this.currentTrack.name;
        trackInfo.appendChild(trackName);

        var artistName = document.createElement("div");
        artistName.className = "artist-name";
        artistName.innerHTML = this.currentTrack.artists.map(artist => artist.name).join(", ");
        trackInfo.appendChild(artistName);

        if (this.currentTrack.album) {
            var albumName = document.createElement("div");
            albumName.className = "album-name";
            albumName.innerHTML = this.currentTrack.album.name;
            trackInfo.appendChild(albumName);
        }

        trackContainer.appendChild(trackInfo);
        wrapper.appendChild(trackContainer);

        // Progress bar
        if (this.config.showProgress && this.duration > 0) {
            var progressContainer = document.createElement("div");
            progressContainer.className = "progress-container";

            var progressBar = document.createElement("div");
            progressBar.className = "progress-bar";

            var progressFill = document.createElement("div");
            progressFill.className = "progress-fill";
            progressFill.style.width = ((this.progress / this.duration) * 100) + "%";
            progressBar.appendChild(progressFill);

            var timeInfo = document.createElement("div");
            timeInfo.className = "time-info";
            timeInfo.innerHTML = `${this.formatTime(this.progress)} / ${this.formatTime(this.duration)}`;

            progressContainer.appendChild(progressBar);
            progressContainer.appendChild(timeInfo);
            wrapper.appendChild(progressContainer);
        }

        // Controls and status
        var controlsContainer = document.createElement("div");
        controlsContainer.className = "controls-container";

        var playStatus = document.createElement("div");
        playStatus.className = "play-status";
        playStatus.innerHTML = this.isPlaying ? "▶️ Playing" : "⏸️ Paused";
        controlsContainer.appendChild(playStatus);

        if (this.config.showVolume && this.volume !== null) {
            var volumeInfo = document.createElement("div");
            volumeInfo.className = "volume-info";
            volumeInfo.innerHTML = `🔊 ${this.volume}%`;
            controlsContainer.appendChild(volumeInfo);
        }

        if (this.device) {
            var deviceInfo = document.createElement("div");
            deviceInfo.className = "device-info";
            deviceInfo.innerHTML = `📱 ${this.device.name}`;
            controlsContainer.appendChild(deviceInfo);
        }

        wrapper.appendChild(controlsContainer);

        return wrapper;
    },

    // Format time in mm:ss
    formatTime: function(ms) {
        var minutes = Math.floor(ms / 60000);
        var seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    },

    // Override notification handler
    socketNotificationReceived: function(notification, payload) {
        if (notification === "SPOTIFY_DATA") {
            this.loaded = true;
            this.error = null;
            
            if (payload && payload.item) {
                this.currentTrack = payload.item;
                this.isPlaying = payload.is_playing;
                this.progress = payload.progress_ms;
                this.duration = payload.item.duration_ms;
                this.device = payload.device;
                
                // Get volume from device if available
                if (payload.device && payload.device.volume_percent !== null) {
                    this.volume = payload.device.volume_percent;
                }
            } else {
                this.currentTrack = null;
                this.isPlaying = false;
            }
            
            this.updateDom(this.config.animationSpeed);
        } else if (notification === "SPOTIFY_ERROR") {
            this.error = payload;
            this.loaded = true;
            this.updateDom(this.config.animationSpeed);
        } else if (notification === "SPOTIFY_NO_PLAYBACK") {
            this.currentTrack = null;
            this.isPlaying = false;
            this.loaded = true;
            this.error = null;
            this.updateDom(this.config.animationSpeed);
        }
    },

    // Schedule next update
    scheduleUpdate: function() {
        var self = this;
        setTimeout(function() {
            self.sendSocketNotification("GET_CURRENT_TRACK");
            self.scheduleUpdate();
        }, this.config.updateInterval);
    },

    // Override getStyles function
    getStyles: function() {
        return ["MMM-SpotifyPlayer.css"];
    }
});