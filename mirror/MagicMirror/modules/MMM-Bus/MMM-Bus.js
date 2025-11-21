Module.register("MMM-Bus", {
    defaults: {
        apiKey: "",
        stops: [],
        updateInterval: 60000
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        this.buses = [];
        this.loaded = false;
        this.getData();
        setInterval(() => this.getData(), this.config.updateInterval);
    },

    getData: function () {
        Log.info(this.name + ": Requesting bus data");
        // Send the full stops list to the backend
        this.sendSocketNotification("GET_BUS_DATA", {
            apiKey: this.config.apiKey,
            stops: this.config.stops
        });
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "BUS_DATA") {
            Log.info(this.name + ": Received bus data", payload);
            this.buses = payload;
            this.loaded = true;
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = "mmm-bus-wrapper";
        
        const title = document.createElement("h2");
        title.innerHTML = "CTA Bus Schedule";
        title.className = "bright";
        wrapper.appendChild(title);

        if (!this.loaded) {
            const loading = document.createElement("p");
            loading.innerHTML = "Loading CTA Bus Data...";
            loading.className = "dimmed";
            wrapper.appendChild(loading);
            return wrapper;
        }

        if (!this.buses || this.buses.length === 0) {
            const noData = document.createElement("p");
            noData.innerHTML = "No bus data available";
            noData.className = "dimmed";
            wrapper.appendChild(noData);
            return wrapper;
        }

        const table = document.createElement("table");
        table.className = "small";
        const now = new Date();

        this.buses.forEach(bus => {
            const row = document.createElement("tr");

            const stop = bus.stop || "";
            const route = bus.rt || "Unknown";
            const dir = bus.rtdir || bus.direction || "";
            const dest = bus.des || "Unknown";

            let minsText = "Unknown";
            if (bus.prdtm) {
                try {
                    const arrTime = new Date(
                        bus.prdtm.replace(
                            /(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2})/,
                            "$1-$2-$3T$4:$5:00"
                        )
                    );
                    const diff = Math.round((arrTime - now) / 60000);
                    minsText = diff <= 0 ? "Due" : `${diff} min${diff === 1 ? "" : "s"}`;
                } catch (e) {
                    Log.error(this.name + ": Error parsing time: " + bus.prdtm, e);
                    minsText = "Error";
                }
            }

            const stopCell = document.createElement("td");
            stopCell.innerHTML = `${stop}: Bus ${route} (${dir}) → ${dest}`;
            stopCell.className = "bright";
            stopCell.style.paddingRight = "15px";

            const timeCell = document.createElement("td");
            timeCell.innerHTML = minsText;
            timeCell.className = minsText === "Due" ? "bright" : "normal";

            row.appendChild(stopCell);
            row.appendChild(timeCell);
            table.appendChild(row);
        });

        wrapper.appendChild(table);
        return wrapper;
    },

    getStyles: function () {
        return ["MMM-Bus.css"];
    }
});
