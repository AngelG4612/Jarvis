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
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_KEEPALIVE = 60

def on_connect(client, userdata, flags, rc):
    """Callback for when the client connects to the broker."""
    if rc == 0:
        print("Connected to MQTT broker")
        # Subscribe to all mirror topics
        client.subscribe("mirror/#")
    else:
        print(f"Connection failed with code {rc}")

def on_message(client, userdata, msg):
    """Callback for when a message is received."""
    try:
        topic = msg.topic
        payload = msg.payload.decode()
        print(f"Received {payload} on {topic}")
        
        if topic == "mirror/display":
            if payload == "on":
                # Turn on display
                os.system("vcgencmd display_power 1")
                # Try to start MagicMirror if not running
                os.system("pm2 start MagicMirror || pm2 restart MagicMirror")

            else:
                print("Turning Display Off...")
                # Turn off display
                os.system("vcgencmd display_power 0")
                # Stop MagicMirror
                os.system("pm2 stop MagicMirror")
        
        elif topic == "mirror/restart":
            # Restart MagicMirro
            try:
                response = requests.get(f"{MIRROR_API}/restart")
                response.raise_for_status()
            except requests.RequestException as e:
                print(f"Failed to restart mirror: {e}")
        
        elif topic == "mirror/module":
            # Control module state
            try:
                module, action = payload.split(":")
                response = requests.get(f"{MIRROR_API}/module/{module}/{action}")
                response.raise_for_status()
            except ValueError:
                print(f"Invalid payload format for module action: {payload}")
            except requests.RequestException as e:
                print(f"Failed to control module: {e}")
    
    except Exception as e:
        print(f"Error processing message: {e}")

def main():
    """Main function to set up and run the MQTT client."""
    client = mqtt.Client()
    
    # Set up callbacks
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Connect to broker with retry
    while True:
        try:
            print(f"Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
            client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
            break
        except Exception as e:
            print(f"Connection failed: {e}")
            print("Retrying in 5 seconds...")
            time.sleep(5)
    
    # Start the loop
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print("Shutting down...")
        client.disconnect()
    except Exception as e:
        print(f"Fatal error: {e}")

if __name__ == "__main__":
    main()
