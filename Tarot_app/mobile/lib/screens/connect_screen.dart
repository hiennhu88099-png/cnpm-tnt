import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/api_service.dart';

class ConnectionManager {
  static Future<List<String>> getConnectedIds() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList('connected_souls') ?? [];
  }

  static Future<void> connect(String soulId) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getConnectedIds();
    if (!list.contains(soulId)) {
      list.add(soulId);
      await prefs.setStringList('connected_souls', list);
    }
  }
}

class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});
  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final GlobalKey<_ConnectedTabState> _connectedTabKey = GlobalKey<_ConnectedTabState>();
  final GlobalKey<_ExploreTabState> _exploreTabKey = GlobalKey<_ExploreTabState>();

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  void _onMatched() {
    // Reload explore tab and connected tab states!
    _exploreTabKey.currentState?._load();
    _connectedTabKey.currentState?._load();
    // Instantly switch to 'Đang kết nối' tab for a beautiful transition!
    _tabCtrl.animateTo(1);
  }

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
              _ExploreTab(key: _exploreTabKey, onTabChange: _onMatched),
              _ConnectedTab(key: _connectedTabKey),
            ],
          ),
        ),
      ],
    );
  }
}

class _ExploreTab extends StatefulWidget {
  final VoidCallback onTabChange;
  const _ExploreTab({super.key, required this.onTabChange});

  @override
  State<_ExploreTab> createState() => _ExploreTabState();
}

class _ExploreTabState extends State<_ExploreTab> {
  List<dynamic> _users = [];
  List<String> _connectedIds = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await ApiService.getConnections();
    final connected = await ConnectionManager.getConnectedIds();
    
    final List<Map<String, dynamic>> simulatedSouls = [
      {
        'soulId': 'sim_zen_master',
        'displayName': 'Thiền Sư Minh Triết',
        'personalityType': 'INFJ - Tĩnh Lặng',
        'currentMoodEmoji': '🧘',
        'statusMessage': 'Tìm kiếm sự tĩnh lặng giữa thế giới ồn ào. Hãy chia sẻ nếu bạn cần sự bình yên.',
        'matchingPercent': '98% Tần số',
      },
      {
        'soulId': 'sim_astro_lover',
        'displayName': 'Astro Quỳnh Anh',
        'personalityType': 'ENFP - Sáng Tạo',
        'currentMoodEmoji': '✨',
        'statusMessage': 'Đam mê chiêm tinh học và Tarot. Hãy cùng kết nối tần số nhé!',
        'matchingPercent': '92% Tần số',
      },
      {
        'soulId': 'sim_chakra_healer',
        'displayName': 'Hoàng Nam Healer',
        'personalityType': 'INFP - Chữa Lành',
        'currentMoodEmoji': '🌿',
        'statusMessage': 'Chữa lành tổn thương bằng năng lượng tự nhiên. Chúc bạn một ngày an yên.',
        'matchingPercent': '87% Tần số',
      }
    ];

    final merged = [...data];
    if (merged.isEmpty) {
      merged.addAll(simulatedSouls);
    }

    if (mounted) {
      setState(() {
        _users = merged;
        _connectedIds = connected;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFFE86EAD)));
    
    final exploreList = _users.where((u) => !_connectedIds.contains(u['soulId'])).toList();
    
    if (exploreList.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('✨', style: TextStyle(fontSize: 50)),
              const SizedBox(height: 16),
              Text('Bạn đã kết nối hết rồi!', style: GoogleFonts.lora(color: Colors.white, fontSize: 18)),
              const SizedBox(height: 8),
              Text('Hãy chuyển sang tab "Đang kết nối" để trò chuyện sâu sắc cùng họ.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white.withOpacity(0.5))),
            ],
          ),
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      itemCount: exploreList.length,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _UserCard(
          user: exploreList[i] as Map<String, dynamic>,
          onConnected: widget.onTabChange,
        ),
      ),
    );
  }
}

class _ConnectedTab extends StatefulWidget {
  const _ConnectedTab({super.key});

