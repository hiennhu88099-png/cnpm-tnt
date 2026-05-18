import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() { super.initState(); _loadUser(); }

  Future<void> _loadUser() async {
    final u = await AuthService.getUser();
    final s = await ApiService.getProfileStats();
    if (mounted) setState(() { _user = u; _stats = s; _loading = false; });
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFFE86EAD)));

    final displayName = _stats?['displayName'] ?? _user?['displayName'] ?? '---';
    final soulId = _user?['soulId'] ?? 'Soul-XXXXX';
    final email = _stats?['email'] ?? _user?['email'] ?? '';
    final personalityType = _stats?['personalityType'] ?? 'Seeker';
    final currentStreak = _stats?['currentStreak']?.toString() ?? '0';
    final tarotDrawnCount = _stats?['tarotDrawnCount']?.toString() ?? '0';
    final journalCount = _stats?['journalCount']?.toString() ?? '0';
    final mostFrequentMood = _stats?['mostFrequentMood'] ?? 'Chưa có';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      child: Column(
        children: [
          // Avatar + name
          Center(
            child: Column(
              children: [
                Stack(
                  children: [
                    Container(
                      width: 90, height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFFE86EAD), Color(0xFF1A0A2E)],
                        ),
                        boxShadow: [BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.4), blurRadius: 30)],
                      ),
                      child: Center(
                        child: Text(
                          displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
                          style: GoogleFonts.playfairDisplay(fontSize: 36, color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 4, right: 4,
                      child: Container(
                        width: 22, height: 22,
                        decoration: const BoxDecoration(color: Color(0xFF4ECDC4), shape: BoxShape.circle),
                        child: const Icon(Icons.edit, size: 13, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(displayName, style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF4ECDC4).withOpacity(0.4)),
                    color: const Color(0xFF4ECDC4).withOpacity(0.08),
                  ),
                  child: Text(soulId, style: const TextStyle(color: Color(0xFF4ECDC4), fontSize: 12, fontWeight: FontWeight.w500)),
                ),
                const SizedBox(height: 4),
                Text(email, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Inner profile card
          GlassPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Icon(Icons.psychology_outlined, color: Color(0xFFE86EAD), size: 20),
                  const SizedBox(width: 10),
                  Text('Hồ sơ nội tâm', style: GoogleFonts.playfairDisplay(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                ]),
                const SizedBox(height: 16),
                _ProfileStat(label: 'Kiểu tính cách', value: '$personalityType 🌟', color: const Color(0xFFE86EAD)),
                _ProfileStat(label: 'Cảm xúc thường thấy', value: mostFrequentMood, color: const Color(0xFF4ECDC4)),
                _ProfileStat(label: 'Năng lượng nội tâm', value: 'Đang tái tạo', color: const Color(0xFFC9A84C)),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: 0.5,
                    backgroundColor: Colors.white.withOpacity(0.1),
                    valueColor: const AlwaysStoppedAnimation(Color(0xFFE86EAD)),
                    minHeight: 8,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Stats row
          Row(children: [
            _StatBox(icon: Icons.auto_awesome, label: 'Tarot đã rút', value: tarotDrawnCount, color: const Color(0xFFC9A84C)),
            const SizedBox(width: 12),
            _StatBox(icon: Icons.book_outlined, label: 'Nhật ký', value: journalCount, color: const Color(0xFF4ECDC4)),
            const SizedBox(width: 12),
            _StatBox(icon: Icons.local_fire_department, label: 'Streak', value: currentStreak, color: const Color(0xFFE86EAD)),
          ]),
          const SizedBox(height: 16),

          // Streak
          GlassPanel(
            child: Row(children: [
              const Text('🔥', style: TextStyle(fontSize: 32)),
              const SizedBox(width: 16),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$currentStreak ngày liên tiếp', style: GoogleFonts.playfairDisplay(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Bạn đang duy trì thói quen chăm sóc nội tâm rất tốt!', style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 12, height: 1.4)),
                ],
              )),
            ]),
          ),
          const SizedBox(height: 16),

          // Settings list
          GlassPanel(
            child: Column(
              children: [
                _SettingRow(icon: Icons.notifications_outlined, label: 'Thông báo', onTap: () {}),
                _divider(),
                _SettingRow(icon: Icons.shield_outlined, label: 'Quyền riêng tư', onTap: () {}),
                _divider(),
                _SettingRow(icon: Icons.color_lens_outlined, label: 'Chủ đề giao diện', onTap: () {}),
                _divider(),
                _SettingRow(icon: Icons.help_outline_rounded, label: 'Hỗ trợ & Phản hồi', onTap: () {}),
              ],
            ),
          ),
          const SizedBox(height: 16),

          GlassPanel(
            child: _SettingRow(
              icon: Icons.logout_rounded,
              label: 'Đăng xuất',
              onTap: _logout,
              color: Colors.redAccent.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Divider(color: Colors.white.withOpacity(0.07), height: 1);
}

class _ProfileStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _ProfileStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 13)),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _StatBox({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GlassPanel(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        child: Column(children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 10), textAlign: TextAlign.center),
        ]),
      ),
    );
  }
}

class _SettingRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  const _SettingRow({required this.icon, required this.label, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(children: [
          Icon(icon, color: color ?? Colors.white.withOpacity(0.6), size: 20),
          const SizedBox(width: 14),
          Expanded(child: Text(label, style: TextStyle(color: color ?? Colors.white, fontSize: 15))),
          Icon(Icons.chevron_right, color: color?.withOpacity(0.5) ?? Colors.white.withOpacity(0.25), size: 20),
        ]),
      ),
    );
  }
}
