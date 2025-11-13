"""
mqtt_listener.py
----------------
MQTT controller for MagicMirror running on Debian Trixie + Wayland.
Display control via wlr-randr, MagicMirror control via npm start/pkill.

Topics:
- mirror/display : "on" | "off"
- mirror/restart : any payload
- mirror/module  : "clock:show", "weather:hide", etc.

Author: Yessi / Jarvis Project
"""

import paho.mqtt.client as mqtt
import os
import requests
import time

# MagicMirror settings
MIRROR_DIR = "/home/jarvis/Jarvis/mirror/MagicMirror"
MIRROR_API = "http://localhost:8080/api"

# MQTT settings
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_KEEPALIVE = 60

# Wayland display output (from wlr-randr)
WAYLAND_OUTPUT = "HDMI-A-2"


def start_magic_mirror():
    print("Starting MagicMirror...")
    os.system(f"npm start --prefix {MIRROR_DIR} &")


def stop_magic_mirror():
    print("Stopping MagicMirror...")
    os.system("pkill electron")


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
        client.subscribe("mirror/#")
        print("Subscribed to mirror/#")
    else:
        print(f"MQTT connection failed with code: {rc}")


def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode().strip()

    print(f"Received on {topic}: {payload}")

    try:
        # ----------------------------------------------------------
        # DISPLAY ON/OFF  (Wayland)
        # ----------------------------------------------------------
        if topic == "mirror/display":
            if payload == "on":
                print("Turning display ON...")
                os.system(f"wlr-randr --output {WAYLAND_OUTPUT} --on")
                start_magic_mirror()

            elif payload == "off":
                print("Turning display OFF...")
                os.system(f"wlr-randr --output {WAYLAND_OUTPUT} --off")
                stop_magic_mirror()

        # ----------------------------------------------------------
        # RESTART MAGIC MIRROR
        # ----------------------------------------------------------
        elif topic == "mirror/restart":
            print("Restarting MagicMirror...")
            stop_magic_mirror()
            time.sleep(2)
            start_magic_mirror()

        # ----------------------------------------------------------
        # MODULE CONTROL via REST API (MMM-Remote-Control)
        # ----------------------------------------------------------
        elif topic == "mirror/module":
            try:
                module, action = payload.split(":")
                print(f"Module command: {module} -> {action}")

                response = requests.get(
                    f"{MIRROR_API}/module/{module}/{action}"
                )
                response.raise_for_status()

            except ValueError:
                print(f"Invalid module payload: {payload}")
            except requests.RequestException as e:
                print(f"Module control error: {e}")

    except Exception as e:
        print(f"Error handling message: {e}")


def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    # reconnect loop
    while True:
        try:
            print(f"Connecting to MQTT at {MQTT_BROKER}:{MQTT_PORT}")
            client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
            break
        except Exception as e:
            print(f"MQTT connect error: {e}")
            print("Retrying in 5 seconds...")
            time.sleep(5)

    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print("Shutting down MQTT listener...")
        client.disconnect()
    except Exception as e:
        print(f"Fatal error: {e}")


if __name__ == "__main__":
    main()
