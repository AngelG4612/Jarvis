const NodeHelper = require("node_helper");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


module.exports = NodeHelper.create({
  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_TRAIN_DATA") {
      this.getTrainData(payload);
    }
  },

  async getTrainData(config) {
    const url = `https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${config.apiKey}&mapid=${config.stationId}&outputType=JSON`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      const arrivals = data.ctatt.eta.map(item => ({
        rt: item.rt,          // line code (e.g. Red, Blue, Green)
        destNm: item.destNm,  // destination
        arrT: item.arrT       // raw timestamp for calculations
        }));


      this.sendSocketNotification("TRAIN_DATA", arrivals.slice(0, config.maxTrains));
    } catch (error) {
      console.error("MMM-Train Error:", error);
    }
  }
});