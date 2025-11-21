Module.register("MMM-Train", {
  defaults: {
    apiKey: "",
    stationId: "40380",  // example station (Sox–35th)
    maxTrains: 4,
    updateInterval: 60000
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.trains = [];
    this.loaded = false;
    this.getData();
    setInterval(() => this.getData(), this.config.updateInterval);
  },

  getData: function () {
    Log.info(this.name + ": Requesting train data");
    this.sendSocketNotification("GET_TRAIN_DATA", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "TRAIN_DATA") {
      Log.info(this.name + ": Received train data", payload);
      this.trains = payload;
      this.loaded = true;
      this.updateDom();
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-train-wrapper";

    // Add a title
    const title = document.createElement("h2");
    title.innerHTML = "CTA Train Schedule";
    title.className = "bright";
    title.style.marginBottom = "8px";
    wrapper.appendChild(title);

    if (!this.loaded) {
      const loading = document.createElement("p");
      loading.innerHTML = "Loading CTA Train Data...";
      loading.className = "dimmed";
      wrapper.appendChild(loading);
      return wrapper;
    }

    if (!this.trains || this.trains.length === 0) {
      const noData = document.createElement("p");
      noData.innerHTML = "No train data available";
      noData.className = "dimmed";
      wrapper.appendChild(noData);
      return wrapper;
    }

    const table = document.createElement("table");
    table.className = "small";
    const now = new Date();

    this.trains.forEach(train => {
      const row = document.createElement("tr");

      const lineName = train.rt || "Unknown Line";
      const dest = train.destNm || "Unknown Destination";
      
      let minsText = "Unknown";
      if (train.arrT) {
        try {
          const arrTime = new Date(train.arrT);
          const diff = Math.round((arrTime - now) / 60000);
          minsText = diff <= 0 ? "Due" : `${diff} min${diff === 1 ? "" : "s"}`;
        } catch (e) {
          Log.error(this.name + ": Error parsing time: " + train.arrT, e);
          minsText = "Error";
        }
      }

      const lineCell = document.createElement("td");
      lineCell.innerHTML = `${lineName} to ${dest}`;
      lineCell.className = "bright";
      lineCell.style.paddingRight = "15px";

      const timeCell = document.createElement("td");
      timeCell.innerHTML = minsText;
      timeCell.className = minsText === "Due" ? "bright" : "normal";

      row.appendChild(lineCell);
      row.appendChild(timeCell);
      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  },

  getStyles: function () {
    return ["MMM-Train.css"];
  }
});