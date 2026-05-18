import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String _error = '';

  Future<void> _register() async {
    setState(() { _loading = true; _error = ''; });
    try {
      await AuthService.register(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
        displayName: _nameCtrl.text.trim(),
      );
      if (mounted) context.go('/onboarding');
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
                Text('Tạo tài khoản', style: GoogleFonts.playfairDisplay(fontSize: 30, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Một Soul ID ẩn danh sẽ được tạo tự động cho bạn.', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14)),
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

                CosmicTextField(controller: _nameCtrl, hint: 'Tên hiển thị', icon: Icons.person_outline),
                const SizedBox(height: 16),
                CosmicTextField(controller: _emailCtrl, hint: 'Email', icon: Icons.mail_outline),
                const SizedBox(height: 16),
                CosmicTextField(controller: _passCtrl, hint: 'Mật khẩu', icon: Icons.lock_outline, obscure: true),
                const SizedBox(height: 32),
                CosmicButton(label: 'Đăng ký', onTap: _register, isLoading: _loading),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
