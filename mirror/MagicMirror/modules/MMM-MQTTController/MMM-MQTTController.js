Module.register("MMM-MQTTController", {
	defaults: {
		debug: false
	},

	start: function() {
		Log.log("MMM-MQTTController started");
		this.moduleStates = {}; // Track module visibility states
		this.sendSocketNotification("INIT_MQTT", this.config);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "MQTT_MESSAGE") {
			const { topic, message } = payload;
			Log.log(`[MQTT] ${topic}: ${message}`);

			// Route based on topic
			if (topic === "mirror/module") {
				this.handleModuleControl(message);
			} else if (topic === "mirror/display") {
				this.handleDisplayControl(message);
			} else if (topic === "mirror/restart") {
				this.handleRestart(message);
			}
		}
	},

	handleModuleControl: function(message) {
		try {
			const parts = message.split(":");
			if (parts.length !== 2) {
				Log.error("Invalid module message format. Expected 'module:action'");
				return;
			}

			const moduleName = parts[0].trim();
			const action = parts[1].trim().toLowerCase();

			if (action !== "show" && action !== "hide") {
				Log.error(`Unknown action '${action}'. Use 'show' or 'hide'`);
				return;
			}

			Log.log(`[Module Control] ${action.toUpperCase()} ${moduleName}`);

			// Use MagicMirror's built-in show/hide mechanism
			// This broadcasts to all modules
			if (action === "show") {
				MM.getModules().withClass(moduleName).show(500);
			} else {
				MM.getModules().withClass(moduleName).hide(500);
			}

			// Track state
			this.moduleStates[moduleName] = action === "show";
			Log.log(`Module '${moduleName}' state updated: ${action}`);

		} catch (error) {
			Log.error("Error handling module control:", error);
		}
	},

	handleDisplayControl: function(message) {
		try {
			const action = message.toString().toLowerCase().trim();
			Log.log(`[Display Control] ${action}`);

			// Get all modules
			const modules = MM.getModules();
			
			if (action === "on" || action === "true" || action === "1") {
				// Show all modules
				Log.log("[Display Control] Turning display ON - showing all modules");
				modules.forEach((module) => {
					if (module.name !== "MMM-MQTTController") { // Don't show this control module
						module.show(500);
					}
				});
			} else if (action === "off" || action === "false" || action === "0") {
				// Hide all modules
				Log.log("[Display Control] Turning display OFF - hiding all modules");
				modules.forEach((module) => {
					if (module.name !== "MMM-MQTTController") { // Don't hide this control module
						module.hide(500);
					}
				});
			}
		} catch (error) {
			Log.error("Error handling display control:", error);
		}
	},

	handleRestart: function(message) {
		try {
			const action = message.toString().toLowerCase().trim();
			Log.log(`[Restart] ${action}`);

			if (action === "true" || action === "1") {
				Log.log("[Restart] Restarting MagicMirror via page reload");
				// Reload the page to restart MagicMirror
				window.location.reload();
			}
		} catch (error) {
			Log.error("Error handling restart:", error);
		}
	},

	notificationReceived: function(notification, payload, sender) {
		// Listen for module state updates from other modules if needed
	},

	getDom: function() {
		const div = document.createElement("div");
		div.id = "mmm-mqtt-controller";
		div.style.display = "none"; // This module has no visible UI
		return div;
	}
});
