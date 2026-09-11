import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

/// Identifies the provenance of geographical coordinates.
enum LocationSource {
  gps,
  ip,
  manual,
  fallback,
}

/// Data class representing resolved geographical coordinates and contextual metadata.
class LocationInfo {
  final double latitude;
  final double longitude;
  final String? city;
  final String? region;
  final String? country;
  final LocationSource source;
  final bool isLive;

  const LocationInfo({
    required this.latitude,
    required this.longitude,
    this.city,
    this.region,
    this.country,
    this.source = LocationSource.gps,
    this.isLive = true,
  });

  /// Human-friendly place summary e.g. "Pune, Maharashtra, India".
  String get readableAddress {
    final parts = [city, region, country]
        .where((p) => p != null && p.trim().isNotEmpty)
        .toList();
    if (parts.isNotEmpty) return parts.join(', ');
    return 'Lat: ${latitude.toStringAsFixed(4)}, Long: ${longitude.toStringAsFixed(4)}';
  }

  /// Compact tag label for dashboard badges.
  String get sourceBadge {
    switch (source) {
      case LocationSource.gps:
        return 'LIVE GPS';
      case LocationSource.ip:
        return 'IP NETWORK';
      case LocationSource.manual:
        return 'CUSTOM';
      case LocationSource.fallback:
        return 'DISPATCH FALLBACK';
    }
  }

  @override
  String toString() =>
      'LocationInfo(lat: $latitude, lng: $longitude, address: $readableAddress, source: $source, isLive: $isLive)';
}

/// Service that acquires accurate geographical location for disaster dispatch.
/// Prioritizes native device GPS with graceful failovers to HTTPS IP Geolocation and offline defaults.
class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService({http.Client? client, bool? enableGps}) {
    final useGps = enableGps ?? (client == null);
    if (client != null || !useGps) {
      return LocationService._internal(client: client, enableGps: useGps);
    }
    return _instance;
  }

  final http.Client _client;
  final bool _enableGps;

  LocationInfo? _cachedLocation;
  DateTime? _lastFetchTime;

  LocationService._internal({http.Client? client, this._enableGps = true})
      : _client = client ?? http.Client();

  /// Returns cached location if fresh (less than 2 minutes old).
  LocationInfo? get cachedLocation {
    if (_cachedLocation != null && _lastFetchTime != null) {
      final difference = DateTime.now().difference(_lastFetchTime!);
      if (difference.inMinutes < 2) {
        return _cachedLocation;
      }
    }
    return _cachedLocation;
  }

  /// Requests location permissions early at app startup to optimize readiness.
  /// Non-blocking and never throws exceptions.
  Future<LocationPermission> requestStartupPermission() async {
    if (!_enableGps) return LocationPermission.unableToDetermine;
    try {
      final isEnabled = await Geolocator.isLocationServiceEnabled();
      if (!isEnabled) return LocationPermission.denied;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      // If granted, asynchronously warm up the location cache
      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        unawaited(getCurrentLocation());
      }

      return permission;
    } catch (e) {
      debugPrint('[LocationService] Startup permission check skipped: $e');
      return LocationPermission.unableToDetermine;
    }
  }

  /// Resolves the user's current live coordinates:
  /// 1. Native Device GPS via Geolocator
  /// 2. Primary HTTPS IP Geolocation (ipwho.is)
  /// 3. Secondary HTTP IP Geolocation (ip-api.com)
  /// 4. Resilient emergency default coordinates
  Future<LocationInfo> getCurrentLocation({bool forceRefresh = false}) async {
    if (!forceRefresh && cachedLocation != null) {
      return cachedLocation!;
    }

    // ── 1. Attempt Native Device GPS ──
    if (_enableGps) {
      try {
        final isEnabled = await Geolocator.isLocationServiceEnabled();
        if (isEnabled) {
          LocationPermission permission = await Geolocator.checkPermission();
          if (permission == LocationPermission.denied) {
            permission = await Geolocator.requestPermission();
          }

          if (permission == LocationPermission.whileInUse ||
              permission == LocationPermission.always) {
            final position = await Geolocator.getCurrentPosition(
              locationSettings: const LocationSettings(
                accuracy: LocationAccuracy.high,
                timeLimit: Duration(seconds: 4),
              ),
            );

            final result = LocationInfo(
              latitude: position.latitude,
              longitude: position.longitude,
              city: null,
              region: null,
              country: null,
              source: LocationSource.gps,
              isLive: true,
            );

            _cachedLocation = result;
            _lastFetchTime = DateTime.now();
            return result;
          }
        }
      } catch (e) {
        debugPrint(
            '[LocationService] Native GPS unavailable ($e), attempting IP fallback.');
      }
    }

    // ── 2. Primary HTTPS IP Geolocation: https://ipwho.is/ ──
    try {
      final response = await _client
          .get(Uri.parse('https://ipwho.is/'))
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true &&
            data['latitude'] != null &&
            data['longitude'] != null) {
          final result = LocationInfo(
            latitude: (data['latitude'] as num).toDouble(),
            longitude: (data['longitude'] as num).toDouble(),
            city: data['city'] as String?,
            region: data['region'] as String?,
            country: data['country'] as String?,
            source: LocationSource.ip,
            isLive: true,
          );

          _cachedLocation = result;
          _lastFetchTime = DateTime.now();
          return result;
        }
      }
    } catch (_) {
      // Proceed to secondary IP fallback
    }

    // ── 3. Secondary HTTP IP Geolocation: http://ip-api.com/json ──
    try {
      final response = await _client
          .get(Uri.parse('http://ip-api.com/json'))
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success' &&
            data['lat'] != null &&
            data['lon'] != null) {
          final result = LocationInfo(
            latitude: (data['lat'] as num).toDouble(),
            longitude: (data['lon'] as num).toDouble(),
            city: data['city'] as String?,
            region: data['regionName'] as String?,
            country: data['country'] as String?,
            source: LocationSource.ip,
            isLive: true,
          );

          _cachedLocation = result;
          _lastFetchTime = DateTime.now();
          return result;
        }
      }
    } catch (_) {
      // Proceed to offline fallback
    }

    // ── 4. Fallback Emergency Dispatch Coordinates ──
    final fallback = const LocationInfo(
      latitude: 12.9716,
      longitude: 77.5946,
      city: 'Field Headquarters',
      region: 'Incident Control',
      country: 'India',
      source: LocationSource.fallback,
      isLive: false,
    );

    _cachedLocation = fallback;
    _lastFetchTime = DateTime.now();
    return fallback;
  }

  /// Clears in-memory location cache.
  void clearCache() {
    _cachedLocation = null;
    _lastFetchTime = null;
  }
}
