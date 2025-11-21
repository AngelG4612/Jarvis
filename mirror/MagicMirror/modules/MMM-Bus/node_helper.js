const NodeHelper = require("node_helper");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = NodeHelper.create({
  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_BUS_DATA") {
      this.getBusData(payload);
    }
  },

  async getBusData(config) {
    console.log("[MMM-Bus] Getting bus data for config:", config);
    
    if (!config.apiKey || !config.stops || config.stops.length === 0) {
      console.error("[MMM-Bus] Missing API key or stops configuration");
      this.sendSocketNotification("BUS_DATA", []);
      return;
    }

    let allArrivals = [];

    try {
      // Process each stop separately
      for (const stop of config.stops) {
        const url = `http://www.ctabustracker.com/bustime/api/v2/getpredictions?key=${config.apiKey}&rt=${stop.route}&stpid=${stop.stopId}&format=json`;
        console.log(`[MMM-Bus] Fetching from: ${url}`);

        try {
          const response = await fetch(url);
          const data = await response.json();
          console.log(`[MMM-Bus] API Response for stop ${stop.stopId}:`, JSON.stringify(data, null, 2));

          // Handle both response formats
          const bustime = data["bustime-response"] || data["bustime_response"];

          if (bustime && bustime.prd) {
            const arrivals = bustime.prd.map(item => ({
              rt: item.rt,
              des: item.des,
              rtdir: item.rtdir,
              prdtm: item.prdtm,
              stop: stop.label || `Stop ${stop.stopId}` // Add stop label
            }));
            allArrivals = allArrivals.concat(arrivals);
            console.log(`[MMM-Bus] Found ${arrivals.length} predictions for stop ${stop.label}`);
          } else if (bustime && bustime.error) {
            console.error(`[MMM-Bus] API Error for stop ${stop.label}:`, bustime.error);
          } else {
            console.log(`[MMM-Bus] No predictions for stop ${stop.label}`);
          }
        } catch (stopError) {
          console.error(`[MMM-Bus] Error fetching data for stop ${stop.label}:`, stopError);
        }
      }

      console.log(`[MMM-Bus] Total predictions found: ${allArrivals.length}`);
      this.sendSocketNotification("BUS_DATA", allArrivals);
      
    } catch (error) {
      console.error("[MMM-Bus] Error fetching bus data:", error);
      this.sendSocketNotification("BUS_DATA", []);
    }
  },
});
