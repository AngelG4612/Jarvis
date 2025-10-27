import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';

typedef ConnectionCallback = void Function(bool connected);
typedef MessageCallback = void Function(String topic, String message);

class MirrorMQTT {
  static const String DEFAULT_HOST = '10.0.0.70'; // Pi IP
  static const int DEFAULT_PORT = 1883;
  static const String CLIENT_ID = 'jarvis_flutter_client';

  late final MqttServerClient client;
  final String host;
  final int port;
  bool _isConnected = false;

  ConnectionCallback? onConnectionChanged;
  MessageCallback? onMessageReceived;

  bool get isConnected => _isConnected;

  MirrorMQTT({
    this.host = DEFAULT_HOST,
    this.port = DEFAULT_PORT,
    this.onConnectionChanged,
    this.onMessageReceived,
  }) {
    client = MqttServerClient(host, CLIENT_ID);
  }

  Future<bool> connect() async {
    if (_isConnected) {
      print('Already connected to MQTT broker');
      return true;
    }

    client.port = port;
    client.keepAlivePeriod = 30;
    client.onConnected = _onConnected;
    client.onDisconnected = _onDisconnected;
    client.onSubscribed = _onSubscribed;

    // Set up message handling
    client.updates?.listen((List<MqttReceivedMessage<MqttMessage>> messages) {
      for (var msg in messages) {
        final recMess = msg.payload as MqttPublishMessage;
        final message = MqttPublishPayload.bytesToStringAsString(
          recMess.payload.message,
        );
        onMessageReceived?.call(msg.topic, message);
      }
    });

    try {
      await client.connect();
      return true;
    } catch (e) {
      print('❌ Failed to connect: $e');
      _onDisconnected();
      client.disconnect();
      return false;
    }
  }

  void _onConnected() {
    print('✅ Connected to MQTT broker at $host:$port');
    _isConnected = true;
    onConnectionChanged?.call(true);

    // Subscribe to mirror status topics
    subscribe('mirror/status/#');
  }

  void _onDisconnected() {
    print('❌ Disconnected from MQTT broker');
    _isConnected = false;
    onConnectionChanged?.call(false);
  }

  void _onSubscribed(String topic) {
    print('✓ Subscribed to $topic');
  }

  void subscribe(String topic) {
    if (_isConnected) {
      client.subscribe(topic, MqttQos.atLeastOnce);
    }
  }

  void publish(String topic, String message) {
    if (!_isConnected) {
      print('❌ Not connected to MQTT broker');
      return;
    }

    try {
      final builder = MqttClientPayloadBuilder()..addString(message);
      client.publishMessage(topic, MqttQos.atLeastOnce, builder.payload!);
      print('✓ Published to $topic: $message');
    } catch (e) {
      print('❌ Failed to publish: $e');
    }
  }

  // Mirror-specific control methods
  void setDisplayPower(bool on) {
    publish('mirror/display', on ? 'on' : 'off');
  }

  void controlModule(String moduleName, String action) {
    publish('mirror/module', '$moduleName:$action');
  }

  void restartMirror() {
    publish('mirror/restart', '');
  }

  void disconnect() {
    if (_isConnected) {
      client.disconnect();
      _isConnected = false;
    }
  }
}
