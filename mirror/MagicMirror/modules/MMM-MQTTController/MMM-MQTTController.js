Module.register("MMM-MQTTController", {
    defaults: {
        debug: false
    },

    start: function() {
        Log.log("MMM-MQTTController started");
        this.moduleStates = {};
        this.sendSocketNotification("INIT_MQTT", this.config);

        // ⭐ PRINT ALL MODULES + THEIR CLASSES TO TERMINAL
        setTimeout(() => {
            Log.log("=== MODULE LIST START ===");
            MM.getModules().enumerate(m => {
                Log.log(
                    `Module: ${m.name}, Identifier: ${m.identifier}, Classes: ${JSON.stringify(m.data.classes)}`
                );
            });
            Log.log("=== MODULE LIST END ===");
        }, 3000);  // wait for all modules to load
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "MQTT_MESSAGE") {
            const { topic, message } = payload;
            Log.log(`[MQTT] ${topic}: ${message}`);

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

            // ⭐ SAFER METHOD: loop through returned modules
            const modules = MM.getModules().withClass(moduleName);

            if (modules.length === 0) {
                Log.error(`No modules found with class: "${moduleName}"`);
            }

            modules.forEach(m => {
                if (action === "show") m.show(500);
                else m.hide(500);
            });

            this.moduleStates[moduleName] = action === "show";

        } catch (error) {
            Log.error("Error handling module control:", error);
        }
    },

    handleDisplayControl: function(message) {
        try {
            const action = message.toLowerCase().trim();
            Log.log(`[Display Control] ${action}`);

            const modules = MM.getModules();

            if (["on", "true", "1"].includes(action)) {
                modules.forEach(m => {
                    if (m.name !== "MMM-MQTTController") m.show(500);
                });
            } 
            else if (["off", "false", "0"].includes(action)) {
                modules.forEach(m => {
                    if (m.name !== "MMM-MQTTController") m.hide(500);
                });
            }

        } catch (error) {
            Log.error("Error handling display control:", error);
        }
    },

    handleRestart: function(message) {
        try {
            const action = message.toLowerCase().trim();

            if (["true","1"].includes(action)) {
                window.location.reload();
            }
        } catch (error) {
            Log.error("Error handling restart:", error);
        }
    },

    getDom: function() {
        const div = document.createElement("div");
        div.style.display = "none";
        return div;
    }
});
