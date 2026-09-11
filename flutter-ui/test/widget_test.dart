import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:incident_reporter/main.dart';
import 'package:incident_reporter/welcome_screen.dart';
import 'package:incident_reporter/incident_report_screen.dart';
import 'package:incident_reporter/services/storage_service.dart';
import 'package:incident_reporter/models/incident_report.dart';
import 'package:incident_reporter/services/incident_api_service.dart';
import 'package:incident_reporter/services/location_service.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

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
    expect(find.text('DISASTER TYPE'), findsOneWidget);
    expect(find.text('Flood'), findsOneWidget);
    expect(find.text('Get Current Location'), findsOneWidget);
    expect(find.text('RESOURCES NEEDED'), findsOneWidget);
    expect(find.text('Submit'), findsOneWidget);
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

  test('IncidentReport model matches required JSON schema', () {
    const report = IncidentReport(
      reporterName: 'John Doe',
      disasterType: 'Fire',
      severityLevel: 4,
      latitude: 12.9716,
      longitude: 77.5946,
      description: 'Massive fire spreading rapidly',
      resourcesNeeded: ['Medical', 'Rescue'],
    );

    final json = report.toJson();
    expect(json['reporter_name'], 'John Doe');
    expect(json['disaster_type'], 'Fire');
    expect(json['severity_level'], 4);
    expect(json['latitude'], 12.9716);
    expect(json['longitude'], 77.5946);
    expect(json['description'], 'Massive fire spreading rapidly');
    expect(json['resources_needed'], ['Medical', 'Rescue']);

    final fromJson = IncidentReport.fromJson(json);
    expect(fromJson.reporterName, report.reporterName);
    expect(fromJson.disasterType, report.disasterType);
    expect(fromJson.severityLevel, report.severityLevel);
    expect(fromJson.latitude, report.latitude);
    expect(fromJson.longitude, report.longitude);
    expect(fromJson.description, report.description);
    expect(fromJson.resourcesNeeded, report.resourcesNeeded);
  });

  testWidgets('IncidentReportScreen handles form input, mock location, and submission',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    final mockClient = MockClient((request) async {
      expect(request.url.toString(), 'https://my-render-api.com/api/incident');
      expect(request.method, 'POST');
      return http.Response('{"success": true}', 200);
    });
    final mockLocClient = MockClient((request) async {
      return http.Response(
        '{"success": true, "latitude": 12.9716, "longitude": 77.5946, "city": "Bengaluru"}',
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final mockLocService = LocationService(client: mockLocClient);
    final mockApi = IncidentApiService(client: mockClient);

    await tester.pumpWidget(
      MaterialApp(
        home: IncidentReportScreen(
          userName: 'Elena Fisher',
          userRole: 'First Responder',
          apiService: mockApi,
          locationService: mockLocService,
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 800));

    // Tap Get Current Location
    final locationBtn = find.text('Get Current Location');
    await tester.ensureVisible(locationBtn);
    await tester.tap(locationBtn);
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.textContaining('Lat: 12.9716'), findsOneWidget);

    // Enter description (second TextField on screen)
    final textFields = find.byType(TextField);
    expect(textFields, findsNWidgets(2));
    await tester.enterText(
        textFields.at(1), 'Trapped civilians need immediate evacuation.');
    await tester.pump();

    // Toggle resource checkbox (Rescue)
    final rescueTile = find.text('Rescue');
    await tester.ensureVisible(rescueTile);
    await tester.tap(rescueTile);
    await tester.pump();

    // Submit report
    final submitBtn = find.text('Submit');
    await tester.ensureVisible(submitBtn);
    await tester.tap(submitBtn);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // Verify incident logged in StorageService
    final storage = StorageService.instance;
    expect(await storage.getIncidentCount(), 1);
  });

  testWidgets('Urgent (Unknown) button sets reporter name to Unknown Person',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: IncidentReportScreen(
          userName: 'Some Civilian',
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 800));

    final urgentBtn = find.text('Urgent (Unknown)');
    await tester.tap(urgentBtn);
    await tester.pump();

    expect(find.text('Unknown Person'), findsWidgets);
  });

  test('LocationService resolves live coordinates from primary endpoint',
      () async {
    final mockClient = MockClient((request) async {
      return http.Response(
        '''
        {
          "success": true,
          "latitude": 18.5204,
          "longitude": 73.8567,
          "city": "Pune",
          "region": "Maharashtra",
          "country": "India"
        }
        ''',
        200,
        headers: {'content-type': 'application/json'},
      );
    });

    final service = LocationService(client: mockClient);
    final loc = await service.getCurrentLocation();

    expect(loc.isLive, isTrue);
    expect(loc.latitude, closeTo(18.5204, 0.001));
    expect(loc.longitude, closeTo(73.8567, 0.001));
    expect(loc.city, 'Pune');
    expect(loc.readableAddress, 'Pune, Maharashtra, India');
  });

  test('LocationService returns emergency fallback on network error',
      () async {
    final mockClient = MockClient((request) async {
      throw http.ClientException('Network unreachable');
    });

    final service = LocationService(client: mockClient);
    final loc = await service.getCurrentLocation();

    expect(loc.isLive, isFalse);
    expect(loc.latitude, 12.9716);
    expect(loc.longitude, 77.5946);
  });

  testWidgets('Custom coordinates modal allows user to enter custom location',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: IncidentReportScreen(
          userName: 'Field Agent',
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 800));

    // Tap Custom button
    final customBtn = find.text('Custom');
    await tester.ensureVisible(customBtn);
    await tester.tap(customBtn);
    await tester.pumpAndSettle();

    // Verify dialog opened
    expect(find.text('Custom Coordinates'), findsOneWidget);

    // Enter Lat and Lng in dialog
    final dialogFields = find.descendant(
      of: find.byType(AlertDialog),
      matching: find.byType(TextField),
    );
    expect(dialogFields, findsNWidgets(2));
    await tester.enterText(dialogFields.first, '19.0760');
    await tester.enterText(dialogFields.at(1), '72.8777');
    await tester.pump();

    // Tap Set Location
    final setBtn = find.text('Set Location');
    await tester.tap(setBtn);
    await tester.pumpAndSettle();

    // Verify coordinates updated on screen
    expect(find.textContaining('19.0760'), findsOneWidget);
    expect(find.textContaining('72.8777'), findsOneWidget);
    expect(find.text('CUSTOM'), findsOneWidget);
  });

  testWidgets('Location SnackBar does not overflow with 1.25x font scale',
      (tester) async {
    tester.view.physicalSize = const Size(360, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    final mockLocClient = MockClient((request) async {
      return http.Response(
        '{"success": true, "latitude": 12.9716, "longitude": 77.5946, "city": "Bengaluru"}',
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final mockLocService = LocationService(client: mockLocClient);

    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(
            size: Size(360, 640),
            textScaler: TextScaler.linear(1.25),
          ),
          child: IncidentReportScreen(
            userName: 'Scale Test',
            locationService: mockLocService,
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 800));

    final locationBtn = find.text('Get Current Location');
    await tester.ensureVisible(locationBtn);
    await tester.tap(locationBtn);
    await tester.pump(const Duration(milliseconds: 400));

    // Verify no RenderFlex overflow exception was thrown
    expect(tester.takeException(), isNull);
  });

  test('LocationService pre-warms cache and returns fresh cached coordinates',
      () async {
    final mockClient = MockClient((request) async {
      return http.Response(
        '''
        {
          "success": true,
          "latitude": 18.5204,
          "longitude": 73.8567,
          "city": "Pune",
          "region": "Maharashtra",
          "country": "India"
        }
        ''',
        200,
        headers: {'content-type': 'application/json'},
      );
    });

    final service = LocationService(client: mockClient, enableGps: false);
    expect(service.cachedLocation, isNull);

    // Initial fetch
    final loc1 = await service.getCurrentLocation();
    expect(loc1.latitude, closeTo(18.5204, 0.001));

    // Cached fetch
    final cached = service.cachedLocation;
    expect(cached, isNotNull);
    expect(cached!.city, 'Pune');

    // Subsequent call uses cache
    final loc2 = await service.getCurrentLocation();
    expect(identical(loc1, loc2), isTrue);

    // Startup permission request completes safely
    final permission = await service.requestStartupPermission();
    expect(permission, isNotNull);
  });
}


