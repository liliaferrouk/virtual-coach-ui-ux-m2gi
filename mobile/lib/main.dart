import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const VirtualCoachApp());
}

class VirtualCoachApp extends StatelessWidget {
  const VirtualCoachApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Virtual Coach',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.purple,
        scaffoldBackgroundColor: const Color(0xFF1A1A2E),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF6C63FF),
          secondary: const Color(0xFFFF6584),
          surface: const Color(0xFF16213E),
          background: const Color(0xFF1A1A2E),
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.bold,
          ),
          bodyLarge: TextStyle(
            color: Colors.white70,
            fontSize: 16,
          ),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
