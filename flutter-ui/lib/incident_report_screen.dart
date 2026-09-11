import 'package:flutter/material.dart';
import 'welcome_screen.dart';
import 'services/storage_service.dart';
import 'services/incident_api_service.dart';
import 'services/location_service.dart';
import 'models/incident_report.dart';

class IncidentReportScreen extends StatefulWidget {
  final String? userName;
  final String? userRole;
  final IncidentApiService? apiService;
  final LocationService? locationService;

  const IncidentReportScreen({
    super.key,
    this.userName,
    this.userRole,
    this.apiService,
    this.locationService,
  });

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen>
    with SingleTickerProviderStateMixin {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final IncidentApiService _apiService;
  late final LocationService _locationService;

  String _role = 'Civilian';
  bool _isLoading = true;
  bool _isSubmitting = false;

  // Form State
  String _selectedDisasterType = 'Flood';
  static const List<String> _disasterTypes = [
    'Flood',
    'Fire',
    'Earthquake',
    'Medical',
  ];

  double _severityLevel = 3.0;

  double? _latitude;
  double? _longitude;
  String? _locationAddress;
  LocationSource _locationSource = LocationSource.gps;
  bool _isFetchingLocation = false;

  final Set<String> _selectedResources = {'Medical'};
  static const List<String> _resourceOptions = [
    'Medical',
    'Food',
    'Rescue',
    'Water',
  ];

  late final AnimationController _entranceController;
  late final Animation<Offset> _bannerSlide;
  late final Animation<double> _bannerFade;
  late final Animation<Offset> _formSlide;
  late final Animation<double> _formFade;

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? IncidentApiService();
    _locationService = widget.locationService ?? LocationService();
    _nameController = TextEditingController();
    _descriptionController = TextEditingController();

    // Check if location was pre-warmed at startup
    final prewarmed = _locationService.cachedLocation;
    if (prewarmed != null) {
      _latitude = prewarmed.latitude;
      _longitude = prewarmed.longitude;
      _locationAddress = prewarmed.readableAddress;
      _locationSource = prewarmed.source;
    }

    _entranceController = AnimationController(
      duration: const Duration(milliseconds: 700),
      vsync: this,
    );

    _bannerSlide = Tween<Offset>(
      begin: const Offset(0, -0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic),
    ));
    _bannerFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
    ));

    _formSlide = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic),
    ));
    _formFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.2, 0.8, curve: Curves.easeOut),
    ));

    _loadUserData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _entranceController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    if (widget.userName != null && widget.userRole != null) {
      setState(() {
        _nameController.text = widget.userName!;
        _role = widget.userRole!;
        _isLoading = false;
      });
      _entranceController.forward();
      return;
    }

    final storage = StorageService.instance;
    final savedName = await storage.getUserName() ?? 'Unknown Person';
    final savedRole = await storage.getUserRole() ?? 'Civilian';
    if (!mounted) return;
    setState(() {
      _nameController.text = savedName;
      _role = savedRole;
      _isLoading = false;
    });
    _entranceController.forward();
  }

  Future<void> _handleLogout() async {
    final storage = StorageService.instance;
    await storage.logout();

    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 400),
        pageBuilder: (context, animation, secondaryAnimation) =>
            const WelcomeScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
      (route) => false,
    );
  }

  Future<void> _handleGetCurrentLocation() async {
    setState(() => _isFetchingLocation = true);
    try {
      final loc = await _locationService.getCurrentLocation(forceRefresh: true);
      if (!mounted) return;
      setState(() {
        _latitude = loc.latitude;
        _longitude = loc.longitude;
        _locationAddress = loc.readableAddress;
        _locationSource = loc.source;
        _isFetchingLocation = false;
      });

      final locationMsg = loc.source == LocationSource.gps
          ? 'GPS Locked: ${loc.latitude.toStringAsFixed(4)}, ${loc.longitude.toStringAsFixed(4)}'
          : (loc.city != null
              ? 'Location detected: ${loc.city}, ${loc.region} (${loc.latitude.toStringAsFixed(4)}, ${loc.longitude.toStringAsFixed(4)})'
              : 'GPS Coordinates acquired: ${loc.latitude.toStringAsFixed(4)}, ${loc.longitude.toStringAsFixed(4)}');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(
                loc.source == LocationSource.gps
                    ? Icons.gps_fixed_rounded
                    : Icons.check_circle_rounded,
                color: const Color(0xFF22C55E),
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  locationMsg,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF131B2E),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 3),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isFetchingLocation = false;
        _latitude = _latitude ?? 12.9716;
        _longitude = _longitude ?? 77.5946;
        _locationAddress = 'Default dispatch coordinates';
        _locationSource = LocationSource.fallback;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.info_outline_rounded,
                  color: Color(0xFF60A5FA), size: 18),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'GPS signal unavailable. Applied default dispatch coordinates.',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          backgroundColor: Color(0xFF1E293B),
          behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _showEditLocationDialog() {
    final latCtrl = TextEditingController(
      text: _latitude != null ? _latitude!.toStringAsFixed(4) : '',
    );
    final lngCtrl = TextEditingController(
      text: _longitude != null ? _longitude!.toStringAsFixed(4) : '',
    );

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF131B2E),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFF1E293B)),
          ),
          title: const Row(
            children: [
              Icon(Icons.edit_location_alt_rounded,
                  color: Color(0xFF60A5FA), size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Custom Coordinates',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter precise coordinates for the emergency site:',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: latCtrl,
                keyboardType: const TextInputType.numberWithOptions(
                    decimal: true, signed: true),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Latitude (-90 to 90)',
                  labelStyle:
                      const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: lngCtrl,
                keyboardType: const TextInputType.numberWithOptions(
                    decimal: true, signed: true),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Longitude (-180 to 180)',
                  labelStyle:
                      const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                  filled: true,
                  fillColor: const Color(0xFF0F172A),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF1E293B)),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel',
                  style: TextStyle(color: Color(0xFF64748B))),
            ),
            ElevatedButton(
              onPressed: () {
                final lat = double.tryParse(latCtrl.text.trim());
                final lng = double.tryParse(lngCtrl.text.trim());
                if (lat != null &&
                    lng != null &&
                    lat >= -90 &&
                    lat <= 90 &&
                    lng >= -180 &&
                    lng <= 180) {
                  setState(() {
                    _latitude = lat;
                    _longitude = lng;
                    _locationAddress = 'Custom coordinates entered';
                    _locationSource = LocationSource.manual;
                  });
                  Navigator.of(ctx).pop();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter valid numeric coordinates.'),
                      backgroundColor: Color(0xFF991B1B),
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Set Location'),
            ),
          ],
        );
      },
    );
  }

  void _setUnknownPerson() {
    setState(() {
      _nameController.text = 'Unknown Person';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.info_outline_rounded,
                color: Color(0xFF60A5FA), size: 18),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Reporter set to "Unknown Person" for fast dispatch.',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: Color(0xFF1E293B),
        behavior: SnackBarBehavior.floating,
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    final rawName = _nameController.text.trim();
    final reporterName = rawName.isEmpty ? 'Unknown Person' : rawName;
    final description = _descriptionController.text.trim();

    if (description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.error_outline_rounded,
                  color: Color(0xFFFCA5A5), size: 18),
              SizedBox(width: 8),
              Expanded(
                child: Text('Please provide a brief description of the incident.'),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF991B1B),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    final lat = _latitude ?? 12.9716;
    final lng = _longitude ?? 77.5946;

    final report = IncidentReport(
      reporterName: reporterName,
      disasterType: _selectedDisasterType,
      severityLevel: _severityLevel.toInt(),
      latitude: lat,
      longitude: lng,
      description: description,
      resourcesNeeded: _selectedResources.toList(),
    );

    setState(() => _isSubmitting = true);

    try {
      final result = await _apiService.submitIncident(report);

      // Resilient local caching via StorageService
      await StorageService.instance.logIncident(
        category: report.disasterType,
        description: report.description,
      );

      if (!mounted) return;

      if (result.isSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded,
                    color: Color(0xFF22C55E), size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(result.message)),
              ],
            ),
            backgroundColor: const Color(0xFF131B2E),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            duration: const Duration(seconds: 3),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.warning_amber_rounded,
                    color: Color(0xFFEF4444), size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(result.message)),
              ],
            ),
            backgroundColor: const Color(0xFF2A0D0D),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: const Color(0xFF991B1B),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Color _getSeverityColor(int level) {
    switch (level) {
      case 1:
        return const Color(0xFF22C55E);
      case 2:
        return const Color(0xFF38BDF8);
      case 3:
        return const Color(0xFFFBBF24);
      case 4:
        return const Color(0xFFFB923C);
      case 5:
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFFEF4444);
    }
  }

  String _getSeverityLabel(int level) {
    switch (level) {
      case 1:
        return '1 - Minor / Advisory';
      case 2:
        return '2 - Moderate Hazard';
      case 3:
        return '3 - Significant Threat';
      case 4:
        return '4 - Severe Danger';
      case 5:
        return '5 - Critical / Catastrophic';
      default:
        return 'Level $level';
    }
  }

  IconData _getDisasterIcon(String type) {
    switch (type) {
      case 'Flood':
        return Icons.water_drop_rounded;
      case 'Fire':
        return Icons.local_fire_department_rounded;
      case 'Earthquake':
        return Icons.vibration_rounded;
      case 'Medical':
        return Icons.medical_services_rounded;
      default:
        return Icons.warning_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFirstResponder = _role == 'First Responder';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.emergency_rounded,
                  color: Color(0xFFEF4444), size: 18),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Incident Report Form',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  fontSize: 18,
                ),
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: IconButton(
              tooltip: 'Logout',
              icon: const Icon(Icons.logout_rounded,
                  color: Color(0xFF94A3B8), size: 19),
              onPressed: _handleLogout,
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFEF4444)),
                strokeWidth: 2.5,
              ),
            )
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Welcome Banner ──
                    SlideTransition(
                      position: _bannerSlide,
                      child: FadeTransition(
                        opacity: _bannerFade,
                        child: _buildWelcomeBanner(isFirstResponder),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Scrollable Incident Form Card ──
                    SlideTransition(
                      position: _formSlide,
                      child: FadeTransition(
                        opacity: _formFade,
                        child: Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: const Color(0xFF131B2E),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFF1E293B)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.3),
                                blurRadius: 20,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // ── Reporter Name & Urgent Button ──
                              Wrap(
                                alignment: WrapAlignment.spaceBetween,
                                crossAxisAlignment:
                                    WrapCrossAlignment.center,
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  const Text(
                                    'REPORTER NAME',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF64748B),
                                      letterSpacing: 1.1,
                                    ),
                                  ),
                                  TextButton.icon(
                                    onPressed: _setUnknownPerson,
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    icon: const Icon(Icons.flash_on_rounded,
                                        size: 13, color: Color(0xFFEF4444)),
                                    label: const Text(
                                      'Urgent (Unknown)',
                                      style: TextStyle(
                                        color: Color(0xFFEF4444),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              TextField(
                                controller: _nameController,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 14),
                                decoration: InputDecoration(
                                  hintText: 'Enter reporter name',
                                  hintStyle: const TextStyle(
                                      color: Color(0xFF475569)),
                                  filled: true,
                                  fillColor: const Color(0xFF0F172A),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 12),
                                  prefixIcon: const Icon(
                                      Icons.person_outline_rounded,
                                      color: Color(0xFF64748B),
                                      size: 18),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                        color: Color(0xFF1E293B)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                        color: Color(0xFFEF4444), width: 1.5),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 18),

                              // ── Disaster Type Dropdown ──
                              const Text(
                                'DISASTER TYPE',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF64748B),
                                  letterSpacing: 1.1,
                                ),
                              ),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                initialValue: _selectedDisasterType,
                                dropdownColor: const Color(0xFF131B2E),
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 14),
                                icon: const Icon(Icons.arrow_drop_down_rounded,
                                    color: Color(0xFF94A3B8)),
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: const Color(0xFF0F172A),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 12),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                        color: Color(0xFF1E293B)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                        color: Color(0xFFEF4444), width: 1.5),
                                  ),
                                ),
                                items: _disasterTypes.map((type) {
                                  return DropdownMenuItem<String>(
                                    value: type,
                                    child: Row(
                                      children: [
                                        Icon(_getDisasterIcon(type),
                                            size: 18,
                                            color: const Color(0xFFEF4444)),
                                        const SizedBox(width: 10),
                                        Text(type),
                                      ],
                                    ),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() => _selectedDisasterType = val);
                                  }
                                },
                              ),
                              const SizedBox(height: 18),

                              // ── Severity Level Slider ──
                              Wrap(
                                alignment: WrapAlignment.spaceBetween,
                                crossAxisAlignment:
                                    WrapCrossAlignment.center,
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  const Text(
                                    'SEVERITY LEVEL (1 - 5)',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF64748B),
                                      letterSpacing: 1.1,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: _getSeverityColor(
                                              _severityLevel.toInt())
                                          .withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: _getSeverityColor(
                                                _severityLevel.toInt())
                                            .withValues(alpha: 0.5),
                                      ),
                                    ),
                                    child: Text(
                                      _getSeverityLabel(_severityLevel.toInt()),
                                      style: TextStyle(
                                        color: _getSeverityColor(
                                            _severityLevel.toInt()),
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              SliderTheme(
                                data: SliderTheme.of(context).copyWith(
                                  activeTrackColor: _getSeverityColor(
                                      _severityLevel.toInt()),
                                  inactiveTrackColor: const Color(0xFF1E293B),
                                  thumbColor: _getSeverityColor(
                                      _severityLevel.toInt()),
                                  overlayColor: _getSeverityColor(
                                          _severityLevel.toInt())
                                      .withValues(alpha: 0.2),
                                  trackHeight: 4,
                                ),
                                child: Slider(
                                  value: _severityLevel,
                                  min: 1.0,
                                  max: 5.0,
                                  divisions: 4,
                                  label: _severityLevel.toInt().toString(),
                                  onChanged: (val) {
                                    setState(() => _severityLevel = val);
                                  },
                                ),
                              ),
                              const SizedBox(height: 12),

                              // ── Location Selector ──
                              Wrap(
                                alignment: WrapAlignment.spaceBetween,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  const Text(
                                    'INCIDENT LOCATION',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF64748B),
                                      letterSpacing: 1.1,
                                    ),
                                  ),
                                  if (_latitude != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: (_locationSource ==
                                                    LocationSource.gps
                                                ? const Color(0xFF22C55E)
                                                : (_locationSource ==
                                                        LocationSource.manual
                                                    ? const Color(0xFFFBBF24)
                                                    : const Color(0xFF60A5FA)))
                                            .withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(
                                          color: (_locationSource ==
                                                      LocationSource.gps
                                                  ? const Color(0xFF22C55E)
                                                  : (_locationSource ==
                                                          LocationSource.manual
                                                      ? const Color(0xFFFBBF24)
                                                      : const Color(
                                                          0xFF60A5FA)))
                                              .withValues(alpha: 0.4),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            _locationSource ==
                                                    LocationSource.gps
                                                ? Icons.gps_fixed_rounded
                                                : (_locationSource ==
                                                        LocationSource.manual
                                                    ? Icons
                                                        .edit_location_alt_rounded
                                                    : Icons.public_rounded),
                                            size: 10,
                                            color: _locationSource ==
                                                    LocationSource.gps
                                                ? const Color(0xFF22C55E)
                                                : (_locationSource ==
                                                        LocationSource.manual
                                                    ? const Color(0xFFFBBF24)
                                                    : const Color(0xFF60A5FA)),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            _locationSource ==
                                                    LocationSource.gps
                                                ? 'LIVE GPS'
                                                : (_locationSource ==
                                                        LocationSource.manual
                                                    ? 'CUSTOM'
                                                    : 'IP NETWORK'),
                                            style: TextStyle(
                                              color: _locationSource ==
                                                      LocationSource.gps
                                                  ? const Color(0xFF22C55E)
                                                  : (_locationSource ==
                                                          LocationSource.manual
                                                      ? const Color(0xFFFBBF24)
                                                      : const Color(
                                                          0xFF60A5FA)),
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F172A),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                      color: const Color(0xFF1E293B)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.location_on_rounded,
                                          size: 16,
                                          color: _latitude != null
                                              ? const Color(0xFF22C55E)
                                              : const Color(0xFF60A5FA),
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            _latitude != null
                                                ? 'Lat: ${_latitude!.toStringAsFixed(4)}, Long: ${_longitude!.toStringAsFixed(4)}'
                                                : 'Coordinates not fetched',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              color: _latitude != null
                                                  ? Colors.white
                                                  : const Color(0xFF94A3B8),
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (_locationAddress != null &&
                                        _locationAddress!.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const SizedBox(width: 22),
                                          Expanded(
                                            child: Text(
                                              _locationAddress!,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                color: Color(0xFF94A3B8),
                                                fontSize: 11.5,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                    const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: _isFetchingLocation
                                                ? null
                                                : _handleGetCurrentLocation,
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: Colors.white,
                                              side: const BorderSide(
                                                  color: Color(0xFF1E293B)),
                                              backgroundColor:
                                                  const Color(0xFF131B2E),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 10,
                                                      horizontal: 8),
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                            ),
                                            icon: _isFetchingLocation
                                                ? const SizedBox(
                                                    width: 14,
                                                    height: 14,
                                                    child:
                                                        CircularProgressIndicator(
                                                      strokeWidth: 1.8,
                                                      valueColor:
                                                          AlwaysStoppedAnimation<
                                                                  Color>(
                                                              Colors.white),
                                                    ),
                                                  )
                                                : const Icon(
                                                    Icons.my_location_rounded,
                                                    size: 15,
                                                    color: Color(0xFF60A5FA),
                                                  ),
                                            label: Text(
                                              _latitude != null
                                                  ? 'Refresh Location'
                                                  : 'Get Current Location',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        OutlinedButton.icon(
                                          onPressed: _showEditLocationDialog,
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor:
                                                const Color(0xFF94A3B8),
                                            side: const BorderSide(
                                                color: Color(0xFF1E293B)),
                                            backgroundColor:
                                                const Color(0xFF131B2E),
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 10, horizontal: 10),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                          ),
                                          icon: const Icon(
                                            Icons.edit_location_alt_rounded,
                                            size: 15,
                                            color: Color(0xFF94A3B8),
                                          ),
                                          label: const Text(
                                            'Custom',
                                            style: TextStyle(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 18),

                              // ── Description Field ──
                              const Text(
                                'DESCRIPTION',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF64748B),
                                  letterSpacing: 1.1,
                                ),
                              ),
                              const SizedBox(height: 6),
                              TextField(
                                controller: _descriptionController,
                                minLines: 3,
                                maxLines: 5,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 13.5),
                                decoration: InputDecoration(
                                  hintText:
                                      'Describe the emergency situation, visible hazards, stranded victims, immediate threats...',
                                  hintStyle: const TextStyle(
                                      color: Color(0xFF475569), fontSize: 12.5),
                                  filled: true,
                                  fillColor: const Color(0xFF0F172A),
                                  contentPadding: const EdgeInsets.all(12),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                        color: Color(0xFF1E293B)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(10),
                                    borderSide: const BorderSide(
                                        color: Color(0xFFEF4444), width: 1.5),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 18),

                              // ── Resources Needed (Multi-Select Checkboxes) ──
                              const Text(
                                'RESOURCES NEEDED',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF64748B),
                                  letterSpacing: 1.1,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: _resourceOptions.map((res) {
                                  final isSelected =
                                      _selectedResources.contains(res);
                                  return InkWell(
                                    onTap: () {
                                      setState(() {
                                        if (isSelected) {
                                          _selectedResources.remove(res);
                                        } else {
                                          _selectedResources.add(res);
                                        }
                                      });
                                    },
                                    borderRadius: BorderRadius.circular(8),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? const Color(0xFFEF4444)
                                                .withValues(alpha: 0.12)
                                            : const Color(0xFF0F172A),
                                        borderRadius:
                                            BorderRadius.circular(8),
                                        border: Border.all(
                                          color: isSelected
                                              ? const Color(0xFFEF4444)
                                              : const Color(0xFF1E293B),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: Checkbox(
                                              value: isSelected,
                                              activeColor:
                                                  const Color(0xFFEF4444),
                                              checkColor: Colors.white,
                                              materialTapTargetSize:
                                                  MaterialTapTargetSize
                                                      .shrinkWrap,
                                              visualDensity:
                                                  VisualDensity.compact,
                                              onChanged: (val) {
                                                setState(() {
                                                  if (val == true) {
                                                    _selectedResources.add(res);
                                                  } else {
                                                    _selectedResources
                                                        .remove(res);
                                                  }
                                                });
                                              },
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            res,
                                            style: TextStyle(
                                              color: isSelected
                                                  ? Colors.white
                                                  : const Color(0xFF94A3B8),
                                              fontWeight: isSelected
                                                  ? FontWeight.w700
                                                  : FontWeight.w500,
                                              fontSize: 12.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 22),

                              // ── Submit Button ──
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: ElevatedButton(
                                  onPressed:
                                      _isSubmitting ? null : _handleSubmit,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFDC2626),
                                    foregroundColor: Colors.white,
                                    disabledBackgroundColor:
                                        const Color(0xFFDC2626)
                                            .withValues(alpha: 0.5),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: _isSubmitting
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.0,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(
                                                    Colors.white),
                                          ),
                                        )
                                      : const Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.send_rounded, size: 16),
                                            SizedBox(width: 8),
                                            Text(
                                              'Submit',
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w700,
                                                letterSpacing: 0.3,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildWelcomeBanner(bool isFirstResponder) {
    final displayName = _nameController.text.trim().isEmpty
        ? 'Unknown Person'
        : _nameController.text.trim();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isFirstResponder
              ? [const Color(0xFF7F1D1D), const Color(0xFFB91C1C)]
              : [const Color(0xFF1E3A5F), const Color(0xFF1D4ED8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: (isFirstResponder
                    ? const Color(0xFFDC2626)
                    : const Color(0xFF2563EB))
                .withValues(alpha: 0.25),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            child: Icon(
              isFirstResponder
                  ? Icons.local_hospital_rounded
                  : Icons.person_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome, $displayName',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  _role.toUpperCase(),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 10,
                    letterSpacing: 1.1,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
