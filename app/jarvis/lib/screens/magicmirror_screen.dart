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
    mirror = MirrorMQTT();
    mirror
        .connect()
        .then((_) {
          setState(() => connected = true);
        })
        .catchError((_) {
          setState(() => connected = false);
        });
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
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'Jarvis Screen',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.black,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: connected
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.wifi, color: color),
                      const SizedBox(width: 8),
                      Text(text, style: TextStyle(color: color, fontSize: 18)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => mirror.publish('mirror/display', 'on'),
                    child: const Text('Display ON'),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => mirror.publish('mirror/display', 'off'),
                    child: const Text('Display OFF'),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => mirror.publish('mirror/restart', ''),
                    child: const Text('Restart Mirror'),
                  ),
                ],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Jarvis Logo
                  Image.asset(
                    'assets/images/possible_JarvisLogo.png',
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                  ),  
                  const SizedBox(height: 15),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.wifi_off, color: color, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        text,
                        style: TextStyle(
                          color: color,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Attempting to connect to Jarvis Mirror...',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 14,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
