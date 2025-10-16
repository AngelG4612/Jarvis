📖 Overview

MMM-CTA-Train is a custom MagicMirror² module that displays real-time Chicago Transit Authority (CTA) train arrival times using the official CTA Train Tracker API
.

It shows upcoming train arrivals for a selected station, with countdown timers like:

CTA Train Schedule
Red Line to 95th — 3 mins
Red Line to Howard — 6 mins

⚙️ Features

Live arrival data from CTA Train Tracker

Displays destination and line color

Shows “Due” when a train is arriving

Refreshes automatically (default: every 60s)

Lightweight and optimized for MagicMirror GUI on Raspberry Pi or PC

🧩 Installation
cd ~/MagicMirror/modules
git clone <your-repo-url> MMM-Train
cd MMM-CTA-Train
npm install

🛠️ Configuration

Add this block to your config/config.js:

{
  module: "MMM-Train",
  position: "top_left",
  config: {
    apiKey: "YOUR_CTA_TRAIN_API_KEY",
    stationId: "40380",   // Example: Sox–35th Red Line
    maxTrains: 4,
    updateInterval: 60000
  }
},

🔹 Configuration Options
Option	Type	Description
apiKey	string	Your CTA Train Tracker API key
stationId	string	Map ID of the CTA station
maxTrains	int	Number of trains to display
updateInterval	int	Time (ms) between data refresh


🚀 Example Output
CTA Train Schedule
Red Line to 95th — 3 mins
Red Line to Howard — 6 mins

🧠 Notes

The module converts CTA’s timestamp format automatically for accurate countdowns.

For station IDs (mapid), visit the CTA Train Tracker documentation
.

Works with all CTA lines (Red, Blue, Green, Brown, Orange, Purple, Pink, Yellow).

🧑‍💻 Author

Yessenia Nicacio (Yessi)
Jarvis Mirror Project — Chicago Transit Module Suite
Includes custom MMM-CTA-Bus and MMM-Train modules for real-time transit visualization.