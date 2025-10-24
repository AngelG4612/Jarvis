import 'package:flutter/material.dart';


class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key); 

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('JARVIS Dashboard'),
        backgroundColor: Colors.indigo,
        centerTitle: true,
      ),
      body:Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 16.0,
          mainAxisSpacing: 16.0,
          children: [
            _buildCard(context, Icons.bus_alert, "CTA Bus", Colors.blue),
            _buildCard(context, Icons.cloud, "Weather", Colors.orange),
            _buildCard(context, Icons.music_note, "Spotify", Colors.green),
            _buildCard(context, Icons.sensors, "Sensors", Colors.purple),
          ],
        ),
      ),
    );
  }
   Widget _buildCard(BuildContext context, IconData icon, String title, Color color) {
    return GestureDetector(
      onTap: () => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Opening $title...'))),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 50),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
