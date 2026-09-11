import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:incident_reporter/main.dart';
import 'package:incident_reporter/incident_report_screen.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('WelcomeScreen renders all required fields', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(const MyApp());

    // Title / branding
    expect(find.text('Disaster Relief Portal'), findsOneWidget);

    // Text input for "Enter your Name"
    expect(find.text('Enter your Name'), findsWidgets);

    // Role dropdown with "Civilian" default
    expect(find.text('Role'), findsOneWidget);
    expect(find.text('Civilian'), findsWidgets);

    // Prominent Continue button
    expect(find.text('Continue'), findsOneWidget);
  });

  testWidgets('WelcomeScreen validates empty name and shows error', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(const MyApp());

    // Tap Continue without entering name
    final continueButton = find.text('Continue');
    await tester.ensureVisible(continueButton);
    await tester.tap(continueButton);
    await tester.pump();

    // Verify validation error
    expect(find.text('Please enter your name'), findsOneWidget);
  });

  testWidgets('WelcomeScreen saves user details and navigates to IncidentReportScreen',
      (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(const MyApp());

    // Enter name
    await tester.enterText(find.byType(TextFormField), 'Sarah Connor');
    await tester.pump();

    // Select role
    final dropdown = find.byType(DropdownButtonFormField<String>);
    await tester.ensureVisible(dropdown);
    await tester.tap(dropdown);
    await tester.pumpAndSettle();

    await tester.tap(find.text('First Responder').last);
    await tester.pumpAndSettle();

    // Tap Continue
    final continueButton = find.text('Continue');
    await tester.ensureVisible(continueButton);
    await tester.tap(continueButton);
    await tester.pumpAndSettle();

    // Verify SharedPreferences has values saved
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('name'), 'Sarah Connor');
    expect(prefs.getString('role'), 'First Responder');
    expect(prefs.getString('user_name'), 'Sarah Connor');
    expect(prefs.getString('user_role'), 'First Responder');

    // Verify navigated to IncidentReportScreen
    expect(find.byType(IncidentReportScreen), findsOneWidget);
    expect(find.text('Welcome, Sarah Connor'), findsOneWidget);
  });
}
