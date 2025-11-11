import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';

class SensorsScreen extends StatefulWidget {
  final MirrorMQTT mqtt;
  const SensorsScreen({super.key, required this.mqtt});

  @override
  State<SensorsScreen> createState() => _SensorsScreenState();
}

class _SensorsScreenState extends State<SensorsScreen> {
  double? temperature;
  double? humidity;
  double? pressure;

  @override
  void initState() {
    super.initState();

    // Listen for MQTT sensor updates
    widget.mqtt.onMessageReceived = (topic, message) {
      if (topic == 'mirror/sensors') {
        _parseSensorData(message);
      }
    };

    // Request latest sensor data when opening the screen
    widget.mqtt.publish('mirror/sensors/request', 'true');
  }

  void _parseSensorData(String message) {
    try {
      final data = message.split(',');
      for (var item in data) {
        final parts = item.split(':');
        if (parts.length == 2) {
          switch (parts[0].trim()) {
            case 'temp':
              temperature = double.tryParse(parts[1]);
              break;
            case 'hum':
              humidity = double.tryParse(parts[1]);
              break;
            case 'press':
              pressure = double.tryParse(parts[1]);
              break;
          }
        }
      }
      setState(() {});
    } catch (e) {
      debugPrint('Error parsing sensor data: $e');
    }
  }

  void _refreshData() {
    widget.mqtt.publish('mirror/sensors/request', 'true');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title:
            const Text('Environmental Sensors', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.black,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            const SizedBox(height: 30),
            _sensorCard(
              '🌡 Temperature',
              temperature != null ? '${temperature!.toStringAsFixed(1)} °C' : '--',
            ),
            const SizedBox(height: 20),
            _sensorCard(
              '💧 Humidity',
              humidity != null ? '${humidity!.toStringAsFixed(1)} %' : '--',
            ),
            const SizedBox(height: 20),
            _sensorCard(
              '🌬 Pressure',
              pressure != null ? '${pressure!.toStringAsFixed(1)} hPa' : '--',
            ),
            const Spacer(),
            ElevatedButton.icon(
              onPressed: _refreshData,
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh Data'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.tealAccent,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sensorCard(String title, String value) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.tealAccent, width: 1),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: const TextStyle(color: Colors.white70, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.tealAccent,
              fontSize: 26,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
