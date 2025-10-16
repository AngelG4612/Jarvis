Module.register("MMM-SpotifyPlayer", {
  defaults: {
    clientID: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: "",
    updateInterval: 5000
  },

  start() {
    this.track = null;
    this.isPlaying = false;
    this.getData();
    setInterval(() => this.getData(), this.config.updateInterval);
  },

  getData() {
    this.sendSocketNotification("GET_SPOTIFY_DATA", this.config);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "SPOTIFY_DATA") {
      this.track = payload.track;
      this.isPlaying = payload.isPlaying;
      this.updateDom();
    }
  },

  getDom() {
  const wrapper = document.createElement("div");
  wrapper.className = "spotify-player";

  const status = document.createElement("div");
  status.style.fontSize = "0.9em";
  status.style.marginBottom = "6px";

  if (!this.track) {
    status.innerHTML = "🔴 Not connected to Spotify";
    status.style.color = "#ff5555";
    wrapper.appendChild(status);
    wrapper.innerHTML += "🎧 Waiting for Spotify...";
    return wrapper;
  } else {
    status.innerHTML = "🟢 Connected to Spotify";
    status.style.color = "#1db954";
    wrapper.appendChild(status);
  }

  // Album Art
  const albumArt = document.createElement("img");
  albumArt.src = this.track.albumArt;
  albumArt.style.width = "120px";
  albumArt.style.borderRadius = "8px";
  wrapper.appendChild(albumArt);

  // Track Info
  const info = document.createElement("div");
  info.innerHTML = `
    <div style="font-size:1.1em; font-weight:bold; margin-top:6px;">${this.track.title}</div>
    <div style="color:#ccc;">${this.track.artist}</div>
  `;
  wrapper.appendChild(info);

  // Controls
  const controls = document.createElement("div");
  controls.style.marginTop = "10px";
  controls.style.display = "flex";
  controls.style.justifyContent = "center";
  controls.style.gap = "10px";

  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = "⏮️";
  prevBtn.className = "spotify-btn";
  prevBtn.addEventListener("click", () => this.sendSocketNotification("SPOTIFY_PREV", this.config));

  const playPauseBtn = document.createElement("button");
  playPauseBtn.innerHTML = this.isPlaying ? "⏸️" : "▶️";
  playPauseBtn.className = "spotify-btn";
  playPauseBtn.addEventListener("click", () => this.sendSocketNotification("SPOTIFY_PLAYPAUSE", this.config));

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = "⏭️";
  nextBtn.className = "spotify-btn";
  nextBtn.addEventListener("click", () => this.sendSocketNotification("SPOTIFY_NEXT", this.config));

  controls.appendChild(prevBtn);
  controls.appendChild(playPauseBtn);
  controls.appendChild(nextBtn);
  wrapper.appendChild(controls);

  return wrapper;
}
});