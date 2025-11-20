Module.register("MMM-MQTTController", {
	defaults: {
		debug: false
	},

	start: function() {
		Log.log("MMM-MQTTController started");
		this.moduleStates = {}; // Track module visibility states
		this.sendSocketNotification("INIT_MQTT", {});
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "MQTT_MESSAGE") {
			const { topic, message } = payload;
			Log.log(`[MQTT] ${topic}: ${message}`);

			// Parse module control messages: "module_name:show" or "module_name:hide"
			if (topic === "mirror/module") {
				this.handleModuleControl(message);
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
