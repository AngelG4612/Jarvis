import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';

class MusicScreen extends StatelessWidget {
  final MirrorMQTT mqtt;
  const MusicScreen({super.key, required this.mqtt});

  // Helper to send MQTT command
  void send(String cmd) => mqtt.publish('mirror/music', cmd);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'Music Player',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.black,
      ),
      body: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Buttons for music controls
            _button(
              Icons.play_arrow,
              "Play Local Song",
              Colors.greenAccent,
              () => send("play"),
            ),
            const SizedBox(height: 15),
            _button(
              Icons.radio,
              "Play Internet Radio",
              Colors.blueAccent,
              () => send("radio"),
            ),
            const SizedBox(height: 15),
            _button(
              Icons.pause,
              "Pause",
              Colors.orangeAccent,
              () => send("pause"),
            ),
            const SizedBox(height: 15),
            _button(
              Icons.play_circle,
              "Resume",
              Colors.tealAccent,
              () => send("resume"),
            ),
            const SizedBox(height: 15),
            _button(
              Icons.stop,
              "Stop",
              Colors.redAccent,
              () => send("stop"),
            ),
          ],
        ),
      ),
    );
  }

  // Reusable button builder
  Widget _button(IconData icon, String text, Color color, VoidCallback onTap) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: color),
      label: Text(
        text,
        style: TextStyle(color: color, fontSize: 18),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white10,
        minimumSize: const Size(double.infinity, 60),
        side: BorderSide(color: color, width: 1.5),
      ),
    );
  }
}
