import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';
import 'sensor_Screen.dart';
import 'magicmirror_screen.dart';
import 'modules_screen.dart';
import 'music_screen.dart';
import 'remote_control.dart';

class HomeScreen extends StatefulWidget {
  final MirrorMQTT mqtt;
  const HomeScreen({super.key, required this.mqtt});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      MagicMirrorScreen(mqtt: widget.mqtt),
      ModulesScreen(mqtt: widget.mqtt),
      SensorsScreen(mqtt: widget.mqtt),
      MusicScreen(mqtt: widget.mqtt),
      RemoteControl(mqtt: widget.mqtt),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        backgroundColor: Colors.grey[900],
        selectedItemColor: const Color(0xFF6C63FF),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Mirror'),
          BottomNavigationBarItem(
            icon: Icon(Icons.extension),
            label: 'Modules',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.sensors), label: 'Sensors'),
          BottomNavigationBarItem(icon: Icon(Icons.music_note), label: 'Music'),
          BottomNavigationBarItem(
            icon: Icon(Icons.videogame_asset),
            label: 'Control',
          ),
        ],
      ),
    );
  }
}
