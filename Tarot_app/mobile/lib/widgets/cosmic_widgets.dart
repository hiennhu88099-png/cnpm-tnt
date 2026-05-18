import 'package:flutter/material.dart';
import 'dart:math' as math;

// ────────── Shared Cosmic Background Widget ──────────
class CosmicBackground extends StatelessWidget {
  final Widget child;
  const CosmicBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0D0518), Color(0xFF1A0A2E), Color(0xFF0D1B4B)],
            ),
          ),
        ),
        // Glow orbs
        Positioned(
          top: -60, left: -60,
          child: _glowOrb(280, const Color(0xFF1A0A2E)),
        ),
        Positioned(
          bottom: -80, right: -60,
          child: _glowOrb(240, const Color(0xFF0D1B4B)),
        ),
        const Positioned.fill(child: StarField()),
        child,
      ],
    );
  }

  Widget _glowOrb(double size, Color color) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withOpacity(0.6),
        boxShadow: [BoxShadow(color: color.withOpacity(0.4), blurRadius: 80, spreadRadius: 30)],
      ),
    );
  }
}

// ────────── Glass Panel ──────────
class GlassPanel extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final double? borderRadius;

  const GlassPanel({super.key, required this.child, this.padding, this.borderRadius});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(borderRadius ?? 20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20),
        ],
      ),
      child: child,
    );
  }
}

// ────────── Primary Button ──────────
class CosmicButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool isLoading;

  const CosmicButton({super.key, required this.label, this.onTap, this.isLoading = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFE86EAD), Color(0xFF1A0A2E)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 4)),
          ],
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text(label, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}

// ────────── Outline Button ──────────
class CosmicOutlineButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;

  const CosmicOutlineButton({super.key, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE86EAD).withOpacity(0.5)),
        ),
        child: Center(
          child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500)),
        ),
      ),
    );
  }
}

// ────────── Cosmic Text Field ──────────
class CosmicTextField extends StatelessWidget {
  final String hint;
  final bool obscure;
  final IconData icon;
  final TextEditingController controller;

  const CosmicTextField({
    super.key,
    required this.hint,
    required this.icon,
    required this.controller,
    this.obscure = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
          prefixIcon: Icon(icon, color: Colors.white.withOpacity(0.4)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }
}

// ────────── Spinning Stars decoration ──────────
class StarField extends StatefulWidget {
  const StarField({super.key});

  @override
  State<StarField> createState() => _StarFieldState();
}

class _StarFieldState extends State<StarField> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<_Star> _stars = List.generate(30, (_) => _Star());

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (_, __) => CustomPaint(painter: _StarPainter(_stars, _controller.value)),
    );
  }
}

class _Star {
  final double x = math.Random().nextDouble();
  final double y = math.Random().nextDouble();
  final double size = math.Random().nextDouble() * 2 + 0.5;
  final double speed = math.Random().nextDouble() * 0.5 + 0.5;
}

class _StarPainter extends CustomPainter {
  final List<_Star> stars;
  final double tick;
  _StarPainter(this.stars, this.tick);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white;
    for (final s in stars) {
      final opacity = (math.sin((tick * s.speed + s.x) * math.pi * 2) + 1) / 2 * 0.7 + 0.1;
      paint.color = Colors.white.withOpacity(opacity);
      canvas.drawCircle(Offset(s.x * size.width, s.y * size.height), s.size, paint);
    }
  }

  @override
  bool shouldRepaint(_StarPainter oldDelegate) => true;
}