  @override
  State<_ConnectedTab> createState() => _ConnectedTabState();
}

class _ConnectedTabState extends State<_ConnectedTab> {
  List<dynamic> _connectedUsers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final connectedIds = await ConnectionManager.getConnectedIds();
    final data = await ApiService.getConnections();
    
    final List<Map<String, dynamic>> simulatedSouls = [
      {
        'soulId': 'sim_zen_master',
        'displayName': 'Thiền Sư Minh Triết',
        'personalityType': 'INFJ - Tĩnh Lặng',
        'currentMoodEmoji': '🧘',
        'statusMessage': 'Tìm kiếm sự tĩnh lặng giữa thế giới ồn ào. Hãy chia sẻ nếu bạn cần sự bình yên.',
        'matchingPercent': '98% Tần số',
      },
      {
        'soulId': 'sim_astro_lover',
        'displayName': 'Astro Quỳnh Anh',
        'personalityType': 'ENFP - Sáng Tạo',
        'currentMoodEmoji': '✨',
        'statusMessage': 'Đam mê chiêm tinh học và Tarot. Hãy cùng kết nối tần số nhé!',
        'matchingPercent': '92% Tần số',
      },
      {
        'soulId': 'sim_chakra_healer',
        'displayName': 'Hoàng Nam Healer',
        'personalityType': 'INFP - Chữa Lành',
        'currentMoodEmoji': '🌿',
        'statusMessage': 'Chữa lành tổn thương bằng năng lượng tự nhiên. Chúc bạn một ngày an yên.',
        'matchingPercent': '87% Tần số',
      }
    ];

    final merged = [...data];
    if (merged.isEmpty) {
      merged.addAll(simulatedSouls);
    }

    final filtered = merged.where((u) => connectedIds.contains(u['soulId'])).toList();

    if (mounted) {
      setState(() {
        _connectedUsers = filtered;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFFE86EAD)));

    if (_connectedUsers.isEmpty) {
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
              Text('Hãy khám phá và truyền năng lượng đến những tâm hồn đồng điệu ở tab bên cạnh!', textAlign: TextAlign.center, style: TextStyle(color: Colors.white.withOpacity(0.5), height: 1.5)),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      itemCount: _connectedUsers.length,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _ConnectedUserCard(
          user: _connectedUsers[i] as Map<String, dynamic>,
          onDisconnected: _load,
        ),
      ),
    );
  }
}

class _UserCard extends StatefulWidget {
  final Map<String, dynamic> user;
  final VoidCallback onConnected;
  const _UserCard({required this.user, required this.onConnected});
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
    final matching = widget.user['matchingPercent'] ?? '95% Tần số';

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
                  child: Text(matching, style: const TextStyle(color: Color(0xFF4ECDC4), fontSize: 10)),
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
                await ConnectionManager.connect(soulId);
                if (soulId.startsWith('sim_')) {
                  await Future.delayed(const Duration(milliseconds: 400));
                } else {
                  await ApiService.pokeUser(soulId);
                }
                
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    duration: const Duration(seconds: 2),
                    backgroundColor: const Color(0xFF130B29),
                    content: Row(
                      children: [
                        const Text('⚡ ', style: TextStyle(fontSize: 20)),
                        Expanded(child: Text('Tần số đã hòa hợp! Đã kết nối tâm hồn cùng $name.', style: const TextStyle(color: Colors.white, fontSize: 13))),
                      ],
                    ),
                  ));
                  widget.onConnected();
                }
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

class _ConnectedUserCard extends StatelessWidget {
  final Map<String, dynamic> user;
  final VoidCallback onDisconnected;
  const _ConnectedUserCard({required this.user, required this.onDisconnected});

