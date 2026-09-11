import 'package:flutter/material.dart';

import 'welcome_screen.dart';
import 'incident_report_screen.dart';

import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storage = StorageService.instance;
  await storage.init();
  final isLoggedIn = await storage.isLoggedIn();
  final savedName = await storage.getUserName();
  final savedRole = await storage.getUserRole();

  runApp(
    MyApp(
      initialIsLoggedIn: isLoggedIn && (savedName != null),
      initialUserName: savedName,
      initialUserRole: savedRole,
    ),
  );
}

class MyApp extends StatefulWidget {
  final bool? initialIsLoggedIn;
  final String? initialUserName;
  final String? initialUserRole;

  const MyApp({
    super.key,
    this.initialIsLoggedIn,
    this.initialUserName,
    this.initialUserRole,
  });

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late bool _isLoggedIn;
  String? _userName;
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _isLoggedIn = widget.initialIsLoggedIn ?? false;
    _userName = widget.initialUserName;
    _userRole = widget.initialUserRole;

    if (widget.initialIsLoggedIn == null) {
      _checkLoginStatus();
    }
  }

  Future<void> _checkLoginStatus() async {
    final storage = StorageService.instance;
    final loggedIn = await storage.isLoggedIn();
    final name = await storage.getUserName();
    final role = await storage.getUserRole();
    if (mounted) {
      setState(() {
        _isLoggedIn = loggedIn && (name != null);
        _userName = name;
        _userRole = role;
      });
    }
  }

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
      home: _isLoggedIn
          ? IncidentReportScreen(userName: _userName, userRole: _userRole)
          : const WelcomeScreen(),
    );
  }
}
