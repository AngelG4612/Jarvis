const NodeHelper = require("node_helper");
const mqtt = require("mqtt");

module.exports = NodeHelper.create({

    start: function () {
        console.log("[MMM-MQTTController Node Helper] Loaded");
        this.mqttClient = null;
        this.config = null; // will receive config from front-end
    },

    // Receive config from module
    socketNotificationReceived: function (notification, payload) {
        if (notification === "INIT_MQTT") {
            this.config = payload;
			console.log("[MQTT Controller] Received config:", payload);
            this.initMQTT();  // start MQTT *after* receiving config
        }
    },

    initMQTT: function () {

        const broker = this.config.mqttBroker || "localhost";
        const port = this.config.mqttPort || 1883;

        const brokerURL = `mqtt://${broker}:${port}`;

        console.log(`[MQTT Controller] Connecting to ${brokerURL}`);

        try {
            this.mqttClient = mqtt.connect(brokerURL, {
                clientId: `mm-mqtt-controller-${Date.now()}`,
                reconnectPeriod: 5000,
                connectTimeout: 4000
            });

            this.mqttClient.on("connect", () => {
                console.log("[MQTT Controller] Connected to broker");
                this.mqttClient.subscribe("mirror/#", (err) => {
                    if (err) console.error("[MQTT] Subscribe error:", err);
                    else console.log("[MQTT] Subscribed to mirror/#");
                });
            });

            this.mqttClient.on("message", (topic, message) => {
                const payload = message.toString();
                console.log(`[MQTT] ${topic} -> ${payload}`);

                this.sendSocketNotification("MQTT_MESSAGE", {
                    topic: topic,
                    message: payload
                });
            });

            this.mqttClient.on("error", (error) => {
                console.error("[MQTT] Error:", error);
            });

            this.mqttClient.on("offline", () => {
                console.warn("[MQTT] Broker offline");
            });

        } catch (error) {
            console.error("[MQTT] Initialization failed:", error);
        }
    },

    stop: function () {
        console.log("[MQTT Controller] Stopping MQTT...");
        if (this.mqttClient) this.mqttClient.end();
    }
});