  @override
  Widget build(BuildContext context) {
    final name = user['displayName'] ?? '';
    final emoji = user['currentMoodEmoji'] ?? '✨';
    final status = user['statusMessage'] ?? '';
    final matching = user['matchingPercent'] ?? '95% Tần số';

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
                    color: const Color(0xFFE86EAD).withOpacity(0.15),
                    border: Border.all(color: const Color(0xFFE86EAD).withOpacity(0.3)),
                  ),
                  child: Text(matching, style: const TextStyle(color: Color(0xFFE86EAD), fontSize: 10)),
                ),
              ]),
              const SizedBox(height: 4),
              Text(status, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
            ],
          )),
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => SpiritualChatScreen(guide: user),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: const LinearGradient(colors: [Color(0xFFE86EAD), Color(0xFFC9A84C)]),
              ),
              child: const Text('Trò chuyện 💬', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }
}

class SpiritualChatScreen extends StatefulWidget {
  final Map<String, dynamic> guide;
  const SpiritualChatScreen({super.key, required this.guide});

  @override
  State<SpiritualChatScreen> createState() => _SpiritualChatScreenState();
}

class _SpiritualChatScreenState extends State<SpiritualChatScreen> {
  final _ctrl = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _isTyping = false;
  bool _isSimulated = false;

  @override
  void initState() {
    super.initState();
    _isSimulated = widget.guide['soulId']?.toString().startsWith('sim_') ?? false;

    if (_isSimulated) {
      final name = widget.guide['displayName'];
      String opening = "Chào bạn, mình rất vui vì tần số rung động của chúng ta đã tìm thấy nhau. Hôm nay bạn đang trăn trở điều gì? Hãy chia sẻ cùng mình nhé.";
      if (widget.guide['soulId'] == 'sim_zen_master') {
        opening = "A Di Đà Phật, chào thiện nam/tín nữ. Bần tăng cảm nhận được tâm trí bạn đang có chút gợn sóng. Hãy ngồi xuống, uống một ngụm trà ấm và chia sẻ điều đang làm tâm bạn chưa yên nhé.";
      } else if (widget.guide['soulId'] == 'sim_astro_lover') {
        opening = "Chào cưng! Trời ơi, biểu đồ sao của hai đứa mình có góc tam hợp (Trine) đẹp xuất sắc luôn đó! Hôm nay vũ trụ gửi thông điệp gì đến bạn vậy? Kể mình nghe liền nha!";
      } else if (widget.guide['soulId'] == 'sim_chakra_healer') {
        opening = "Chào bạn hiền. Nhìn vào màu sắc hào quang của bạn hôm nay, mình thấy luân xa Tim đang cần thêm chút năng lượng xanh lục dịu nhẹ. Có chuyện gì đang làm tổn thương tâm hồn bạn không?";
      }
      
      _messages.add({
        'role': 'ai',
        'text': opening
      });
    } else {
      _loadRealMessages();
    }
  }

  Future<void> _loadRealMessages() async {
    try {
      final data = await ApiService.getRealMessages(widget.guide['soulId']);
      if (mounted) {
        setState(() {
          _messages.clear();
          for (var m in data) {
            _messages.add({
              'role': m['senderSoulId'] == widget.guide['soulId'] ? 'ai' : 'user',
              'text': m['content'] ?? ''
            });
          }
        });
      }
    } catch (e) {
      // Ignored for now
    }
  }

