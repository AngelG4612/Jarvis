import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/mirror_mqtt.dart';

class MagicMirrorScreen extends StatefulWidget {
  final MirrorMQTT mqtt;
  const MagicMirrorScreen({super.key, required this.mqtt});

  @override
  State<MagicMirrorScreen> createState() => _MagicMirrorScreenState();
}

class _MagicMirrorScreenState extends State<MagicMirrorScreen>
    with WidgetsBindingObserver {
  late WebViewController webViewController;
  bool connected = false;
  bool isLoading = false;
  String? errorMessage;
  late Orientation currentOrientation;

  //static const String mirrorUrl = 'http://192.168.0.220:8080';
  //static const String mirrorUrl = 'http://10.229.241.164:8080';
  static const String mirrorUrl = 'http://192.168.0.220:8080';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Allow screen to auto-rotate
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    currentOrientation = MediaQuery.of(context).orientation;
    _initializeWebView();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Handle lifecycle changes if needed
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Lock back to portrait when leaving this screen
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  void _initializeWebView() {
    webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => isLoading = true);
          },
          onPageFinished: (String url) {
            setState(() {
              isLoading = false;
              errorMessage = null;
            });
          },

          // FIXED: older WebView versions do NOT have error.url
          onHttpError: (HttpResponseError error) {
            final failingUrl = error.request?.uri.toString();

            if (failingUrl == mirrorUrl) {
              setState(() {
                errorMessage =
                    'HTTP Error: ${error.response?.statusCode}\nURL: $failingUrl';
              });
            }
          },

          onWebResourceError: (WebResourceError error) {
            // cannot check URL in older versions, so ignore harmless module errors
            if (isLoading) return;

            setState(() {
              errorMessage = 'Web Error: ${error.description}';
            });
          },
        ),
      )
      ..loadRequest(Uri.parse(mirrorUrl));
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.mqtt.isConnected ? Colors.green : Colors.red;
    final text = widget.mqtt.isConnected ? 'Connected' : 'Disconnected';
    final screenSize = MediaQuery.of(context).size;

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          // Reset orientation when leaving
          SystemChrome.setPreferredOrientations([
            DeviceOrientation.portraitUp,
          ]);
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          title: const Text(
            'Jarvis Screen',
            style: TextStyle(color: Colors.white),
          ),
        ),
        body: OrientationBuilder(
          builder: (context, orientation) {
            return Stack(
              children: [
                // Full-screen WebView with responsive sizing
                SizedBox(
                  width: screenSize.width,
                  height: screenSize.height -
                      kToolbarHeight -
                      MediaQuery.of(context).padding.top,
                  child: WebViewWidget(controller: webViewController),
                ),

                // Loading indicator
                if (isLoading)
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.black87,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(color: Colors.green),
                          SizedBox(height: 12),
                          Text(
                            'Loading MagicMirror...',
                            style: TextStyle(color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Error message
                if (errorMessage != null && !isLoading)
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      margin: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.red.shade900,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error,
                              color: Colors.white, size: 48),
                          const SizedBox(height: 12),
                          Text(
                            errorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.white),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () {
                              setState(() => errorMessage = null);
                              webViewController.reload();
                            },
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Connection status indicator
                Positioned(
                  top: 12,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: color, width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.circle, color: color, size: 10),
                        const SizedBox(width: 6),
                        Text(text,
                            style:
                                TextStyle(color: color, fontSize: 12)),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
