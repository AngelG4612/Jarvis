📖 Overview
MMM-CTA-Bus is a custom MagicMirror² module that displays live Chicago Transit Authority (CTA) bus arrival times using the official CTA Bus Tracker API
.

It shows upcoming bus arrivals for one or more stops, updates automatically, and formats data as:

CTA Bus Schedule
Bus 22 → Harrison — 3 mins
Bus 8 → 79th — 7 mins

⚙️ Features

Real-time bus arrivals from CTA Bus Tracker

Supports multiple stops and routes

“Due” label when the bus is arriving

Clean schedule-style layout compatible with MagicMirror themes

Auto refresh every 60 seconds

🛠️ Configuration

Add this to your config/config.js file:

{
  module: "MMM-Bus",
  position: "bottom_left",
  config: {
    apiKey: "YOUR_CTA_BUS_API_KEY",
    stops: [
      { route: "22", stopId: "14787", label: "Clark & Addison" },
      { route: "8", stopId: "524", label: "Halsted & 35th" }
    ],
    maxBuses: 3,
    updateInterval: 60000
  }
},

🚀 Example Output
CTA Bus Schedule
Clark & Addison
Bus 22 → Howard — 4 mins

Halsted & 35th
Bus 8 → 79th — 7 mins

🧠 Notes

Times are calculated dynamically based on the prdtm timestamp returned by CTA.

For stop/route IDs, use the CTA Developer Resources
.

The module requires an internet connection to fetch live data.

🧑‍💻 Author

Yessenia Nicacio (Yessi)
Jarvis Mirror Project — Chicago Transit Module