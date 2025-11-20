import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';

typedef MessageCallback = void Function(String topic, String message);

class MirrorMQTT {
  late MqttServerClient client;
  final String broker = '192.168.0.220';
  final int port = 1883;
  final String clientId =
      'flutter-jarvis-${DateTime.now().millisecondsSinceEpoch}';

  bool _isConnected = false;
  MessageCallback? onMessageReceived;

  MirrorMQTT() {
    _initializeClient();
  }

  void _initializeClient() {
    client = MqttServerClient(broker, clientId)
      ..port = port
      ..keepAlivePeriod = 20
      ..onDisconnected = _onDisconnected
      ..onConnected = _onConnected
      ..onSubscribed = _onSubscribed;
  }

  Future<void> connect() async {
    try {
      print('Connecting to MQTT broker at $broker:$port...');
      // Set a timeout for connection attempts
      final result = await client.connect().timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          throw Exception('MQTT connection timeout after 5 seconds');
        },
      );
      print('Connection result: $result');

      // Only set to true if connection was successful
      if (client.connectionStatus?.state == MqttConnectionState.connected) {
        _isConnected = true;
        _subscribeToTopics();
      } else {
        _isConnected = false;
        throw Exception('Failed to establish MQTT connection');
      }
    } catch (e) {
      print('Connection to MQTT broker failed: $e');
      _isConnected = false;
      rethrow;
    }
  }

  void _subscribeToTopics() {
    // Subscribe to sensor data
    client.subscribe('mirror/sensors', MqttQos.atLeastOnce);
    // Subscribe to device status
    client.subscribe('mirror/devices/#', MqttQos.atLeastOnce);
    // Subscribe to module updates
    client.subscribe('mirror/modules/#', MqttQos.atLeastOnce);
  }

  void _onConnected() {
    print('Connected to MQTT broker');
    _isConnected = true;

    // Listen for incoming messages
    client.updates!.listen((List<MqttReceivedMessage<MqttMessage>> c) {
      for (final recMess in c) {
        final recTopic = recMess.topic;
        final recPayload = recMess.payload as MqttPublishMessage;
        final message = String.fromCharCodes(recPayload.payload.message);

        print('Received message: topic=$recTopic, message=$message');
        onMessageReceived?.call(recTopic, message);
      }
    });
  }

  void _onDisconnected() {
    print('Disconnected from MQTT broker');
    _isConnected = false;
  }

  void _onSubscribed(String topic) {
    print('Subscribed to topic: $topic');
  }

  void publish(String topic, String message) {
    if (!_isConnected) {
      print('Not connected to MQTT broker');
      return;
    }

    final builder = MqttClientPayloadBuilder();
    builder.addString(message);
    client.publishMessage(topic, MqttQos.atLeastOnce, builder.payload!);
    print('Published message to $topic: $message');
  }

  void disconnect() {
    client.disconnect();
    _isConnected = false;
  }

  bool get isConnected => _isConnected;
}
