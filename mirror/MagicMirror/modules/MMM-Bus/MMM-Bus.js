Module.register("MMM-CTA-Bus", {
  defaults: {
    apiKey: "",
    route: "22",       // example route
    stopId: "14787",   // example stop
    maxBuses: 3,
    updateInterval: 60000
  },

  start: function () {
    this.buses = [];
    this.getData();
    setInterval(() => this.getData(), this.config.updateInterval);
  },

  getData: function () {
    this.sendSocketNotification("GET_BUS_DATA", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "BUS_DATA") {
      this.buses = payload;
      this.updateDom();
    }
  },

 getDom: function () {
  const wrapper = document.createElement("div");

  // 🔹 Section title
  const title = document.createElement("h2");
  title.innerHTML = "CTA Bus Schedule";
  title.style.marginBottom = "8px";
  wrapper.appendChild(title);

  if (!this.buses || this.buses.length === 0) {
    wrapper.innerHTML += "Loading CTA Bus Data...";
    return wrapper;
  }

  const table = document.createElement("table");
  table.style.fontSize = "22px";

  const now = new Date();

  this.buses.forEach(bus => {
    const row = document.createElement("tr");

    const route = bus.rt;
    const dest = bus.des;

    // 🧠 FIX: Convert CTA time format "20251011 10:45" → "2025-10-11T10:45:00"
    const arrTime = new Date(
      bus.prdtm.replace(
        /(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2})/,
        "$1-$2-$3T$4:$5:00"
      )
    );

    const diff = Math.round((arrTime - now) / 60000);
    const minsText = diff <= 0 ? "Due" : `${diff} min${diff === 1 ? "" : "s"}`;

    row.innerHTML = `
      <td style="padding-right:15px;">Bus ${route} → ${dest}</td>
      <td>${minsText}</td>
    `;
    table.appendChild(row);
  });

  wrapper.appendChild(table);
  // return wrapper;
}
});