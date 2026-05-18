import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'tarot_screen.dart';
import 'journal_screen.dart';
import 'connect_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _user;
  int _selectedTab = 0;

  final _tabs = const [
    _DashboardTab(),
    TarotScreen(),
    JournalScreen(),
    ConnectScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final u = await AuthService.getUser();
    if (mounted) setState(() => _user = u);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CosmicBackground(
        child: SafeArea(
          child: Column(
            children: [
              Expanded(child: _tabs[_selectedTab]),
              _BottomNav(selected: _selectedTab, onTap: (i) => setState(() => _selectedTab = i)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Dashboard (Tab 0) ───────────────────────────────────────────────────────
class _DashboardTab extends StatefulWidget {
  const _DashboardTab();
  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<_DashboardTab> {
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final u = await AuthService.getUser();
    if (mounted) setState(() => _user = u);
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final displayName = _user?['displayName'] ?? 'bạn';
    final soulId = _user?['soulId'] ?? 'Soul-XXXXX';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header: Greeting & Moon Phase ──
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.15)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('🌘', style: TextStyle(fontSize: 12)),
                          const SizedBox(width: 6),
                          Text('Trăng khuyết cuối tháng', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Chào $displayName,',
                        style: GoogleFonts.playfairDisplay(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 4),
                    Text('Vũ trụ đang gửi năng lượng gì đến bạn?',
                        style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13)),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.logout_rounded, color: Colors.white.withOpacity(0.3)),
                onPressed: _logout,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // ── Daily Cosmic Quote ──
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2A1B40), Color(0xFF130B29)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFC9A84C).withOpacity(0.4), width: 1),
              boxShadow: [
                BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.15), blurRadius: 20, spreadRadius: 0),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xFFC9A84C), size: 16),
                    const SizedBox(width: 8),
                    Text('THÔNG ĐIỆP HÔM NAY', style: TextStyle(color: const Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '"Những gì bạn đang tìm kiếm cũng đang trên đường tìm kiếm bạn. Hãy giữ tần số rung động của mình thật cao."',
                  style: GoogleFonts.playfairDisplay(color: Colors.white, fontSize: 16, height: 1.6, fontStyle: FontStyle.italic),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Energy Frequency Check-in (Mood) ──
          Text('Tần số năng lượng hiện tại', style: TextStyle(color: Colors.white.withOpacity(0.9), fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 12),
          _MoodRow(),
          const SizedBox(height: 24),

          // ── Cosmic Actions ──
          Text('Hành trình tâm linh', style: TextStyle(color: Colors.white.withOpacity(0.9), fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 12),
          
          // Main Tarot Card
          GestureDetector(
            onTap: () {
              final state = context.findAncestorStateOfType<_HomeScreenState>();
              state?.setState(() => state._selectedTab = 1);
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                image: const DecorationImage(
                  image: AssetImage('assets/images/tarot/the_star.png'), // Using one of the beautiful generated cards as background
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(Colors.black54, BlendMode.darken),
                ),
                border: Border.all(color: Colors.white.withOpacity(0.15)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFC9A84C), borderRadius: BorderRadius.circular(10)),
                    child: const Text('NỔI BẬT', style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
                  ),
                  const SizedBox(height: 12),
                  Text('Trải bài & Bản đồ Vũ Trụ', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 6),
                  Text('Khám phá thông điệp sâu sắc từ vũ trụ và các vì sao dành riêng cho bạn.',
                    style: TextStyle(color: Colors.white.withOpacity(0.8), height: 1.4, fontSize: 12)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text('Bắt đầu giải mã', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Minor Cards
          Row(
            children: [
              Expanded(
                child: _QuickCard(
                  icon: Icons.book_outlined,
                  label: 'Nhật ký linh hồn',
                  sub: 'Ghi lại hành trình',
                  color: const Color(0xFF4ECDC4),
                  onTap: () {
                    final state = context.findAncestorStateOfType<_HomeScreenState>();
                    state?.setState(() => state._selectedTab = 2);
                  },
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _QuickCard(
                  icon: Icons.favorite_border_rounded,
                  label: 'Tần số tương đồng',
                  sub: 'Kết nối tâm hồn',
                  color: const Color(0xFFE86EAD),
                  onTap: () {
                    final state = context.findAncestorStateOfType<_HomeScreenState>();
                    state?.setState(() => state._selectedTab = 3);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // ── Soul Aura Profile ──
          GlassPanel(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const RadialGradient(
                      colors: [Color(0xFFE86EAD), Color(0xFF4ECDC4), Color(0xFF1A0A2E)],
                      stops: [0.1, 0.5, 1.0],
                    ),
                    border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
                    boxShadow: [BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.3), blurRadius: 15)],
                  ),
                  child: const Center(child: Text('✨', style: TextStyle(fontSize: 24))),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(soulId, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.5)),
                      const SizedBox(height: 4),
                      Text('Aura: Tím thạch anh (Trực giác)', style: TextStyle(color: const Color(0xFFE86EAD).withOpacity(0.9), fontSize: 12)),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: 0.45,
                          backgroundColor: Colors.white.withOpacity(0.1),
                          valueColor: const AlwaysStoppedAnimation(Color(0xFF4ECDC4)),
                          minHeight: 6,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text('Trực giác đang thức tỉnh: 45%', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
                    ],
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

// ─── Mood Row ────────────────────────────────────────────────────────────────
class _MoodRow extends StatefulWidget {
  @override
  State<_MoodRow> createState() => _MoodRowState();
}

class _MoodRowState extends State<_MoodRow> {
  int? _selected;
  final _moods = [
    {'emoji': '✨', 'label': 'Rực rỡ', 'value': 'GOOD'},
    {'emoji': '🌊', 'label': 'Bình yên', 'value': 'NEUTRAL'},
    {'emoji': '🌧️', 'label': 'Trầm lắng', 'value': 'LOW'},
    {'emoji': '🌪️', 'label': 'Hỗn loạn', 'value': 'VERY_LOW'},
    {'emoji': '🥀', 'label': 'Cạn kiệt', 'value': 'VERY_LOW'},
  ];

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(_moods.length, (i) {
          final selected = _selected == i;
          return GestureDetector(
            onTap: () {
              setState(() => _selected = i);
              ApiService.saveMood(_moods[i]['value']!, 'Check-in from Dashboard');
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              padding: EdgeInsets.symmetric(horizontal: selected ? 14 : 8, vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: selected
                    ? const LinearGradient(colors: [Color(0xFFE86EAD), Color(0xFF4ECDC4)], begin: Alignment.topLeft, end: Alignment.bottomRight)
                    : null,
                color: selected ? null : Colors.white.withOpacity(0.03),
                border: Border.all(color: selected ? Colors.transparent : Colors.white.withOpacity(0.08)),
                boxShadow: selected ? [BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 2))] : [],
              ),
              child: Column(
                children: [
                  Text(_moods[i]['emoji']!, style: TextStyle(fontSize: selected ? 24 : 20)),
                  const SizedBox(height: 6),
                  Text(
                    _moods[i]['label']!,
                    style: TextStyle(
                      color: selected ? Colors.white : Colors.white54,
                      fontSize: selected ? 11 : 10,
                      fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ─── Quick Card ──────────────────────────────────────────────────────────────
class _QuickCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  final Color color;
  final VoidCallback? onTap;

  const _QuickCard({required this.icon, required this.label, required this.sub, required this.color, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: GlassPanel(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withOpacity(0.3)),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 16),
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 4),
            Text(sub, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
class _BottomNav extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.home_rounded, 'Trang chủ'),
      (Icons.auto_awesome_rounded, 'Tarot'),
      (Icons.book_outlined, 'Nhật ký'),
      (Icons.people_outline_rounded, 'Kết nối'),
      (Icons.person_outline_rounded, 'Hồ sơ'),
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (i) {
          final isSelected = i == selected;
          return GestureDetector(
            onTap: () => onTap(i),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(items[i].$1, color: isSelected ? const Color(0xFFE86EAD) : Colors.white.withOpacity(0.35), size: 24),
                const SizedBox(height: 4),
                Text(items[i].$2, style: TextStyle(color: isSelected ? const Color(0xFFE86EAD) : Colors.white.withOpacity(0.35), fontSize: 10)),
              ]),
            ),
          );
        }),
      ),
    );
  }
}
