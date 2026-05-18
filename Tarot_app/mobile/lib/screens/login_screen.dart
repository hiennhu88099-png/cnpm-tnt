import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';

  Future<void> _login() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final data = await AuthService.login(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      if (mounted) {
        if (data['onboardingCompleted'] == true) {
          context.go('/home');
        } else {
          context.go('/onboarding');
        }
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CosmicBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
                  onPressed: () => context.go('/'),
                ),
                const SizedBox(height: 24),
                Text('Đăng nhập', style: GoogleFonts.playfairDisplay(fontSize: 30, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Chào mừng bạn quay lại với không gian của mình.', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14)),
                const SizedBox(height: 36),

                if (_error.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.withOpacity(0.4)),
                    ),
                    child: Text(_error, style: const TextStyle(color: Color(0xFFFFAAAA))),
                  ),
                  const SizedBox(height: 20),
                ],

                CosmicTextField(controller: _emailCtrl, hint: 'Email', icon: Icons.mail_outline),
                const SizedBox(height: 16),
                CosmicTextField(controller: _passCtrl, hint: 'Mật khẩu', icon: Icons.lock_outline, obscure: true),
                const SizedBox(height: 32),
                CosmicButton(label: 'Đăng nhập', onTap: _login, isLoading: _loading),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
