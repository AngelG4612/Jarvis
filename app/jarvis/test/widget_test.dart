// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:jarvis/main.dart';
import 'package:jarvis/services/mirror_mqtt.dart';

void main() {
  testWidgets('Jarvis app starts up', (WidgetTester tester) async {
    // Create a mock MQTT client
    final mqtt = MirrorMQTT();

    // Build our app and trigger a frame.
    await tester.pumpWidget(JarvisApp(mqtt: mqtt));

    // Verify that the app displays the material app
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
