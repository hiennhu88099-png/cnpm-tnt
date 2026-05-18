import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/welcome_screen.dart';
import 'screens/register_screen.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const SoulMirrorApp());
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (ctx, state) => const WelcomeScreen()),
    GoRoute(path: '/register', builder: (ctx, state) => const RegisterScreen()),
    GoRoute(path: '/login', builder: (ctx, state) => const LoginScreen()),
    GoRoute(path: '/onboarding', builder: (ctx, state) => const OnboardingScreen()),
    GoRoute(path: '/home', builder: (ctx, state) => const HomeScreen()),
  ],
);

class SoulMirrorApp extends StatelessWidget {
  const SoulMirrorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Soul Mirror',
      debugShowCheckedModeBanner: false,
      routerConfig: _router,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0D0518),
        textTheme: GoogleFonts.montserratTextTheme(ThemeData.dark().textTheme),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFE86EAD),
          secondary: Color(0xFF4ECDC4),
          surface: Color(0xFF1A0A2E),
        ),
      ),
    );
  }
}
