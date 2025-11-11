import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';

class MusicScreen extends StatefulWidget {
  final MirrorMQTT mqtt;
  const MusicScreen({super.key, required this.mqtt});

  @override
  State<MusicScreen> createState() => _MusicScreenState();
}

class _MusicScreenState extends State<MusicScreen> {
  String _selectedPlayer = 'spotify'; // 'spotify' or 'local'
  double _volume = 50;

  // Helper to send MQTT command to the selected player
  void _sendCommand(String cmd) {
    if (_selectedPlayer == 'spotify') {
      widget.mqtt.publish('mirror/spotify/control', cmd);
    } else {
      widget.mqtt.publish('mirror/music', cmd);
    }
  }

  // Helper to send MQTT command with payload
  void _sendCommandWithPayload(String cmd, String payload) {
    if (_selectedPlayer == 'spotify') {
      widget.mqtt.publish('mirror/spotify/control', '$cmd:$payload');
    } else {
      widget.mqtt.publish('mirror/music', '$cmd:$payload');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'Music Player',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Player Selection - Enhanced Visibility
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.greenAccent, width: 2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Select Player',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: SegmentedButton<String>(
                            segments: <ButtonSegment<String>>[
                              ButtonSegment<String>(
                                value: 'spotify',
                                label: Text(
                                  'Spotify',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: _selectedPlayer == 'spotify'
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                  ),
                                ),
                                icon: const Icon(Icons.music_note),
                              ),
                              ButtonSegment<String>(
                                value: 'local',
                                label: Text(
                                  'Local',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: _selectedPlayer == 'local'
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                  ),
                                ),
                                icon: const Icon(Icons.library_music),
                              ),
                            ],
                            selected: <String>{_selectedPlayer},
                            onSelectionChanged: (Set<String> newSelection) {
                              setState(() {
                                _selectedPlayer = newSelection.first;
                              });
                            },
                            style: ButtonStyle(
                              backgroundColor:
                                  WidgetStateProperty.resolveWith<Color?>((
                                    Set<WidgetState> states,
                                  ) {
                                    if (states.contains(WidgetState.selected)) {
                                      return Colors.greenAccent;
                                    }
                                    return Colors.grey.withOpacity(0.2);
                                  }),
                              foregroundColor:
                                  WidgetStateProperty.resolveWith<Color?>((
                                    Set<WidgetState> states,
                                  ) {
                                    if (states.contains(WidgetState.selected)) {
                                      return Colors.black;
                                    }
                                    return Colors.white70;
                                  }),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // Playback Controls
              Text(
                'Playback Controls',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 15),
              _button(
                Icons.play_arrow,
                "Play",
                Colors.greenAccent,
                () => _sendCommand("play"),
              ),
              const SizedBox(height: 15),
              Row(
                children: [
                  Expanded(
                    child: _button(
                      Icons.skip_previous,
                      "Prev",
                      Colors.blueAccent,
                      () => _sendCommand("previous"),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _button(
                      Icons.pause,
                      "Pause",
                      Colors.orangeAccent,
                      () => _sendCommand("pause"),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _button(
                      Icons.skip_next,
                      "Next",
                      Colors.purpleAccent,
                      () => _sendCommand("next"),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              _button(
                Icons.stop,
                "Stop",
                Colors.redAccent,
                () => _sendCommand("stop"),
              ),

              // Spotify-Only Controls
              if (_selectedPlayer == 'spotify') ...[
                const SizedBox(height: 30),
                Text(
                  'Spotify Controls',
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 15),
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: _button(
                        Icons.favorite_border,
                        "Like",
                        Colors.pinkAccent,
                        () => _sendCommand("like"),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 1,
                      child: _button(
                        Icons.shuffle,
                        "Shuffle",
                        Colors.cyanAccent,
                        () => _sendCommand("shuffle"),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 1,
                      child: _button(
                        Icons.repeat,
                        "Repeat",
                        Colors.amberAccent,
                        () => _sendCommand("repeat"),
                      ),
                    ),
                  ],
                ),
              ],

              // Local Player Controls
              if (_selectedPlayer == 'local') ...[
                const SizedBox(height: 30),
                Text(
                  'Local Player',
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 15),
                Row(
                  children: [
                    Expanded(
                      child: _button(
                        Icons.play_arrow,
                        "Play Local",
                        Colors.greenAccent,
                        () => _sendCommand("play_local"),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _button(
                        Icons.radio,
                        "Radio",
                        Colors.blueAccent,
                        () => _sendCommand("radio"),
                      ),
                    ),
                  ],
                ),
              ],

              // Volume Control
              const SizedBox(height: 30),
              Text(
                'Volume',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(Icons.volume_down, color: Colors.white54),
                  Expanded(
                    child: Slider(
                      value: _volume,
                      min: 0,
                      max: 100,
                      activeColor: Colors.greenAccent,
                      inactiveColor: Colors.white12,
                      onChanged: (double value) {
                        setState(() {
                          _volume = value;
                        });
                        _sendCommandWithPayload(
                          "volume",
                          value.toStringAsFixed(0),
                        );
                      },
                    ),
                  ),
                  Icon(Icons.volume_up, color: Colors.white54),
                  const SizedBox(width: 10),
                  Text(
                    '${_volume.toStringAsFixed(0)}%',
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Reusable button builder
  Widget _button(IconData icon, String text, Color color, VoidCallback onTap) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: Colors.white),
      label: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 15,
          fontWeight: FontWeight.bold,
        ),
        overflow: TextOverflow.ellipsis,
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withOpacity(0.2),
        minimumSize: const Size(double.infinity, 50),
        side: BorderSide(color: color, width: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    );
  }
}
