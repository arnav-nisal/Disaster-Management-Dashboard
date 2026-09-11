/// IncidentReport model matching the exact required schema:
/// {reporter_name, disaster_type, severity_level, latitude, longitude, description, resources_needed}
class IncidentReport {
  final String reporterName;
  final String disasterType;
  final int severityLevel;
  final double latitude;
  final double longitude;
  final String description;
  final List<String> resourcesNeeded;

  const IncidentReport({
    required this.reporterName,
    required this.disasterType,
    required this.severityLevel,
    required this.latitude,
    required this.longitude,
    required this.description,
    required this.resourcesNeeded,
  });

  /// Serializes the IncidentReport instance into the required JSON schema.
  Map<String, dynamic> toJson() {
    return {
      'reporter_name': reporterName,
      'disaster_type': disasterType,
      'severity_level': severityLevel,
      'latitude': latitude,
      'longitude': longitude,
      'description': description,
      'resources_needed': List<String>.from(resourcesNeeded),
    };
  }

  /// Deserializes a JSON map into an IncidentReport instance.
  factory IncidentReport.fromJson(Map<String, dynamic> json) {
    return IncidentReport(
      reporterName: json['reporter_name'] as String? ?? 'Unknown Person',
      disasterType: json['disaster_type'] as String? ?? 'Flood',
      severityLevel: (json['severity_level'] as num?)?.toInt() ?? 1,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] as String? ?? '',
      resourcesNeeded: (json['resources_needed'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          <String>[],
    );
  }

  IncidentReport copyWith({
    String? reporterName,
    String? disasterType,
    int? severityLevel,
    double? latitude,
    double? longitude,
    String? description,
    List<String>? resourcesNeeded,
  }) {
    return IncidentReport(
      reporterName: reporterName ?? this.reporterName,
      disasterType: disasterType ?? this.disasterType,
      severityLevel: severityLevel ?? this.severityLevel,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      description: description ?? this.description,
      resourcesNeeded: resourcesNeeded ?? this.resourcesNeeded,
    );
  }

  @override
  String toString() {
    return 'IncidentReport(reporter_name: $reporterName, disaster_type: $disasterType, severity_level: $severityLevel, lat: $latitude, lng: $longitude, resources_needed: $resourcesNeeded)';
  }
}
