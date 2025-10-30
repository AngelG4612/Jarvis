import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';

class MagicMirrorScreen extends StatefulWidget {
  const MagicMirrorScreen({super.key});

  @override
  State<MagicMirrorScreen> createState() => _MagicMirrorScreenState();
}

class _MagicMirrorScreenState extends State<MagicMirrorScreen> {
  late MirrorMQTT mirror;
  bool connected = false;

  @override
  void initState() {
    super.initState();
    mirror = MirrorMQTT(
      onConnectionChanged: (status) {
        setState(() => connected = status);
      },
    );
    mirror.connect();
  }

  @override
  void dispose() {
    mirror.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = connected ? Colors.green : Colors.red;
    final text = connected ? 'Connected' : 'Disconnected';

    return Scaffold(
      appBar: AppBar(title: const Text('Jarvis Remote Control')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(connected ? Icons.wifi : Icons.wifi_off, color: color),
                const SizedBox(width: 8),
                Text(text, style: TextStyle(color: color, fontSize: 18)),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: connected
                  ? () => mirror.publish('mirror/display', 'on')
                  : null,
              child: const Text('Display ON'),
            ),
            ElevatedButton(
              onPressed: connected
                  ? () => mirror.publish('mirror/display', 'off')
                  : null,
              child: const Text('Display OFF'),
            ),
            ElevatedButton(
              onPressed: connected
                  ? () => mirror.publish('mirror/restart', '')
                  : null,
              child: const Text('Restart Mirror'),
            ),
          ],
        ),
      ),
    );
  }
}
