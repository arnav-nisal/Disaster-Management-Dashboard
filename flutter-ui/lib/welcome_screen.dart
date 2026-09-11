import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'incident_report_screen.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();

  static const List<String> _roleOptions = ['Civilian', 'First Responder'];
  String _selectedRole = 'Civilian';
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleContinue() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final name = _nameController.text.trim();
      final role = _selectedRole;

      // Save user identity using shared_preferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('name', name);
      await prefs.setString('role', role);
      await prefs.setString('user_name', name);
      await prefs.setString('user_role', role);

      if (!mounted) return;

      // Navigate to IncidentReportScreen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => IncidentReportScreen(
            userName: name,
            userRole: role,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save user details: $e'),
          backgroundColor: Colors.red.shade700,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isFirstResponder = _selectedRole == 'First Responder';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Emblem
                    Center(
                      child: Container(
                        width: 74,
                        height: 74,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFDC2626), Color(0xFFEA580C)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFDC2626).withValues(alpha: 0.35),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.shield_outlined,
                          color: Colors.white,
                          size: 40,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // App Title & Tagline
                    Text(
                      'Disaster Relief Portal',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Emergency response coordination & rapid incident reporting network',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF94A3B8),
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 26),

                    // Dark Themed Form Container Card
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: const Color(0xFF131B2E),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF1E293B)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.35),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Quick Identification',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'No login required. Enter details to access incident reporting.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Name Input Field
                          const Text(
                            'Enter your Name',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFCBD5E1),
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                            ),
                            cursorColor: const Color(0xFFEF4444),
                            decoration: InputDecoration(
                              hintText: 'Enter your Name',
                              hintStyle: const TextStyle(color: Color(0xFF64748B)),
                              prefixIcon: const Icon(
                                Icons.person_outline_rounded,
                                color: Color(0xFF94A3B8),
                              ),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide:
                                    const BorderSide(color: Color(0xFF334155)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: Color(0xFFEF4444),
                                  width: 1.8,
                                ),
                              ),
                              errorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide:
                                    const BorderSide(color: Color(0xFFF87171)),
                              ),
                              focusedErrorBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: Color(0xFFEF4444),
                                  width: 1.8,
                                ),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter your name';
                              }
                              if (value.trim().length < 2) {
                                return 'Name must be at least 2 characters';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Role Dropdown Field
                          const Text(
                            'Role',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFCBD5E1),
                            ),
                          ),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedRole,
                            dropdownColor: const Color(0xFF1E293B),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                            items: _roleOptions.map((role) {
                              final isResp = role == 'First Responder';
                              return DropdownMenuItem<String>(
                                value: role,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      isResp
                                          ? Icons.emergency_rounded
                                          : Icons.volunteer_activism_outlined,
                                      size: 18,
                                      color: isResp
                                          ? const Color(0xFFEF4444)
                                          : const Color(0xFF60A5FA),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      role,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFFF1F5F9),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                            onChanged: (value) {
                              if (value != null) {
                                setState(() {
                                  _selectedRole = value;
                                });
                              }
                            },
                            decoration: InputDecoration(
                              prefixIcon: const Icon(
                                Icons.badge_outlined,
                                color: Color(0xFF94A3B8),
                              ),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide:
                                    const BorderSide(color: Color(0xFF334155)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: Color(0xFFEF4444),
                                  width: 1.8,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Role description pill (Dark Mode)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isFirstResponder
                                  ? const Color(0xFF2A0D0D)
                                  : const Color(0xFF0C213B),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isFirstResponder
                                    ? const Color(0xFF7F1D1D)
                                    : const Color(0xFF1D4ED8),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline_rounded,
                                  size: 16,
                                  color: isFirstResponder
                                      ? const Color(0xFFEF4444)
                                      : const Color(0xFF60A5FA),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    isFirstResponder
                                        ? 'Access emergency dispatch, priority alerts & response tools.'
                                        : 'Report incidents, request assistance & view safe zones.',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: isFirstResponder
                                          ? const Color(0xFFFECACA)
                                          : const Color(0xFFBFDBFE),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 22),

                          // Prominent Continue Button
                          SizedBox(
                            width: double.infinity,
                            height: 50,
                            child: ElevatedButton(
                              onPressed: _isSaving ? null : _handleContinue,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFDC2626),
                                foregroundColor: Colors.white,
                                elevation: 2,
                                shadowColor: const Color(0xFFDC2626).withValues(alpha: 0.45),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: _isSaving
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.2,
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                            Colors.white),
                                      ),
                                    )
                                  : const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Continue',
                                          style: TextStyle(
                                            fontSize: 15.5,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                        SizedBox(width: 8),
                                        Icon(
                                          Icons.arrow_forward_rounded,
                                          size: 18,
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Direct Emergency Hotline Notice
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.phone_in_talk_rounded,
                          size: 15,
                          color: Color(0xFF64748B),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            'Life danger? Call emergency services (911 / 112)',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF94A3B8),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
