import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/incident_report.dart';

/// Result object for incident submission API responses.
class IncidentSubmissionResult {
  final bool isSuccess;
  final int statusCode;
  final String message;

  const IncidentSubmissionResult({
    required this.isSuccess,
    required this.statusCode,
    required this.message,
  });
}

/// Service handling API interactions for Incident Reports.
class IncidentApiService {
  static const String endpointUrl = 'http://127.0.0.1:8000/api/incidents';

  final http.Client _client;

  IncidentApiService({http.Client? client}) : _client = client ?? http.Client();

  /// Submits an [IncidentReport] to the backend API via HTTP POST.
  Future<IncidentSubmissionResult> submitIncident(IncidentReport report) async {
    final uri = Uri.parse(endpointUrl);
    final payload = jsonEncode(report.toJson());

    try {
      final response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              'Accept': 'application/json',
            },
            body: payload,
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return IncidentSubmissionResult(
          isSuccess: true,
          statusCode: response.statusCode,
          message: 'Incident reported successfully to emergency dispatch.',
        );
      } else {
        return IncidentSubmissionResult(
          isSuccess: false,
          statusCode: response.statusCode,
          message:
              'Server returned error code: ${response.statusCode}. Please retry.',
        );
      }
    } catch (e) {
      return IncidentSubmissionResult(
        isSuccess: false,
        statusCode: 0,
        message: 'Network request failed: ${e.toString()}',
      );
    }
  }
}
