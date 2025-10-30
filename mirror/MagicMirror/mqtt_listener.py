"""
mqtt_listener.py
----------------
Listens for MQTT commands from a Flutter remote-control app and controls
the MagicMirror and display accordingly.

Supported MQTT topics:
- mirror/display : "on" or "off"  → turn display on/off
- mirror/restart : any payload     → restart MagicMirror
- mirror/module  : "<module>:<action>" → show/hide specific module

Author: Yessi / Jarvis Project
"""

import paho.mqtt.client as mqtt
import os
import requests
import time
from typing import Optional

# MagicMirror REST API base URL (MMM-Remote-Control)
MIRROR_API = "http://localhost:8080/api"

# MQTT broker configuration (since Mosquitto runs locally on the Pi)
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_KEEPALIVE = 60  # seconds


# ------------------------------------------------------------
#  MQTT CALLBACKS
# ------------------------------------------------------------

def on_connect(client, userdata, flags, rc):
    """
    Called automatically when the MQTT client connects to the broker.
    Subscribes to all 'mirror/#' topics once connected.
    """
    if rc == 0:
        print("✅ Connected to MQTT broker")
        # Subscribe to all topics under 'mirror/'
        client.subscribe("mirror/#")
    else:
        print(f"❌ Connection failed with code {rc}")


def on_message(client, userdata, msg):
    """
    Called whenever a subscribed MQTT message is received.
    Executes the corresponding action depending on the topic.
    """
    try:
        topic = msg.topic
        payload = msg.payload.decode()  # Decode byte payload into a string
        print(f"📩 Received '{payload}' on topic '{topic}'")

        # --------------------------------------------------------
        # Topic: mirror/display → turn the display on/off
        # --------------------------------------------------------
        if topic == "mirror/display":
            # The command uses Raspberry Pi's vcgencmd tool
            os.system(f"vcgencmd display_power {'1' if payload == 'on' else '0'}")
            print(f"🖥️ Display turned {'ON' if payload == 'on' else 'OFF'}")

        # --------------------------------------------------------
        # Topic: mirror/restart → restart MagicMirror via its API
        # --------------------------------------------------------
        elif topic == "mirror/restart":
            try:
                response = requests.get(f"{MIRROR_API}/restart")
                response.raise_for_status()
                print("🔄 MagicMirror restarted successfully")
            except requests.RequestException as e:
                print(f"⚠️ Failed to restart MagicMirror: {e}")

        # --------------------------------------------------------
        # Topic: mirror/module → control visibility of a module
        # Example payloads: "clock:hide" or "clock:show"
        # --------------------------------------------------------
        elif topic == "mirror/module":
            try:
                # Split the payload into two parts: <module>:<action>
                module, action = payload.split(":")
                response = requests.get(f"{MIRROR_API}/module/{module}/{action}")
                response.raise_for_status()
                print(f"📦 Module '{module}' {action} executed")
            except ValueError:
                print(f"⚠️ Invalid payload format for module action: {payload}")
            except requests.RequestException as e:
                print(f"⚠️ Failed to control module: {e}")

        # --------------------------------------------------------
        # Unknown topic (for debugging new commands)
        # --------------------------------------------------------
        else:
            print(f"⚠️ Unrecognized topic: {topic}")

    except Exception as e:
        print(f"🚨 Error processing message: {e}")


# ------------------------------------------------------------
#  MAIN FUNCTION
# ------------------------------------------------------------

def main():
    """Sets up the MQTT client, connects to the broker, and starts listening."""
    # Create MQTT client instance
    client = mqtt.Client()

    # Register callback functions
    client.on_connect = on_connect
    client.on_message = on_message

    # Attempt to connect to MQTT broker with retry logic
    while True:
        try:
            print(f"🔌 Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT} ...")
            client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
            break  # Stop retrying once connected
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            print("🔁 Retrying in 5 seconds...")
            time.sleep(5)

    # Start listening indefinitely for MQTT messages
    try:
        print("🚀 MQTT listener running — waiting for commands...")
        client.loop_forever()  # Blocking loop; keeps script alive
    except KeyboardInterrupt:
        # Graceful exit on Ctrl+C
        print("\n🛑 Shutting down...")
        client.disconnect()
    except Exception as e:
        print(f"💥 Fatal error: {e}")


# ------------------------------------------------------------
#  ENTRY POINT
# ------------------------------------------------------------
if __name__ == "__main__":
    main()
