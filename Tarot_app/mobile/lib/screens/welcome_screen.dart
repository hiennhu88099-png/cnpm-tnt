import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CosmicBackground(
        child: Stack(
          children: [
            const SizedBox.expand(child: StarField()),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    const Spacer(flex: 2),
                    // Moon icon + glow
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: 1),
                      duration: const Duration(milliseconds: 1200),
                      builder: (_, v, child) => Opacity(opacity: v, child: child),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(28),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.3), blurRadius: 60, spreadRadius: 10)],
                            ),
                            child: const Icon(Icons.nights_stay_rounded, size: 80, color: Colors.white),
                          ),
                          const SizedBox(height: 32),
                          Text(
                            'Soul Mirror',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 40, fontWeight: FontWeight.bold,
                              foreground: Paint()..shader = const LinearGradient(
                                colors: [Colors.white, Color(0xFFE86EAD), Colors.white],
                              ).createShader(const Rect.fromLTWH(0, 0, 300, 60)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Nền tảng chăm sóc nội tâm, nơi những\ntâm hồn đồng điệu tìm thấy nhau.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white.withOpacity(0.65), fontSize: 16, height: 1.6),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(flex: 3),
                    // Buttons
                    CosmicButton(
                      label: 'Bắt đầu hành trình',
                      onTap: () => context.go('/register'),
                    ),
                    const SizedBox(height: 16),
                    CosmicOutlineButton(
                      label: 'Tôi đã có tài khoản',
                      onTap: () => context.go('/login'),
                    ),
                    const SizedBox(height: 48),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