  void _sendMessage() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _isTyping = true;
    });
    _ctrl.clear();

    if (!_isSimulated) {
      // Real user messaging
      try {
        await ApiService.sendRealMessage(widget.guide['soulId'], text);
        if (mounted) {
          setState(() {
            _isTyping = false;
          });
          _loadRealMessages();
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isTyping = false;
            _messages.add({
              'role': 'ai',
              'text': 'Không thể gửi tin nhắn. Hãy thử lại sau.'
            });
          });
        }
      }
      return;
    }

    try {
      final name = widget.guide['displayName'];
      final type = widget.guide['personalityType'];
      final status = widget.guide['statusMessage'];
      
      String systemPrompt = "Bạn đang đóng vai là $name (Tính cách: $type, Trạng thái: $status).\n"
          "Văn phong của bạn phải phản ánh đúng 100% nhân vật này:\n";
      
      if (widget.guide['soulId'] == 'sim_zen_master') {
        systemPrompt += "- Xưng hô là 'bần tăng' hoặc 'thiền sư', gọi người dùng là 'thiện nam/tín nữ' hoặc 'bạn'.\n"
            "- Nói chuyện bằng triết lý Phật giáo, khuyên thiền định, buông bỏ chấp niệm, nhìn nhận mọi sự vô thường.\n"
            "- Văn phong điềm đạm, thấu suốt, nhẹ nhàng và thanh tịnh.";
      } else if (widget.guide['soulId'] == 'sim_astro_lover') {
        systemPrompt += "- Xưng hô thân mật là 'mình' hoặc 'cưng' hoặc 'bạn'.\n"
            "- Sử dụng thuật ngữ chiêm tinh học (các hành tinh, cung hoàng đạo, góc chiếu) và lá bài Tarot để giải mã vấn đề.\n"
            "- Văn phong trẻ trung, tràn đầy năng lượng, phấn khởi và động viên.";
      } else if (widget.guide['soulId'] == 'sim_chakra_healer') {
        systemPrompt += "- Xưng hô 'mình' và 'bạn hiền'.\n"
            "- Phân tích luân xa (Chakras), màu sắc hào quang (Aura) và khuyên các bài tập thiền thở, kết nối thiên nhiên.\n"
            "- Văn phong cực kỳ chữa lành, dịu mát, an ủi, đầy lòng trắc ẩn.";
      } else {
        systemPrompt += "- Xưng hô lịch sự, thấu cảm, tinh tế của một người bạn tri âm tri kỷ.";
      }
      
      systemPrompt += "\n\nHãy trả lời tin nhắn sau của người dùng theo phong cách của bạn (khoảng 80-120 từ, tiếng Việt tự nhiên, không cần định dạng JSON hay markdown code block):\n"
          "Tin nhắn: \"$text\"";

      final aiResponse = await ApiService.chat(systemPrompt, "");
      
      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add({'role': 'ai', 'text': aiResponse});
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add({
            'role': 'ai',
            'text': 'Mình đang tập trung thiền định nên phản hồi hơi chậm, bạn nhắn lại nhé.'
          });
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.guide['displayName'];
    final type = widget.guide['personalityType'];
    final emoji = widget.guide['currentMoodEmoji'] ?? '✨';

    return Scaffold(
      backgroundColor: const Color(0xFF0D061F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF130B29),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              width: 38, height: 38,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [Color(0xFFE86EAD), Color(0xFF4ECDC4)]),
              ),
              child: Center(child: Text(emoji, style: const TextStyle(fontSize: 18))),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: GoogleFonts.lora(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                Text(type, style: const TextStyle(color: Color(0xFF4ECDC4), fontSize: 11)),
              ],
            )),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, i) {
                if (i == _messages.length) {
                  return Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text('$name đang kết nối sóng...', style: TextStyle(color: Colors.white.withOpacity(0.5), fontStyle: FontStyle.italic, fontSize: 12)),
                    ),
                  );
                }
                final msg = _messages[i];
                final isMe = msg['role'] == 'user';
                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                    decoration: BoxDecoration(
                      color: isMe ? const Color(0xFFE86EAD).withOpacity(0.2) : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(20).copyWith(
                        bottomRight: isMe ? const Radius.circular(0) : const Radius.circular(20),
                        bottomLeft: !isMe ? const Radius.circular(0) : const Radius.circular(20),
                      ),
                      border: Border.all(color: isMe ? const Color(0xFFE86EAD).withOpacity(0.4) : Colors.white.withOpacity(0.1)),
                    ),
                    child: Text(
                      msg['text']!,
                      style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14, height: 1.5),
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            decoration: BoxDecoration(
              color: const Color(0xFF130B29),
              border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: TextField(
                      controller: _ctrl,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Nhập lời trò chuyện tâm hồn...',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(colors: [Color(0xFFE86EAD), Color(0xFFC9A84C)]),
                    ),
                    child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
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
