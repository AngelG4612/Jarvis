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
							// Default, when address config is left out or empty, is "localhost"
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
				lat: 41.878,
				lon: -87.629799
			}
		},
		{
			module: "weather",
			position: "top_right",
			header: "Weather Forecast",
			config: {
				weatherProvider: "openmeteo",
				type: "forecast",
				lat: 41.878,
				lon: -87.629799
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
				clientID: "1409bba120724394b7ca3082548c705d",
				clientSecret: "aa865fb57a2346b592a81c1cce37e790",
				// accessToken: "BQBH0611ihsf0oDT3f5LBBVgIxkCxInC3O297TlGCoJ3MmLjIBPSjrw_ZgbiYviecdUrJ8fH5aTbfrOuJe-wVb35wqTX4uK5MBplT-LhG5-tx4yNGrVCj1CyQ7NTdOAixJtniOgk93Cw7gwX1AZ4S0NIE7_aPQKlHsnh910mrD2TJkQPC5xL_BcnuB6iKMkwluSVVkAgFxfbDDFcVk9gotq872V08zJLKQ32ctSwaANWXpl9VFDe8PM6rjE",
				refreshToken: "AQAwmsFWrsTb38Nx1fPvvtFEfTuRYj8prKryvFAxJDjshByLhGc9fFeRdKUQO3bOF2kzyMrEmK0Hv9zHK-r-bZZjW3pW4cibr-Jw-TixxZAUsSjnh_YhqbF_FeMK3p-iOdg",
				updateInterval: 5000
			}
		},

		// Home Assistant Module
		{
			module: "MMM-HomeAssistant",
			position: "top_left",
			config: {
				title: "Home Environment Sensors",
				// If your Home Assistant is served over plain HTTP (no TLS) use http:// here.
				// WRONG_VERSION_NUMBER often means the helper attempted wss but the server answered plain HTTP.
				// Recommended: set to http://localhost:8123 or set useWebSocket:false to force REST polling.
				baseUrl: "http://localhost:8123",
				token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjMDI5M2Q2MTQxMTY0NWQxYjFhMWYyZDdhZGFkOWE1ZCIsImlhdCI6MTc2MzYxNzAzOCwiZXhwIjoyMDc4OTc3MDM4fQ.B8nNYyLLg4r_r26ekCQTIxBGcTboh99rJRWSMR7dmdo",
				useWebSocket: true, // set to false to avoid websocket/TLS issues; falls back to REST polling
				restPollSeconds: 15,
				showLastChanged: true,
				entities: [
					{id: "sensor.i_9psl_carbon_dioxide", name: "CO2 Levels", icon: "fa-cloud"},
					{id: "sensor.i_9psl_humidity", name: "Humidity Levels", icon: "fa-water"},
					{id: "sensor.i_9psl_temperature", name: "Temperature", icon: "fa-thermometer-half"},
					{id: "sensor.i_9psl_voc_index", name: "VOC Index", icon: "fa-smog"}

					// {id: "camera.tapo_c230_a14d_live_view", name: "Living Room Camera", icon: "fa-video"}
				],
				// expose selection control to buttons module
				enableButtonControl: true
				// If you must use websockets with self-signed certs, you can add:
				// allowInsecureTLS: true
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
				token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjMDI5M2Q2MTQxMTY0NWQxYjFhMWYyZDdhZGFkOWE1ZCIsImlhdCI6MTc2MzYxNzAzOCwiZXhwIjoyMDc4OTc3MDM4fQ.B8nNYyLLg4r_r26ekCQTIxBGcTboh99rJRWSMR7dmdo",
				useWebSocket: true, // set to false to avoid websocket/TLS issues; falls back to REST polling
				restPollSeconds: 15,
				showLastChanged: true,
				entities: [
					{id: "switch.kitchen_main_lights", name: "Kitchen Main Lights ", icon: "fa-lightbulb"},
					{id: "light.guest_bedroom_main_lights", name: "Guest Bedroom Lights ", icon: "fa-lightbulb"},
					{id: "light.master_bedroom_main_lights", name: "Master Bedroom Lights ", icon: "fa-lightbulb" }
					

					// {id: "camera.tapo_c230_a14d_live_view", name: "Living Room Camera", icon: "fa-video"}
				],
				// expose selection control to buttons module
				enableButtonControl: true
				// If you must use websockets with self-signed certs, you can add:
				// allowInsecureTLS: true
			}
		},

		{
			module: 'MMM-AirGradient',
			position: 'top_right',
			config: {
				baseUrl: 'http://localhost:8123',
				token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjMDI5M2Q2MTQxMTY0NWQxYjFhMWYyZDdhZGFkOWE1ZCIsImlhdCI6MTc2MzYxNzAzOCwiZXhwIjoyMDc4OTc3MDM4fQ.B8nNYyLLg4r_r26ekCQTIxBGcTboh99rJRWSMR7dmdo', // recommended to provide via server-side env, not client config
				updateInterval: 15000,
				// Optional: explicit entities (array) or leave empty to auto-discover by search
				entities: [],
				search: 'airgradient'
			}
		},

		// Home Assistant Plus — richer cards and camera snapshots (server-side)
		{
			module: "MMM-HomeAssistantPlus",
			position: "top_right",
			config: {
				baseUrl: "http://localhost:8123",
				token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjMDI5M2Q2MTQxMTY0NWQxYjFhMWYyZDdhZGFkOWE1ZCIsImlhdCI6MTc2MzYxNzAzOCwiZXhwIjoyMDc4OTc3MDM4fQ.B8nNYyLLg4r_r26ekCQTIxBGcTboh99rJRWSMR7dmdo",
				useWebSocket: true,
				updateInterval: 10000,
				fallbackEnabled: true, // false to disable fallback entirely
				fallbackPosition: "top_right", // or top_right / top_left / bottom_left
				entities: [
					{id: "camera.tapo_c230_a14d_live_view", name: "Jarvis Cam"}
					// {id: "light.guest_bedroom_main_lights", name: "Guest Bedroom Lights", icon: "fa-lightbulb"}

					// { id: "camera.living_room", name: "Living Room Cam" },
					// { id: "sensor.outdoor_temp", name: "Outside Temp" }
				]
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
				// keyboard fallback for local testing: map actions to key codes or key names
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
				clientID: "1409bba120724394b7ca3082548c705d",
				clientSecret: "aa865fb57a2346b592a81c1cce37e790",
				refreshToken: "AQAwmsFWrsTb38Nx1fPvvtFEfTuRYj8prKryvFAxJDjshByLhGc9fFeRdKUQO3bOF2kzyMrEmK0Hv9zHK-r-bZZjW3pW4cibr-Jw-TixxZAUsSjnh_YhqbF_FeMK3p-iOdg"

				// refreshToken: "AQAor-vzeFafvSknqwu8dzoB2iCgkk129I71mor5RPMPy-SdleO89Iv2cEssYMqw_C0i8pL_OI9Un_ZvB7mRGgFideD_4wxfQ85p0PochVMAPFII-B69hqyJ_M3QUeZODPk",
				// accessToken: "BQADpG1d6-jPVfU1YUhtZWEe2RG4JjP1EfDMcCqWlZTSb0zn8VnOSifRyP0k7_uWGHIf5Y2aibXktX9AzBz0Q2-fgLJaacb_hRmqBVqrUEKwW98pgldX9yPDL8V9XNki5JEHoNOgwg4Nh0_TeOpnoG1qfRErAZlqPKI6BNpVB9t08vcu3J0vp17_eR86t0HnC-IdrvNM9rcnaWiPzNRCICJkO-tGJGvnjzvmEfjTpjRX0Wp2YHJWOd963mc"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
