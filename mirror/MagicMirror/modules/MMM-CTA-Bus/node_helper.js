const NodeHelper = require("node_helper");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = NodeHelper.create({
  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_BUS_DATA") {
      this.getBusData(payload);
    }
  },

  async getBusData(config) {
    const url = `https://www.ctabustracker.com/bustime/api/v2/getpredictions?key=${config.apiKey}&rt=${config.route}&stpid=${config.stopId}&format=json`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data["bustime-response"] || !data["bustime-response"].prd) {
        console.log("No bus data returned");
        return;
      }

      const arrivals = data["bustime-response"].prd.map(item => ({
        rt: item.rt,
        des: item.des,
        prdtm: item.prdtm
      }));

      this.sendSocketNotification("BUS_DATA", arrivals.slice(0, config.maxBuses));
    } catch (error) {
      console.error("MMM-CTA-Bus Error:", error);
    }
  }
});
