Module.register("MMM-Train", {
  defaults: {
    apiKey: "",
    stationId: "40380",  // example station (Sox–35th)
    maxTrains: 4,
    updateInterval: 60000
  },

  start: function () {
    this.trains = [];
    this.getData();
    setInterval(() => this.getData(), this.config.updateInterval);
  },

  getData: function () {
    this.sendSocketNotification("GET_TRAIN_DATA", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "TRAIN_DATA") {
      this.trains = payload;
      this.updateDom();
    }
  },

  getDom: function () {
  const wrapper = document.createElement("div");

  // 🔹 Add a title
  const title = document.createElement("h2");
  title.innerHTML = "CTA Train Schedule";
  title.style.marginBottom = "8px";
  wrapper.appendChild(title);

  if (!this.trains || this.trains.length === 0) {
    wrapper.innerHTML += "Loading CTA Train Data...";
    return wrapper;
  }

  const table = document.createElement("table");
  table.style.fontSize = "22px";

  const now = new Date();

  this.trains.forEach(train => {
    const row = document.createElement("tr");

    const lineName = train.rt || "Red Line";
    const dest = train.destNm;
    const arrTime = new Date(train.arrT);

    // compute minutes until arrival
    const diff = Math.round((arrTime - now) / 60000);
    const minsText = diff <= 0 ? "Due" : `${diff} min${diff === 1 ? "" : "s"}`;

    row.innerHTML = `
      <td style="padding-right:15px;">${lineName} to ${dest}</td>
      <td>${minsText}</td>
    `;
    table.appendChild(row);
  });

  wrapper.appendChild(table);
  return wrapper;
}
});