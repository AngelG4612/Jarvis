const NodeHelper = require("node_helper");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = NodeHelper.create({
  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_TRAIN_DATA") {
      this.getTrainData(payload);
    }
  },

  async getTrainData(config) {
    console.log("[MMM-Train] Getting train data for config:", config);
    
    if (!config.apiKey || !config.stationId) {
      console.error("[MMM-Train] Missing API key or station ID");
      this.sendSocketNotification("TRAIN_DATA", []);
      return;
    }

    const url = `https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${config.apiKey}&mapid=${config.stationId}&outputType=JSON`;
    console.log(`[MMM-Train] Fetching from: ${url}`);

    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(`[MMM-Train] API Response:`, JSON.stringify(data, null, 2));

      // Check for API errors
      if (data.ctatt && data.ctatt.errCd && data.ctatt.errCd !== "0") {
        console.error(`[MMM-Train] API Error: ${data.ctatt.errNm}`);
        this.sendSocketNotification("TRAIN_DATA", []);
        return;
      }

      // Check if we have train data
      if (!data.ctatt || !data.ctatt.eta || !Array.isArray(data.ctatt.eta)) {
        console.log("[MMM-Train] No train arrivals found in response");
        this.sendSocketNotification("TRAIN_DATA", []);
        return;
      }

      const arrivals = data.ctatt.eta.map(item => ({
        rt: item.rt,          // line code (e.g. Red, Blue, Green)
        destNm: item.destNm,  // destination
        arrT: item.arrT       // raw timestamp for calculations
      }));

      const limitedArrivals = arrivals.slice(0, config.maxTrains || 4);
      console.log(`[MMM-Train] Found ${arrivals.length} arrivals, sending ${limitedArrivals.length}`);
      
      this.sendSocketNotification("TRAIN_DATA", limitedArrivals);
      
    } catch (error) {
      console.error("[MMM-Train] Error fetching train data:", error);
      this.sendSocketNotification("TRAIN_DATA", []);
    }
  }
});