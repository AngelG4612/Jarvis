import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'services/mirror_mqtt.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Create the MQTT service
  final mqtt = MirrorMQTT();

  // Try to connect but don't crash if it fails
  try {
    await mqtt.connect();
  } catch (e) {
    debugPrint('Failed to connect to MQTT broker: $e');
    debugPrint('App will continue in offline mode');
  }

  runApp(JarvisApp(mqtt: mqtt));
}

class JarvisApp extends StatelessWidget {
  final MirrorMQTT mqtt;
  const JarvisApp({super.key, required this.mqtt});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Jarvis Remote',
      theme: ThemeData.dark().copyWith(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6C63FF)),
      ),
      home: HomeScreen(mqtt: mqtt),
    );
  }
}
