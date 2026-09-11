import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:incident_reporter/main.dart';
import 'package:incident_reporter/welcome_screen.dart';
import 'package:incident_reporter/incident_report_screen.dart';
import 'package:incident_reporter/services/storage_service.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('WelcomeScreen renders title, name input, role selector, and continue button',
      (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(const MyApp());
    // Let entrance animations play out (repeating animations prevent pumpAndSettle)
    await tester.pump(const Duration(milliseconds: 1200));

    expect(find.text('Disaster Relief Portal'), findsOneWidget);
    expect(find.text('Enter your Name'), findsWidgets);
    expect(find.text('Civilian'), findsWidgets);
    expect(find.text('First Responder'), findsWidgets);
    expect(find.text('Continue'), findsOneWidget);
  });

  testWidgets('Empty name defaults to "Unknown Person" and navigates to IncidentReportScreen',
      (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(const MyApp());
    await tester.pump(const Duration(milliseconds: 1200));

    // Don't enter any name — just tap Continue
    final continueButton = find.text('Continue');
    await tester.ensureVisible(continueButton);
    await tester.tap(continueButton);
    // Wait for SharedPreferences save + page transition
    await tester.pump(const Duration(milliseconds: 200));
    await tester.pump(const Duration(milliseconds: 600));
    // Let IncidentReportScreen entrance animations run
    await tester.pump(const Duration(milliseconds: 1000));

    // Should navigate and display "Unknown Person"
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('name'), 'Unknown Person');
    expect(prefs.getString('user_name'), 'Unknown Person');
    expect(prefs.getString('role'), 'Civilian');

    expect(find.byType(IncidentReportScreen), findsOneWidget);
    expect(find.text('Welcome, Unknown Person'), findsOneWidget);
  });

  testWidgets('WelcomeScreen saves entered name and role then navigates',
      (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(const MyApp());
    await tester.pump(const Duration(milliseconds: 1200));

    // Enter name
    await tester.enterText(find.byType(TextField), 'Sarah Connor');
    await tester.pump();

    // Select First Responder role by tapping the toggle
    final responderLabel = find.text('First Responder');
    await tester.ensureVisible(responderLabel);
    await tester.tap(responderLabel);
    await tester.pump(const Duration(milliseconds: 350));

    // Tap Continue
    final continueButton = find.text('Continue');
    await tester.ensureVisible(continueButton);
    await tester.tap(continueButton);
    await tester.pump(const Duration(milliseconds: 200));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pump(const Duration(milliseconds: 1000));

    // Verify SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('name'), 'Sarah Connor');
    expect(prefs.getString('role'), 'First Responder');
    expect(prefs.getString('user_name'), 'Sarah Connor');
    expect(prefs.getString('user_role'), 'First Responder');

    // Verify navigation
    expect(find.byType(IncidentReportScreen), findsOneWidget);
    expect(find.text('Welcome, Sarah Connor'), findsOneWidget);
  });

  testWidgets('IncidentReportScreen renders cleanly with 1.25x system font scaling',
      (tester) async {
    tester.view.devicePixelRatio = 2.8;
    tester.view.physicalSize = const Size(1080, 2400);
    tester.platformDispatcher.textScaleFactorTestValue = 1.25;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });

    await tester.pumpWidget(
      const MaterialApp(
        home: IncidentReportScreen(
          userName: 'Alex Mercer',
          userRole: 'First Responder',
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.text('Welcome, Alex Mercer'), findsOneWidget);
    expect(find.text('Fire / Hazard'), findsOneWidget);
    expect(find.text('Flood / Water'), findsOneWidget);
    expect(find.text('Medical Aid'), findsOneWidget);
    expect(find.text('Safe Shelters'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('WelcomeScreen renders cleanly with 1.25x system font scaling',
      (tester) async {
    tester.view.devicePixelRatio = 2.8;
    tester.view.physicalSize = const Size(1080, 2400);
    tester.platformDispatcher.textScaleFactorTestValue = 1.25;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });

    await tester.pumpWidget(const MyApp());
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.text('Disaster Relief Portal'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('WelcomeScreen has no Scrollable and fits short viewport without overflow',
      (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(360, 640);
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(const MyApp());
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(SingleChildScrollView), findsNothing);
    expect(find.text('Disaster Relief Portal'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('IncidentReportScreen has no top-left back button and only displays logout',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(const MyApp());
    await tester.pump(const Duration(milliseconds: 1200));

    // Enter name and continue
    final nameField = find.byType(TextField);
    await tester.enterText(nameField, 'Jane Doe');
    await tester.pump(const Duration(milliseconds: 200));

    final continueBtn = find.text('Continue');
    await tester.tap(continueBtn);
    await tester.pump(const Duration(milliseconds: 200));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(IncidentReportScreen), findsOneWidget);

    // Verify top-left back button is removed
    expect(find.byTooltip('Back to Login'), findsNothing);
    expect(find.byIcon(Icons.arrow_back_rounded), findsNothing);

    // Verify top-right logout button is present
    expect(find.byTooltip('Logout'), findsOneWidget);
  });

  testWidgets('App restarts directly to IncidentReportScreen when user is logged in',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    // Mock an existing logged-in session
    SharedPreferences.setMockInitialValues({
      'is_logged_in': true,
      'name': 'Captain Miller',
      'role': 'First Responder',
      'user_name': 'Captain Miller',
      'user_role': 'First Responder',
    });

    await tester.pumpWidget(const MyApp());
    // Give time for state initialization
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 600));

    // Should be on IncidentReportScreen directly
    expect(find.byType(IncidentReportScreen), findsOneWidget);
    expect(find.text('Welcome, Captain Miller'), findsOneWidget);
  });

  testWidgets('Top right button logs out user and returns to WelcomeScreen',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    // Mock an active session
    SharedPreferences.setMockInitialValues({
      'is_logged_in': true,
      'name': 'John Reese',
      'role': 'First Responder',
      'user_name': 'John Reese',
      'user_role': 'First Responder',
    });

    await tester.pumpWidget(const MyApp());
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 600));

    expect(find.byType(IncidentReportScreen), findsOneWidget);

    // Tap top-right logout button
    final logoutBtn = find.byTooltip('Logout');
    expect(logoutBtn, findsOneWidget);
    await tester.tap(logoutBtn);
    await tester.pump(const Duration(milliseconds: 200));
    await tester.pump(const Duration(milliseconds: 600));

    // Should now be on WelcomeScreen
    expect(find.byType(WelcomeScreen), findsOneWidget);

    // is_logged_in should now be false, but name is preserved for auto-fill
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool('is_logged_in'), isFalse);
    expect(prefs.getString('name'), 'John Reese');
  });

  test('StorageService persists user, logs incident, and counts properly', () async {
    final storage = StorageService.instance;
    await storage.saveUser(name: 'Marcus Brody', role: 'Civilian');

    expect(await storage.isLoggedIn(), isTrue);
    expect(await storage.getUserName(), 'Marcus Brody');
    expect(await storage.getUserRole(), 'Civilian');

    await storage.logIncident(
      category: 'Fire / Hazard',
      description: 'Blaze reported downtown',
    );
    expect(await storage.getIncidentCount(), 1);

    await storage.logout();
    expect(await storage.isLoggedIn(), isFalse);
    expect(await storage.getUserName(), 'Marcus Brody');
  });

  testWidgets('Tapping emergency category tile logs incident and shows feedback SnackBar',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(
      const MaterialApp(
        home: IncidentReportScreen(
          userName: 'Elena Fisher',
          userRole: 'First Responder',
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 1000));

    final fireTile = find.text('Fire / Hazard');
    expect(fireTile, findsOneWidget);
    await tester.tap(fireTile);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Selected: Fire / Hazard'), findsOneWidget);
    final storage = StorageService.instance;
    expect(await storage.getIncidentCount(), 1);
  });
}

