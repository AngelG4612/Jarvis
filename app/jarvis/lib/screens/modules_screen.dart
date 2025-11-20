import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';

class ModulesScreen extends StatefulWidget {
  final MirrorMQTT mqtt;
  const ModulesScreen({super.key, required this.mqtt});

  @override
  State<ModulesScreen> createState() => _ModulesScreenState();
}

class _ModulesScreenState extends State<ModulesScreen> {
  // Modules must match MagicMirror config.js names
  final Map<String, bool> modules = {
    'clock': true,
    'calendar': true,
    'weather': true,
    'newsfeed': false,
    'compliments': false,
    'alert': true,
    'updatenotification': true,
  };

  void _toggleModule(String name, bool enabled) {
    setState(() {
      modules[name] = enabled;
    });

    // Send MQTT message to Pi using MMM-Remote-Control API format
    // Format: "moduleName:show" or "moduleName:hide"
    final action = enabled ? 'show' : 'hide';
    widget.mqtt.publish('mirror/module', '$name:$action');
  }

  void _addModuleDialog() {
    final controller = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text(
          'Add New Module',
          style: TextStyle(color: Colors.white),
        ),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Enter module name',
            hintStyle: TextStyle(color: Colors.white54),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
          TextButton(
            onPressed: () {
              final name = controller.text.trim();
              if (name.isNotEmpty && !modules.containsKey(name)) {
                setState(() => modules[name] = false);
                Navigator.pop(context);
              }
            },
            child: const Text(
              'Add',
              style: TextStyle(color: Colors.greenAccent),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Modules', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.black,
        actions: [
          IconButton(
            onPressed: _addModuleDialog,
            icon: const Icon(Icons.add_circle_outline, color: Colors.white),
            tooltip: 'Add Module',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: modules.keys.map((name) {
          final enabled = modules[name]!;
          return Card(
            color: Colors.white10,
            margin: const EdgeInsets.symmetric(vertical: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15),
            ),
            child: SwitchListTile(
              activeColor: Colors.greenAccent,
              inactiveThumbColor: Colors.grey,
              value: enabled,
              onChanged: (val) => _toggleModule(name, val),
              title: Text(
                name,
                style: const TextStyle(color: Colors.white, fontSize: 18),
              ),
              subtitle: Text(
                enabled ? 'Enabled' : 'Disabled',
                style: TextStyle(
                  color: enabled ? Colors.greenAccent : Colors.redAccent,
                  fontSize: 14,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
