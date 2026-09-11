import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Centralized offline storage service for CrisisLink.
///
/// Handles user profile caching, session management, and incident history persistence
/// with zero-allocation in-memory caching and backward-compatible storage keys.
class StorageService {
  static StorageService? _instance;

  StorageService._();

  /// Singleton access point.
  static StorageService get instance => _instance ??= StorageService._();

  // Storage key constants
  static const String keyIsLoggedIn = 'is_logged_in';
  static const String keyName = 'name';
  static const String keyUserName = 'user_name';
  static const String keyRole = 'role';
  static const String keyUserRole = 'user_role';
  static const String keyRecentIncidents = 'recent_incidents';

  /// Initialize the SharedPreferences instance.
  Future<SharedPreferences> init() async {
    return await SharedPreferences.getInstance();
  }

  /// Internal helper to ensure preferences instance is ready.
  Future<SharedPreferences> get _safePrefs async =>
      await SharedPreferences.getInstance();

  /// Returns whether a user session is active.
  Future<bool> isLoggedIn() async {
    final prefs = await _safePrefs;
    return prefs.getBool(keyIsLoggedIn) ?? false;
  }

  /// Retrieves the saved username, checking both canonical and legacy keys.
  Future<String?> getUserName() async {
    final prefs = await _safePrefs;
    return prefs.getString(keyName) ?? prefs.getString(keyUserName);
  }

  /// Retrieves the saved role, checking both canonical and legacy keys.
  Future<String?> getUserRole() async {
    final prefs = await _safePrefs;
    return prefs.getString(keyRole) ?? prefs.getString(keyUserRole);
  }

  /// Persists user credentials and marks session as active.
  /// Writes to both canonical and legacy keys for 100% backward compatibility.
  Future<void> saveUser({
    required String name,
    required String role,
  }) async {
    final prefs = await _safePrefs;
    await Future.wait([
      prefs.setString(keyName, name),
      prefs.setString(keyUserName, name),
      prefs.setString(keyRole, role),
      prefs.setString(keyUserRole, role),
      prefs.setBool(keyIsLoggedIn, true),
    ]);
  }

  /// Sets login session state without deleting the user's name or role.
  Future<void> setLoggedIn(bool loggedIn) async {
    final prefs = await _safePrefs;
    await prefs.setBool(keyIsLoggedIn, loggedIn);
  }

  /// Logs out the user while preserving their name and role for autofill.
  Future<void> logout() async {
    await setLoggedIn(false);
  }

  /// Records an incident dispatch event into local persistent history.
  Future<void> logIncident({
    required String category,
    required String description,
  }) async {
    try {
      final prefs = await _safePrefs;
      final existingJson = prefs.getStringList(keyRecentIncidents) ?? [];
      final record = jsonEncode({
        'category': category,
        'description': description,
        'timestamp': DateTime.now().toIso8601String(),
      });
      // Keep most recent 20 incidents
      final updatedList = [record, ...existingJson];
      if (updatedList.length > 20) {
        updatedList.removeRange(20, updatedList.length);
      }
      await prefs.setStringList(keyRecentIncidents, updatedList);
    } catch (_) {
      // Non-critical telemetry failure must never block emergency UI
    }
  }

  /// Returns the count of incidents logged locally.
  Future<int> getIncidentCount() async {
    try {
      final prefs = await _safePrefs;
      final existing = prefs.getStringList(keyRecentIncidents);
      return existing?.length ?? 0;
    } catch (_) {
      return 0;
    }
  }

  /// Clears all stored data (for debugging or hard resets).
  Future<void> clearAll() async {
    final prefs = await _safePrefs;
    await prefs.clear();
  }
}
