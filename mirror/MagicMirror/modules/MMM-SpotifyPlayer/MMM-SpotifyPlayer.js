<<<<<<< HEAD
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
=======
/* global Module, Log */

Module.register("MMM-SpotifyPlayer", {
  defaults: {
    updateInterval: 5000,
    clientID: null,
    clientSecret: null,
    refreshToken: null
  },

  start() {
    this.loading = true;
    this.state = null; // full player state from /v1/me/player
    this.error = null;
    this.progressTimer = null; // for per-second progress updates
    this.sendSocketNotification('SPOTIFY_PLAYER_CONFIG', this.config);
    // Ask helper to refresh initially and then regularly
    this.sendSocketNotification('SPOTIFY_PLAYER_REFRESH');
    this.updateIntervalRef = setInterval(() => this.sendSocketNotification('SPOTIFY_PLAYER_REFRESH'), this.config.updateInterval || 5000);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'SPOTIFY_PLAYER_STATE') {
      this.loading = false;
      this.error = null;
      const newState = payload || null;
      // Only trigger a full DOM update when the visible/rendered parts change
      // (track id, title, artists, artwork, is_playing, duration). If only
      // progress_ms changed we avoid re-rendering to prevent flicker.
      const newKey = this._computeRenderKey(newState);
      const oldKey = this._lastRenderKey || null;
      this.state = newState;
      this.startProgressTimer();
      if (oldKey !== newKey) {
        this._lastRenderKey = newKey;
        // Use no animation so update is immediate and doesn't fade to black
        this.updateDom(0);
      } else {
        // Only progress changed; update progress UI in-place
        this.updateProgressUI();
      }
    } else if (notification === 'SPOTIFY_PLAYER_ERROR') {
      Log.error('MMM-SpotifyPlayer: ' + (payload && payload.message ? payload.message : 'error'));
      this.loading = false;
      this.state = null;
      this.error = payload && payload.message;
      this.stopProgressTimer();
      this._lastRenderKey = null;
      this.updateDom(0);
    }
  },

  _computeRenderKey(state) {
    if (!state || !state.item) return '__no_track__' + String(state && state.is_playing);
    const it = state.item;
    const img = (it.album && Array.isArray(it.album.images) && it.album.images[0]) ? it.album.images[0].url : '';
    const artists = (it.artists || []).map(a=>a.name).join(',');
    return `${it.id}::${it.name}::${artists}::${img}::${it.duration_ms}::${state.is_playing}`;
  },

  startProgressTimer() {
    this.stopProgressTimer();
    if (!this.state || typeof this.state.progress_ms === 'undefined') return;
      this.progressStartMs = this.state.progress_ms;
      const isPlaying = !!this.state.is_playing;
      if (isPlaying) {
        this.progressStartTime = Date.now();
        this.progressTimer = setInterval(() => {
          try {
            this.updateProgressUI();
          } catch (e) {
            this.updateDom(0);
          }
        }, 1000);
      } else {
        this.progressStartTime = null;
        if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; }
        this.updateProgressUI();
      }
  },

  stopProgressTimer() {
    if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; }
  },

  formatTime(ms) {
    if (typeof ms !== 'number') return '--:--';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  },

  createControl(iconClass, action, title) {
    const btn = document.createElement('button');
    btn.className = 'sp-ctrl';
    btn.title = title || action;
    const i = document.createElement('i');
    i.className = `fa ${iconClass}`;
    btn.appendChild(i);
    btn.addEventListener('click', () => {
      // Broadcast a client-side notification so other modules (like MMM-SpotifyControl)
      // can receive it and forward to their node_helper.
      this.sendNotification('USER_ACTION', { action });
      // Ask our local SpotifyPlayer node_helper to refresh state immediately so the
      // UI reflects the new playback state without waiting for the periodic poll.
      // We schedule an immediate refresh and a follow-up refresh after a short
      // delay to allow the control helper time to execute the action on Spotify.
      try {
        this.sendSocketNotification('SPOTIFY_PLAYER_REFRESH');
        setTimeout(() => this.sendSocketNotification('SPOTIFY_PLAYER_REFRESH'), 700);
      } catch (e) {
        // ignore in case node_helper is not available
      }
    });
    return btn;
  },

  getDom() {
    const wrapper = document.createElement('div');
    wrapper.className = 'mmm-spotify-player rich';
    this.updateDomStyles();

    if (this.loading) {
      const l = document.createElement('div'); l.className = 'sp-loading'; l.textContent = 'Loading Spotify...'; wrapper.appendChild(l); return wrapper;
    }
    if (this.error) {
      const e = document.createElement('div'); e.className = 'sp-error'; e.textContent = 'Error: ' + this.error; wrapper.appendChild(e); return wrapper;
    }
    if (!this.state || !this.state.item) {
      const n = document.createElement('div'); n.className = 'sp-none'; n.textContent = 'No active Spotify playback'; wrapper.appendChild(n); return wrapper;
    }

    const track = this.state.item;
  const isPlaying = !!this.state.is_playing;
  const baseProgress = (typeof this.progressStartMs === 'number') ? this.progressStartMs : (this.state.progress_ms || 0);
  const progressMs = (isPlaying && this.progressStartTime) ? (baseProgress + (Date.now() - this.progressStartTime)) : baseProgress;
    const durationMs = (track.duration_ms || 0);

    // left: artwork
    const left = document.createElement('div'); left.className = 'sp-left';
    const art = document.createElement('img'); art.className = 'sp-art';
    if (track.album && Array.isArray(track.album.images) && track.album.images.length) art.src = track.album.images[0].url;
    left.appendChild(art);

    // middle: title/artist/album/progress
    const mid = document.createElement('div'); mid.className = 'sp-middle';
    const title = document.createElement('div'); title.className = 'sp-title'; title.textContent = track.name || '';
    const artists = document.createElement('div'); artists.className = 'sp-artists'; artists.textContent = track.artists ? track.artists.map(a=>a.name).join(', ') : '';
    const album = document.createElement('div'); album.className = 'sp-album'; album.textContent = track.album ? track.album.name : '';

    const progressWrap = document.createElement('div'); progressWrap.className = 'sp-progress-wrap';
    const timeLeft = document.createElement('span'); timeLeft.className = 'sp-time-left'; timeLeft.textContent = this.formatTime(progressMs);
    const timeRight = document.createElement('span'); timeRight.className = 'sp-time-right'; timeRight.textContent = this.formatTime(durationMs);
    const bar = document.createElement('div'); bar.className = 'sp-bar';
    const fill = document.createElement('div'); fill.className = 'sp-bar-fill';
    const pct = durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;
    fill.style.width = pct + '%';
    bar.appendChild(fill);

    progressWrap.appendChild(timeLeft);
    progressWrap.appendChild(bar);
    progressWrap.appendChild(timeRight);

    mid.appendChild(title);
    mid.appendChild(artists);
    mid.appendChild(album);
    mid.appendChild(progressWrap);

    // right: controls
    const right = document.createElement('div'); right.className = 'sp-right';
    const prev = this.createControl('fa-backward', 'spotify_prev', 'Previous');
    const playIcon = isPlaying ? 'fa-pause' : 'fa-play';
    const play = this.createControl(playIcon, isPlaying ? 'spotify_pause' : 'spotify_play', isPlaying ? 'Pause' : 'Play');
    const next = this.createControl('fa-forward', 'spotify_next', 'Next');
    right.appendChild(prev);
    right.appendChild(play);
    right.appendChild(next);

    wrapper.appendChild(left);
    wrapper.appendChild(mid);
    wrapper.appendChild(right);

    return wrapper;
  },

  updateDomStyles() {
    // ensure stylesheet is loaded
    if (!this.loadedStyles) {
      this.loadedStyles = true;
      this.addStylesheet(this.file('styles.css'));
    }
  },

  addStylesheet(href) {
    const linkId = 'mmm-spotify-player-css';
    if (document && !document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  },

  stop() {
    this.stopProgressTimer();
    if (this.updateIntervalRef) clearInterval(this.updateIntervalRef);
  }
,
  updateProgressUI() {
    if (typeof document === 'undefined' || !this.identifier) return;
    const moduleWrapper = document.getElementById(this.identifier);
    if (!moduleWrapper) return;
    const content = moduleWrapper.getElementsByClassName('module-content');
    if (!content || content.length === 0) return;
    const fill = content[0].querySelector('.sp-bar-fill');
    const timeLeft = content[0].querySelector('.sp-time-left');
    const timeRight = content[0].querySelector('.sp-time-right');
    if (!fill && !timeLeft && !timeRight) return;

    const track = this.state && this.state.item ? this.state.item : null;
    const durationMs = track ? (track.duration_ms || 0) : 0;
    const baseProgress = (typeof this.progressStartMs === 'number') ? this.progressStartMs : (this.state && this.state.progress_ms) || 0;
    const isPlaying = !!(this.state && this.state.is_playing);
    const elapsed = baseProgress + (isPlaying && this.progressStartTime ? (Date.now() - this.progressStartTime) : 0);
    const pct = durationMs > 0 ? Math.min(100, Math.max(0, (elapsed / durationMs) * 100)) : 0;

    if (fill) fill.style.width = pct + '%';
    if (timeLeft) timeLeft.textContent = this.formatTime(elapsed);
    if (timeRight) timeRight.textContent = this.formatTime(durationMs);
  }
});
>>>>>>> origin/controls
