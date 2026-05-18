import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/api_service.dart';

class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});
  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Kết nối', style: GoogleFonts.lora(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              Text('Những tâm hồn đồng điệu xung quanh bạn.', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
              const SizedBox(height: 16),
              TabBar(
                controller: _tabCtrl,
                indicatorColor: const Color(0xFFE86EAD),
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white38,
                tabs: const [Tab(text: 'Khám phá'), Tab(text: 'Đang kết nối')],
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabCtrl,
            children: [
              _ExploreTab(),
              _ConnectedTab(),
            ],
          ),
        ),
      ],
    );
  }
}

class _ExploreTab extends StatefulWidget {
  @override
  State<_ExploreTab> createState() => _ExploreTabState();
}

class _ExploreTabState extends State<_ExploreTab> {
  List<dynamic> _users = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await ApiService.getConnections();
    if (mounted) setState(() { _users = data; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFFE86EAD)));
    
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      itemCount: _users.length,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _UserCard(user: _users[i] as Map<String, dynamic>),
      ),
    );
  }
}

class _ConnectedTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🌙', style: TextStyle(fontSize: 60)),
            const SizedBox(height: 20),
            Text('Chưa có kết nối nào', style: GoogleFonts.lora(color: Colors.white, fontSize: 20)),
            const SizedBox(height: 12),
            Text('Hãy khám phá và kết nối với những tâm hồn đồng điệu!', textAlign: TextAlign.center, style: TextStyle(color: Colors.white.withOpacity(0.5), height: 1.5)),
          ],
        ),
      ),
    );
  }
}

class _UserCard extends StatefulWidget {
  final Map<String, dynamic> user;
  const _UserCard({required this.user});
  @override
  State<_UserCard> createState() => _UserCardState();
}

class _UserCardState extends State<_UserCard> {
  bool _connected = false;

  @override
  Widget build(BuildContext context) {
    final name = widget.user['displayName'] ?? '';
    final type = widget.user['personalityType'] ?? 'Unknown';
    final emoji = widget.user['currentMoodEmoji'] ?? '✨';
    final status = widget.user['statusMessage'] ?? '';
    final soulId = widget.user['soulId'] ?? '';

    return GlassPanel(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 50, height: 50,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(colors: [Color(0xFF1A0A2E), Color(0xFF0D1B4B)]),
              border: Border.all(color: const Color(0xFFE86EAD).withOpacity(0.3)),
            ),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: const Color(0xFF4ECDC4).withOpacity(0.15),
                    border: Border.all(color: const Color(0xFF4ECDC4).withOpacity(0.3)),
                  ),
                  child: Text(type, style: const TextStyle(color: Color(0xFF4ECDC4), fontSize: 10)),
                ),
              ]),
              const SizedBox(height: 4),
              Text(status, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
            ],
          )),
          GestureDetector(
            onTap: () async {
              if (_connected) return;
              setState(() => _connected = true);
              try {
                await ApiService.pokeUser(soulId);
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Đã gửi năng lượng tích cực đến $name!')));
              } catch (e) {
                setState(() => _connected = false);
              }
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: _connected ? const Color(0xFF4ECDC4).withOpacity(0.15) : const Color(0xFFE86EAD).withOpacity(0.15),
                border: Border.all(color: _connected ? const Color(0xFF4ECDC4).withOpacity(0.5) : const Color(0xFFE86EAD).withOpacity(0.5)),
              ),
              child: Text(_connected ? 'Đã gửi ✨' : 'Truyền ⚡', style: TextStyle(color: _connected ? const Color(0xFF4ECDC4) : const Color(0xFFE86EAD), fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }
}
