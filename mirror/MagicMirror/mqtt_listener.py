import paho.mqtt.client as mqtt
import os
import request

MIRROR_API = "http://localhost:8080/api"

def on_mesage(client, userdata,msg):
	topic = msg.topic
	payload = msg.payload.decode()
	print(f"Received {payload} on {topic}")
	
	if topic == "mirror/display":
	    os.system(f"vcgencmd display_power {'1', id payload == 'on' else '0'}")
	
	elif topic == "mirror/restart":
	    request.get(f"{MIRROR_API}/restart")
	
	elif topic == "mirror/module":
	    module, action = payload.split(":")
	    request.get(f"{MIRROT_API}/module/{module}/{action}")

client = mqtt.Client()
client.on_message = on_message
client.connect("localhost", 1883,60)
client.subscribe("mirror/#")
client.loop_forever()
