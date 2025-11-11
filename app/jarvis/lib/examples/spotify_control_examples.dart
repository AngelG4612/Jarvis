import 'package:flutter/material.dart';
import '../services/mirror_mqtt.dart';
import '../services/spotify_service.dart';

/// Example: Minimal Spotify Control Widget
/// Use this as a reference for adding Spotify controls to other screens
class MinimalSpotifyControlExample extends StatefulWidget {
  final MirrorMQTT mqtt;
  const MinimalSpotifyControlExample({super.key, required this.mqtt});

  @override
  State<MinimalSpotifyControlExample> createState() =>
      _MinimalSpotifyControlExampleState();
}

class _MinimalSpotifyControlExampleState
    extends State<MinimalSpotifyControlExample> {
  late SpotifyService spotify;

  @override
  void initState() {
    super.initState();
    spotify = SpotifyService(mqtt: widget.mqtt);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Spotify Control Example')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Simple playback controls
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.skip_previous),
                  onPressed: spotify.previousTrack,
                ),
                IconButton(
                  icon: const Icon(Icons.play_arrow),
                  onPressed: spotify.play,
                ),
                IconButton(
                  icon: const Icon(Icons.pause),
                  onPressed: spotify.pause,
                ),
                IconButton(
                  icon: const Icon(Icons.skip_next),
                  onPressed: spotify.nextTrack,
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Like button
            ElevatedButton.icon(
              icon: const Icon(Icons.favorite),
              label: const Text('Like'),
              onPressed: spotify.like,
            ),
          ],
        ),
      ),
    );
  }
}

/// Example: Custom Music Player Widget with State
class CustomMusicPlayerExample extends StatefulWidget {
  final MirrorMQTT mqtt;
  const CustomMusicPlayerExample({super.key, required this.mqtt});

  @override
  State<CustomMusicPlayerExample> createState() =>
      _CustomMusicPlayerExampleState();
}

class _CustomMusicPlayerExampleState extends State<CustomMusicPlayerExample> {
  late SpotifyService spotify;
  bool isPlaying = false;
  double volume = 50;
  String currentTrack = 'Loading...';

  @override
  void initState() {
    super.initState();
    spotify = SpotifyService(mqtt: widget.mqtt);

    // Listen for MQTT messages about current track
    widget.mqtt.onMessageReceived = (topic, message) {
      if (topic == 'mirror/spotify/status') {
        setState(() {
          currentTrack = message;
        });
      }
    };
  }

  void _togglePlayPause() {
    setState(() {
      isPlaying = !isPlaying;
    });
    if (isPlaying) {
      spotify.play();
    } else {
      spotify.pause();
    }
  }

  void _setVolume(double newVolume) {
    setState(() {
      volume = newVolume;
    });
    spotify.setVolume(newVolume.toInt());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Custom Music Player')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Track display
            Text(
              currentTrack,
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),

            // Play/Pause button
            FloatingActionButton(
              onPressed: _togglePlayPause,
              child: Icon(isPlaying ? Icons.pause : Icons.play_arrow),
            ),
            const SizedBox(height: 40),

            // Volume control
            Text('Volume: ${volume.toStringAsFixed(0)}%'),
            Slider(value: volume, min: 0, max: 100, onChanged: _setVolume),
            const SizedBox(height: 20),

            // Previous/Next buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  icon: const Icon(Icons.skip_previous),
                  label: const Text('Previous'),
                  onPressed: spotify.previousTrack,
                ),
                ElevatedButton.icon(
                  icon: const Icon(Icons.skip_next),
                  label: const Text('Next'),
                  onPressed: spotify.nextTrack,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    widget.mqtt.onMessageReceived = null;
    super.dispose();
  }
}

/// Example: Queue/Playlist Controller
class PlaylistControllerExample extends StatefulWidget {
  final MirrorMQTT mqtt;
  const PlaylistControllerExample({super.key, required this.mqtt});

  @override
  State<PlaylistControllerExample> createState() =>
      _PlaylistControllerExampleState();
}

class _PlaylistControllerExampleState extends State<PlaylistControllerExample> {
  late SpotifyService spotify;

  // Example playlists - replace with your actual playlist IDs
  final List<Map<String, String>> playlists = [
    {'name': 'Workout Mix', 'id': 'spotify:playlist:37i9dQZF1DXdPec7aLCVrF'},
    {'name': 'Chill Vibes', 'id': 'spotify:playlist:37i9dQZF1DX4UtSsGT1Sbe'},
    {'name': 'Top 50 Global', 'id': 'spotify:playlist:37i9dQZEVXbMDoHDXkVam9'},
  ];

  @override
  void initState() {
    super.initState();
    spotify = SpotifyService(mqtt: widget.mqtt);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Playlist Controller')),
      body: ListView.builder(
        itemCount: playlists.length,
        itemBuilder: (context, index) {
          final playlist = playlists[index];
          return ListTile(
            title: Text(playlist['name']!),
            trailing: const Icon(Icons.play_circle),
            onTap: () {
              spotify.playPlaylist(playlist['id']!);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Playing ${playlist['name']}'),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Example: Voice/Gesture-Triggered Control
class VoiceControlExample extends StatelessWidget {
  final MirrorMQTT mqtt;
  const VoiceControlExample({super.key, required this.mqtt});

  @override
  Widget build(BuildContext context) {
    final spotify = SpotifyService(mqtt: mqtt);

    return Scaffold(
      appBar: AppBar(title: const Text('Voice Commands')),
      body: Center(
        child: GridView.count(
          crossAxisCount: 2,
          padding: const EdgeInsets.all(20),
          mainAxisSpacing: 20,
          crossAxisSpacing: 20,
          children: [
            _CommandButton(
              icon: Icons.play_arrow,
              label: 'Play',
              onTap: spotify.play,
            ),
            _CommandButton(
              icon: Icons.pause,
              label: 'Pause',
              onTap: spotify.pause,
            ),
            _CommandButton(
              icon: Icons.skip_next,
              label: 'Next Song',
              onTap: spotify.nextTrack,
            ),
            _CommandButton(
              icon: Icons.favorite,
              label: 'Like',
              onTap: spotify.like,
            ),
            _CommandButton(
              icon: Icons.shuffle,
              label: 'Shuffle',
              onTap: spotify.toggleShuffle,
            ),
            _CommandButton(
              icon: Icons.repeat,
              label: 'Repeat',
              onTap: spotify.toggleRepeat,
            ),
          ],
        ),
      ),
    );
  }
}

/// Reusable command button widget
class _CommandButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _CommandButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.grey[900],
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: Colors.cyan),
            const SizedBox(height: 10),
            Text(label, style: const TextStyle(color: Colors.white)),
          ],
        ),
      ),
    );
  }
}
