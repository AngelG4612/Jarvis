/* Config Sample
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/configuration/introduction.html
 * and https://docs.magicmirror.builders/modules/configuration.html
 *
 * You can use environment variables using a `config.js.template` file instead of `config.js`
 * which will be converted to `config.js` while starting. For more information
 * see https://docs.magicmirror.builders/configuration/introduction.html#enviromnent-variables
 */
let config = {
	address: "localhost",	// Address to listen on, can be:
							// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
							// - another specific IPv4/6 to listen on a specific interface
							// - "0.0.0.0", "::" to listen on any interface
							// Default, when address config is left out or empty, is "localhost"
							
	port: 8080,
	basePath: "/",	// The URL path where MagicMirror² is hosted. If you are using a Reverse proxy
					// you must set the sub path here. basePath must end with a /

	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],	// Set [] to allow all IP addresses
															// or add a specific IPv4 of 192.168.1.5 :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
															// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	useHttps: false,		// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "",	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: "",	// HTTPS Certificate path, only require when useHttps is true

	language: "en",
	locale: "en-US",   // this variable is provided as a consistent location
						// it is currently only used by 3rd party modules. no MagicMirror code uses this value
						// as we have no usage, we  have no constraints on what this field holds
						// see https://en.wikipedia.org/wiki/Locale_(computer_software) for the possibilities

	logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
	timeFormat: 12,
	units: "imperial",

	modules: [
		{
			module: "alert"
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
		{
			module: "clock",
			position: "top_left"
		},
		{
			module: "calendar",
			header: "US Holidays",
			position: "top_left",
			config: {
				calendars: [
					{
						fetchInterval: 7 * 24 * 60 * 60 * 1000,
						symbol: "calendar-check",
						url: "https://ics.calendarlabs.com/76/mm3137/US_Holidays.ics"
					}
				]
			}
		},
		{
			module: "compliments",
			position: "lower_third"
		},
		{
			module: "weather",
			position: "top_right",
			config: {
				weatherProvider: "openmeteo",
				type: "current",
				lat: 40.776676,
				lon: -73.971321
			}
		},
		{
			module: "weather",
			position: "top_right",
			header: "Weather Forecast",
			config: {
				weatherProvider: "openmeteo",
				type: "forecast",
				lat: 40.776676,
				lon: -73.971321
			}
		},
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "New York Times",
						url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
					}
				],
				showSourceTitle: true,
				showPublishDate: true,
				broadcastNewsFeeds: true,
				broadcastNewsUpdates: true
			}
		},
		// Train Module
		{
			module: "MMM-Train",
			position: "top_left",
			config: {
				apiKey: "96e4819f989647a09bd6eb70cb2367d0",
				stationId: "40380", // Sox–35th (Red Line)
				maxTrains: 4
			}
		},

		// Bus Module
		{
			module: "MMM-Bus",
			position: "bottom_left",
			config: {
				apiKey: "PpH6hdBcpdUPimEM9qwnw3Rh5",
				stops: [
					{ route: "22", stopId: "14787", label: "Clark & Addison" }
				],
				updateInterval: 60000
			}
		},

		// Spotify Module (original)
		{
			module: "MMM-SpotifyPlayer",
			position: "top_center",
			config: {
				clientID: "YOUR_CLIENT_ID_HERE",
				clientSecret: "YOUR_CLIENT_SECRET_HERE",
				accessToken: "YOUR_ACCESS_TOKEN_HERE",
				refreshToken: "YOUR_REFRESH_TOKEN_HERE",
				updateInterval: 5000
			}
		},

		// Home Assistant Module
		{
			module: "MMM-HomeAssistant",
			position: "top_left",
			config: {
				title: "Home Status",
				// If your Home Assistant is served over plain HTTP (no TLS) use http:// here.
				// WRONG_VERSION_NUMBER often means the helper attempted wss but the server answered plain HTTP.
				// Recommended: set to http://localhost:8123 or set useWebSocket:false to force REST polling.
				baseUrl: "http://localhost:8123",
				token: "YOUR_LONG_LIVED_ACCESS_TOKEN_HERE",
				useWebSocket: true, // set to false to avoid websocket/TLS issues; falls back to REST polling
				restPollSeconds: 15,
				showLastChanged: true,
				entities: [
					{id: "person.jarvis", name: "Jarvis", icon: "fa-user"}
					// { id: "light.master_bedroom_main_lights", name: "Master Bedroom Lights", icon: "fa-lightbulb" }
				],
				// expose selection control to buttons module
				enableButtonControl: true
				// If you must use websockets with self-signed certs, you can add:
				// allowInsecureTLS: true
			}
		},

		// Physical buttons / keyboard bridge (no UI)
		{
			module: "MMM-PhysicalButtons",
			position: "bottom_right",
			config: {
				gpio: {
					up: null,
					down: null,
					select: null,
					spotify_next: null,
					spotify_prev: null,
					spotify_pause: null
				},
				keys: {
					up: "ArrowUp",
					down: "ArrowDown",
					select: "Enter",
					spotify_next: ">",
					spotify_prev: "<",
					spotify_pause: "1"
				}
			}
		},

		// Spotify control (responds to BUTTON_PRESS or USER_ACTION)
		{
			module: "MMM-SpotifyControl",
			position: "bottom_center",
			config: {
				clientID: "YOUR_CLIENT_ID_HERE",
				clientSecret: "YOUR_CLIENT_SECRET_HERE",
				refreshToken: "YOUR_REFRESH_TOKEN_HERE",
				accessToken: "YOUR_ACCESS_TOKEN_HERE"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
