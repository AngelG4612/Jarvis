import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';

class RemoteControl extends StatefulWidget {
  final MirrorMQTT mqtt;
  const RemoteControl({super.key, required this.mqtt});

  @override
  State<RemoteControl> createState() => _RemoteControlState();
}

class _RemoteControlState extends State<RemoteControl> {
  bool displayOn = true;
  bool restarting = false;

  void _toggleDisplay() {
    final newState = !displayOn;
    widget.mqtt.publish('mirror/display', newState ? 'on' : 'off');
    setState(() => displayOn = newState);
  }

  void _restartMirror() async {
    setState(() => restarting = true);
    widget.mqtt.publish('mirror/restart', 'true');

    // simulate short delay for restart feedback
    await Future.delayed(const Duration(seconds: 3));
    setState(() => restarting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'Remote Control',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.black,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Display toggle button
            ElevatedButton.icon(
              onPressed: _toggleDisplay,
              icon: Icon(
                displayOn ? Icons.visibility_off : Icons.visibility,
                color: Colors.white,
              ),
              label: Text(
                displayOn ? 'Turn Display Off' : 'Turn Display On',
                style: const TextStyle(color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent,
                minimumSize: const Size(double.infinity, 60),
              ),
            ),
            const SizedBox(height: 20),

            // Restart button
            ElevatedButton.icon(
              onPressed: restarting ? null : _restartMirror,
              icon: const Icon(Icons.restart_alt, color: Colors.white),
              label: Text(
                restarting ? 'Restarting...' : 'Restart Jarvis',
                style: const TextStyle(color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepOrange,
                minimumSize: const Size(double.infinity, 60),
              ),
            ),

            const SizedBox(height: 30),

            // Connection status indicator
            _statusIndicator(widget.mqtt.isConnected),
          ],
        ),
      ),
    );
  }

  Widget _statusIndicator(bool connected) {
    final color = connected ? Colors.greenAccent : Colors.redAccent;
    final text = connected ? 'Connected to Jarvis' : 'Disconnected';
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(connected ? Icons.wifi : Icons.wifi_off, color: color),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(
            color: color,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
