import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/auth_service.dart';

const _questions = [
  {
    'id': 'q1LifeFeeling',
    'question': 'Hiện tại, bạn cảm thấy cuộc sống của mình đang ở giai đoạn nào?',
    'options': [
      {'value': 'growing', 'label': '🌱  Đang phát triển, nhiều động lực'},
      {'value': 'stuck', 'label': '🌫️  Cảm thấy bế tắc, cần lối ra'},
      {'value': 'searching', 'label': '🔍  Đang tìm kiếm ý nghĩa và hướng đi'},
      {'value': 'healing', 'label': '🌸  Đang chữa lành những vết thương cũ'},
      {'value': 'thriving', 'label': '✨  Bình yên và trọn vẹn'},
    ],
  },
  {
    'id': 'q2SupportStyle',
    'question': 'Khi gặp khó khăn, bạn thường cần điều gì nhất?',
    'options': [
      {'value': 'listener', 'label': '👂  Một người lắng nghe không phán xét'},
      {'value': 'advice', 'label': '💡  Những lời khuyên thực tế'},
      {'value': 'presence', 'label': '🤝  Sự hiện diện im lặng của ai đó'},
      {'value': 'space', 'label': '🌙  Không gian tĩnh lặng một mình'},
    ],
  },
  {
    'id': 'q3Challenge',
    'question': 'Điều gì đang làm bạn trăn trở nhiều nhất dạo gần đây?',
    'options': [
      {'value': 'relationships', 'label': '❤️  Các mối quan hệ'},
      {'value': 'career', 'label': '💼  Sự nghiệp và tài chính'},
      {'value': 'identity', 'label': '🪞  Không biết mình thực sự là ai'},
      {'value': 'health', 'label': '🌿  Sức khỏe tinh thần / thể chất'},
      {'value': 'purpose', 'label': '🌟  Mục đích sống'},
    ],
  },
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> with SingleTickerProviderStateMixin {
  int _step = 0;
  final Map<String, String> _answers = {};
  bool _loading = false;
  late AnimationController _animCtrl;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 350));
    _slideAnim = Tween<Offset>(begin: const Offset(1, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
    _animCtrl.forward();
  }

  @override
  void dispose() { _animCtrl.dispose(); super.dispose(); }

  void _select(String value) async {
    final qId = _questions[_step]['id'] as String;
    _answers[qId] = value;

    if (_step < _questions.length - 1) {
      await _animCtrl.reverse();
      setState(() => _step++);
      _animCtrl.forward();
    } else {
      await _submit();
    }
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    await AuthService.submitOnboarding(_answers);
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final q = _questions[_step];
    final options = q['options'] as List<Map<String, String>>;

    return Scaffold(
      body: CosmicBackground(
        child: SafeArea(
          child: _loading
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: Color(0xFFE86EAD)),
                      const SizedBox(height: 20),
                      Text('Đang phân tích Hồ sơ nội tâm...', style: GoogleFonts.playfairDisplay(color: Colors.white, fontSize: 18)),
                      const SizedBox(height: 8),
                      Text('Chúng tôi đang thiết lập không gian riêng cho bạn', style: TextStyle(color: Colors.white.withOpacity(0.55))),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // Progress bar
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                      child: Row(
                        children: List.generate(_questions.length, (i) => Expanded(
                          child: Container(
                            height: 4,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(2),
                              color: i <= _step ? const Color(0xFFE86EAD) : Colors.white.withOpacity(0.2),
                            ),
                          ),
                        )),
                      ),
                    ),
                    Expanded(
                      child: SlideTransition(
                        position: _slideAnim,
                        child: Padding(
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 24),
                              Text(
                                q['question'] as String,
                                style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white, height: 1.4),
                              ),
                              const SizedBox(height: 36),
                              ...options.map((opt) => Padding(
                                padding: const EdgeInsets.only(bottom: 14),
                                child: _OptionCard(
                                  label: opt['label']!,
                                  selected: _answers[q['id'] as String] == opt['value'],
                                  onTap: () => _select(opt['value']!),
                                ),
                              )),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _OptionCard({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? const Color(0xFFE86EAD) : Colors.white.withOpacity(0.12),
            width: selected ? 1.5 : 1,
          ),
          color: selected ? const Color(0xFFE86EAD).withOpacity(0.15) : Colors.white.withOpacity(0.04),
          boxShadow: selected
              ? [BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.25), blurRadius: 16)]
              : [],
        ),
        child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.4)),
      ),
    );
  }
}
