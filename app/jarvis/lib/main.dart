import 'package:flutter/material.dart';
import 'screens/magicmirror_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Jarvis Remote',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: const Color(0xFF6C63FF)),
      home: const MagicMirrorScreen(), // <-- launch our screen
    );
  }
}
