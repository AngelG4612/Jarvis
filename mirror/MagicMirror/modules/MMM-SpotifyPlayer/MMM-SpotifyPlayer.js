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
    this.selectedControl = 0; // index of currently selected control (prev, play, next)
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
      this.performAction(action, true);
    });
    return btn;
  },

  // Centralized action performer: optionally broadcast USER_ACTION then
  // request an immediate refresh of player state so the UI updates without
  // waiting for the normal poll interval.
  performAction(action, broadcast = false) {
    if (!action) return;
    if (broadcast) {
      try { this.sendNotification('USER_ACTION', { action }); } catch (e) {}
    }
    try {
      this.sendSocketNotification('SPOTIFY_PLAYER_REFRESH');
      setTimeout(() => this.sendSocketNotification('SPOTIFY_PLAYER_REFRESH'), 700);
    } catch (e) {
      // ignore in case node_helper is not available
    }
  },

  // Helper: build a control element but include index so selection can be highlighted
  createIndexedControl(iconClass, action, title, idx) {
    const btn = this.createControl(iconClass, action, title);
    btn.dataset.action = action;
    btn.dataset.idx = String(idx);
    if (this.selectedControl === idx) btn.classList.add('selected');
    // update selection on focus/click
    btn.addEventListener('focus', () => { this.selectedControl = idx; this.updateDom(0); });
    btn.addEventListener('click', () => { this.selectedControl = idx; this.updateDom(0); });
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
    const prev = this.createIndexedControl('fa-backward', 'spotify_prev', 'Previous', 0);
    const playIcon = isPlaying ? 'fa-pause' : 'fa-play';
    // use explicit play/pause on click, selection will toggle via select
    const playAction = isPlaying ? 'spotify_pause' : 'spotify_play';
    const play = this.createIndexedControl(playIcon, playAction, isPlaying ? 'Pause' : 'Play', 1);
    const next = this.createIndexedControl('fa-forward', 'spotify_next', 'Next', 2);
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
  },

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
  },

  notificationReceived(notification, payload, sender) {
    // handle keyboard / button bridge events
    const isButton = (notification === 'BUTTON_PRESS');
    const isUserAction = (notification === 'USER_ACTION');
    if (!isButton && !isUserAction) return;
    const action = payload && payload.action;
    if (!action) return;

    // Only treat navigation from physical button presses or from this module's own UI
    const isLocalUI = (isUserAction && sender && sender.name === this.name);
    if (isButton || isLocalUI) {
      // navigation: up/down/left/right — only change selection here
      if (action === 'up' || action === 'left') {
        this.selectedControl = Math.max(0, this.selectedControl - 1);
        this.updateDom(0);
        return;
      }
      if (action === 'down' || action === 'right') {
        this.selectedControl = Math.min(2, this.selectedControl + 1);
        this.updateDom(0);
        return;
      }
      if (action === 'select' || action === 'enter') {
        // perform the selected control action
        const map = [ 'spotify_prev', (this.state && this.state.is_playing) ? 'spotify_pause' : 'spotify_play', 'spotify_next' ];
        const act = map[this.selectedControl] || 'spotify_toggle';
        this.performAction(act, true);
        return;
      }
    }
    // If action is direct spotify control, update selection and trigger a
    // refresh so the UI stays in sync. If the action came from another module
    // (e.g. MMM-PhysicalButtons or MMM-SpotifyControl) we only refresh here
    // without rebroadcasting to avoid loops.
    if (action.startsWith && action.startsWith('spotify')) {
      if (action === 'spotify_prev') this.selectedControl = 0;
      if (action === 'spotify_next') this.selectedControl = 2;
      if (action === 'spotify_play' || action === 'spotify_pause' || action === 'spotify_toggle') this.selectedControl = 1;
      this.updateDom(0);
      if (!(sender && sender.name === this.name)) {
        this.performAction(action, false);
      }
    }
  }
});
