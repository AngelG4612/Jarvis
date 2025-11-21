const NodeHelper = require("node_helper");
const mqtt = require("mqtt");

module.exports = NodeHelper.create({
	start: function() {
		console.log("[MMM-MQTTController Node Helper] Starting...");
		this.mqttClient = null;
		this.initMQTT();
	},

	initMQTT: function() {
		const mqttBroker = process.env.MQTT_BROKER || "10.0.0.64";
		const mqttPort = process.env.MQTT_PORT || 1883;
		const brokerURL = `mqtt://${mqttBroker}:${mqttPort}`;

		console.log(`[MQTT Controller] Connecting to ${brokerURL}`);

		try {
			this.mqttClient = mqtt.connect(brokerURL, {
				clientId: `mm-mqtt-controller-${Date.now()}`,
				reconnectPeriod: 5000,
				connectTimeout: 4000
			});

			this.mqttClient.on("connect", () => {
				console.log("[MQTT Controller] Connected to MQTT broker");
				this.mqttClient.subscribe("mirror/#", (err) => {
					if (err) {
						console.error("[MQTT Controller] Subscribe error:", err);
					} else {
						console.log("[MQTT Controller] Subscribed to mirror/#");
					}
				});
			});

			this.mqttClient.on("message", (topic, message) => {
				const payload = message.toString();
				console.log(`[MQTT Controller] Message received: ${topic} -> ${payload}`);

				// Forward MQTT messages to the front-end module
				this.sendSocketNotification("MQTT_MESSAGE", {
					topic: topic,
					message: payload
				});
			});

			this.mqttClient.on("error", (error) => {
				console.error("[MQTT Controller] Connection error:", error);
			});

			this.mqttClient.on("offline", () => {
				console.warn("[MQTT Controller] MQTT broker offline");
			});

		} catch (error) {
			console.error("[MQTT Controller] Failed to initialize MQTT:", error);
		}
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "INIT_MQTT") {
			console.log("[MQTT Controller] Front-end module initialized");
			// MQTT should already be connected via initMQTT
		}
	},

	stop: function() {
		console.log("[MQTT Controller] Stopping...");
		if (this.mqttClient) {
			this.mqttClient.end();
		}
	}
});
