import 'package:flutter/material.dart';
import 'welcome_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Disaster Relief App',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFEF4444),
          brightness: Brightness.dark,
          surface: const Color(0xFF131B2E),
          onSurface: const Color(0xFFF1F5F9),
          primary: const Color(0xFFEF4444),
          onPrimary: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0B0F19),
          foregroundColor: Color(0xFFF1F5F9),
          elevation: 0,
        ),
      ),
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFEF4444),
          brightness: Brightness.dark,
          surface: const Color(0xFF131B2E),
          onSurface: const Color(0xFFF1F5F9),
          primary: const Color(0xFFEF4444),
          onPrimary: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0B0F19),
          foregroundColor: Color(0xFFF1F5F9),
          elevation: 0,
        ),
      ),
      home: const WelcomeScreen(),
    );
  }
}
