import 'mirror_mqtt.dart';

/// Service class to handle Spotify playback control via MQTT
class SpotifyService {
  final MirrorMQTT mqtt;

  SpotifyService({required this.mqtt});

  /// Send a command to the Spotify module
  void sendCommand(String command) {
    mqtt.publish('mirror/spotify/control', command);
  }

  /// Send a command with a parameter
  void sendCommandWithParam(String command, String param) {
    mqtt.publish('mirror/spotify/control', '$command:$param');
  }

  /// Play the current track
  void play() => sendCommand('play');

  /// Pause the current track
  void pause() => sendCommand('pause');

  /// Skip to the next track
  void nextTrack() => sendCommand('next');

  /// Go to the previous track
  void previousTrack() => sendCommand('previous');

  /// Stop playback
  void stop() => sendCommand('stop');

  /// Add current track to liked songs
  void like() => sendCommand('like');

  /// Toggle shuffle mode
  void toggleShuffle() => sendCommand('shuffle');

  /// Toggle repeat mode (off -> all -> one -> off)
  void toggleRepeat() => sendCommand('repeat');

  /// Set volume level (0-100)
  void setVolume(int volume) {
    if (volume < 0 || volume > 100) {
      throw ArgumentError('Volume must be between 0 and 100');
    }
    sendCommandWithParam('volume', volume.toString());
  }

  /// Seek to a specific position in the track (milliseconds)
  void seek(int milliseconds) {
    sendCommandWithParam('seek', milliseconds.toString());
  }

  /// Transfer playback to a specific device
  void transferToDevice(String deviceId) {
    sendCommandWithParam('device', deviceId);
  }

  /// Play a specific playlist by ID
  void playPlaylist(String playlistId) {
    sendCommandWithParam('playlist', playlistId);
  }

  /// Search and play a track by name
  void playTrack(String trackName) {
    sendCommandWithParam('play_track', trackName);
  }
}
