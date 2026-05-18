import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/api_service.dart';

// ─── Zodiac data ─────────────────────────────────────────────────────────────
const _zodiacData = {
  'Bạch Dương': {'emoji': '♈', 'en': 'Aries',       'element': 'Lửa 🔥', 'trait': 'Dũng cảm, nhiệt huyết, tiên phong'},
  'Kim Ngưu':   {'emoji': '♉', 'en': 'Taurus',      'element': 'Đất 🌍', 'trait': 'Bền vững, đáng tin, yêu cái đẹp'},
  'Song Tử':    {'emoji': '♊', 'en': 'Gemini',      'element': 'Khí 💨', 'trait': 'Linh hoạt, tò mò, giao tiếp giỏi'},
  'Cự Giải':    {'emoji': '♋', 'en': 'Cancer',      'element': 'Nước 🌊', 'trait': 'Nhạy cảm, bảo vệ, yêu gia đình'},
  'Sư Tử':      {'emoji': '♌', 'en': 'Leo',         'element': 'Lửa 🔥', 'trait': 'Tự tin, hào phóng, lãnh đạo'},
  'Xử Nữ':      {'emoji': '♍', 'en': 'Virgo',       'element': 'Đất 🌍', 'trait': 'Tỉ mỉ, thực tế, phân tích'},
  'Thiên Bình': {'emoji': '♎', 'en': 'Libra',       'element': 'Khí 💨', 'trait': 'Công bằng, hài hòa, thẩm mỹ'},
  'Bọ Cạp':     {'emoji': '♏', 'en': 'Scorpio',     'element': 'Nước 🌊', 'trait': 'Sâu sắc, quyết đoán, bí ẩn'},
  'Nhân Mã':    {'emoji': '♐', 'en': 'Sagittarius', 'element': 'Lửa 🔥', 'trait': 'Tự do, triết học, phiêu lưu'},
  'Ma Kết':     {'emoji': '♑', 'en': 'Capricorn',   'element': 'Đất 🌍', 'trait': 'Kỷ luật, tham vọng, kiên nhẫn'},
  'Bảo Bình':   {'emoji': '♒', 'en': 'Aquarius',    'element': 'Khí 💨', 'trait': 'Độc lập, nhân văn, sáng tạo'},
  'Song Ngư':   {'emoji': '♓', 'en': 'Pisces',      'element': 'Nước 🌊', 'trait': 'Đồng cảm, trực giác, nghệ thuật'},
};

// ─── Themed questions ─────────────────────────────────────────────────────────
const _themes = [
  {
    'icon': '💕', 'label': 'Tình yêu',
    'questions': [
      'Tôi cần thay đổi gì trong mối quan hệ hiện tại?',
      'Năng lượng tình yêu của tôi đang như thế nào?',
      'Tôi nên buông bỏ hay tiếp tục?',
      'Điều gì đang ngăn cản tôi tìm được tình yêu đích thực?',
    ],
  },
  {
    'icon': '💼', 'label': 'Sự nghiệp',
    'questions': [
      'Hướng đi nào phù hợp nhất với tôi lúc này?',
      'Tôi cần phát triển kỹ năng gì để tiến xa hơn?',
      'Có cơ hội nào tôi đang bỏ lỡ không?',
      'Tôi có nên thay đổi công việc hay không?',
    ],
  },
  {
    'icon': '🌱', 'label': 'Phát triển bản thân',
    'questions': [
      'Điểm mạnh nào tôi chưa khai thác hết?',
      'Bài học lớn nhất tôi cần học trong giai đoạn này là gì?',
      'Tôi cần buông bỏ niềm tin nào để bước tiếp?',
      'Phiên bản tốt nhất của tôi trông như thế nào?',
    ],
  },
  {
    'icon': '👨‍👩‍👧', 'label': 'Gia đình',
    'questions': [
      'Tôi cần chú ý điều gì trong gia đình lúc này?',
      'Làm thế nào để cân bằng giữa bản thân và gia đình?',
      'Mối quan hệ nào cần được chữa lành?',
      'Tôi có thể mang lại điều gì tốt đẹp cho người thân?',
    ],
  },
  {
    'icon': '🎯', 'label': 'Hướng đi',
    'questions': [
      'Quyết định quan trọng nhất tôi cần đưa ra là gì?',
      'Năng lượng vũ trụ đang muốn tôi chú ý điều gì?',
      'Tôi nên ưu tiên điều gì trong 3 tháng tới?',
      'Vũ trụ đang gửi thông điệp gì đến tôi hôm nay?',
    ],
  },
];

// ─── Zodiac calculation ───────────────────────────────────────────────────────
String _calcZodiac(DateTime dob) {
  final m = dob.month;
  final d = dob.day;
  if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return 'Bạch Dương';
  if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return 'Kim Ngưu';
  if ((m == 5 && d >= 21) || (m == 6 && d <= 20)) return 'Song Tử';
  if ((m == 6 && d >= 21) || (m == 7 && d <= 22)) return 'Cự Giải';
  if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return 'Sư Tử';
  if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return 'Xử Nữ';
  if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return 'Thiên Bình';
  if ((m == 10 && d >= 23) || (m == 11 && d <= 21)) return 'Bọ Cạp';
  if ((m == 11 && d >= 22) || (m == 12 && d <= 21)) return 'Nhân Mã';
  if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return 'Ma Kết';
  if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return 'Bảo Bình';
  return 'Song Ngư';
}

int _calcLifePath(DateTime dob) {
  int sum = dob.year ~/ 1000 + (dob.year % 1000) ~/ 100 +
            (dob.year % 100) ~/ 10 + dob.year % 10 +
            dob.month ~/ 10 + dob.month % 10 +
            dob.day ~/ 10 + dob.day % 10;
  while (sum > 9 && sum != 11 && sum != 22) {
    sum = sum.toString().split('').map(int.parse).reduce((a, b) => a + b);
  }
  return sum;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
class CosmicReadingScreen extends StatefulWidget {
  const CosmicReadingScreen({super.key});
  @override
  State<CosmicReadingScreen> createState() => _CosmicReadingScreenState();
}

class _CosmicReadingScreenState extends State<CosmicReadingScreen> {
  DateTime? _dob;
  int _themeIdx = 0;
  int? _questionIdx;
  Map<String, String>? _card;
  bool _loading = false;
  String? _zodiac;
  int? _lifePath;

  final _fallbackCards = [
    {'cardName': 'The Star', 'emoji': '⭐', 'message': 'Ánh sao đang dẫn lối cho bạn. Hãy tin vào quá trình.', 'advice': 'Kiên trì và giữ vững niềm tin.'},
    {'cardName': 'The Sun',  'emoji': '☀️', 'message': 'Năng lượng mặt trời đang tràn đầy trong bạn.', 'advice': 'Hãy tỏa sáng và chia sẻ niềm vui.'},
    {'cardName': 'The Moon', 'emoji': '🌙', 'message': 'Trực giác của bạn đang dẫn đường.', 'advice': 'Hãy lắng nghe tiếng nói bên trong.'},
  ];

  void _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1995, 6, 15),
      firstDate: DateTime(1940),
      lastDate: DateTime(now.year - 10),
      builder: (ctx, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: const ColorScheme.dark(primary: Color(0xFFE86EAD), surface: Color(0xFF1A0A2E)),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        _dob = picked;
        _zodiac = _calcZodiac(picked);
        _lifePath = _calcLifePath(picked);
        _card = null;
      });
    }
  }

  Future<void> _doReading() async {
    if (_dob == null || _questionIdx == null) return;
    setState(() { _loading = true; _card = null; });
    try {
      final raw = await ApiService.drawTarot('NEUTRAL');
      setState(() {
        _card = {
          'cardName': (raw['cardName'] ?? raw['name'] ?? 'Soul Mirror').toString(),
          'emoji':    (raw['emoji']   ?? '🔮').toString(),
          'message':  (raw['message'] ?? '').toString(),
          'advice':   (raw['advice']  ?? '').toString(),
        };
        _loading = false;
      });
    } catch (_) {
      final idx = math.Random().nextInt(_fallbackCards.length);
      final f = _fallbackCards[idx];
      setState(() {
        _card = {'cardName': f['cardName']!, 'emoji': f['emoji']!, 'message': f['message']!, 'advice': f['advice']!};
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = _themes[_themeIdx];
    final questions = theme['questions'] as List;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('🌌 Bản Đồ Vũ Trụ',
              style: GoogleFonts.lora(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 6),
          Text('Kết hợp Tarot · Cung hoàng đạo · Số chủ đạo để phân tích con đường của bạn.',
              style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 13)),
          const SizedBox(height: 24),

          // ── Birth date ──────────────────────────────────────────────────
          GlassPanel(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              const Text('🎂', style: TextStyle(fontSize: 28)),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Ngày sinh của bạn', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                const SizedBox(height: 4),
                Text(
                  _dob == null ? 'Chưa chọn' : '${_dob!.day}/${_dob!.month}/${_dob!.year}',
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ])),
              GestureDetector(
                onTap: _pickDate,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE86EAD).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE86EAD).withOpacity(0.4)),
                  ),
                  child: const Text('Chọn', style: TextStyle(color: Color(0xFFE86EAD), fontWeight: FontWeight.w600)),
                ),
              ),
            ]),
          ),

          // ── Zodiac profile ──────────────────────────────────────────────
          if (_zodiac != null) ...[
            const SizedBox(height: 16),
            GlassPanel(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(_zodiacData[_zodiac!]!['emoji']!, style: const TextStyle(fontSize: 32)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_zodiac!, style: GoogleFonts.lora(color: const Color(0xFFC9A84C), fontSize: 20, fontWeight: FontWeight.bold)),
                    Text(_zodiacData[_zodiac!]!['element']!, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                  ])),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4ECDC4).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text('Số chủ đạo: $_lifePath',
                        style: const TextStyle(color: Color(0xFF4ECDC4), fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                ]),
                const SizedBox(height: 10),
                Text(_zodiacData[_zodiac!]!['trait']!,
                    style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 13, height: 1.5)),
              ]),
            ),
          ],

          const SizedBox(height: 20),

          // ── Theme selector ──────────────────────────────────────────────
          Text('Chọn chủ đề bạn muốn khám phá:',
              style: TextStyle(color: Colors.white.withOpacity(0.85), fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(_themes.length, (i) {
                final sel = i == _themeIdx;
                final t = _themes[i];
                return GestureDetector(
                  onTap: () => setState(() { _themeIdx = i; _questionIdx = null; _card = null; }),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: sel ? const Color(0xFFE86EAD).withOpacity(0.2) : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: sel ? const Color(0xFFE86EAD) : Colors.white.withOpacity(0.12)),
                    ),
                    child: Row(children: [
                      Text(t['icon'] as String, style: const TextStyle(fontSize: 18)),
                      const SizedBox(width: 6),
                      Text(t['label'] as String, style: TextStyle(color: sel ? Colors.white : Colors.white60, fontWeight: FontWeight.w500, fontSize: 13)),
                    ]),
                  ),
                );
              }),
            ),
          ),

          const SizedBox(height: 20),

          // ── Questions ───────────────────────────────────────────────────
          Text('Câu hỏi bạn muốn khám phá:',
              style: TextStyle(color: Colors.white.withOpacity(0.85), fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 10),
          ...List.generate(questions.length, (i) {
            final sel = i == _questionIdx;
            return GestureDetector(
              onTap: () => setState(() { _questionIdx = i; _card = null; }),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: sel ? const Color(0xFF4ECDC4).withOpacity(0.12) : Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: sel ? const Color(0xFF4ECDC4) : Colors.white.withOpacity(0.1)),
                ),
                child: Row(children: [
                  Text(sel ? '✦' : '○', style: TextStyle(color: sel ? const Color(0xFF4ECDC4) : Colors.white38, fontSize: 16)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(questions[i] as String,
                      style: TextStyle(color: sel ? Colors.white : Colors.white70, fontSize: 13, height: 1.4))),
                ]),
              ),
            );
          }),

          const SizedBox(height: 20),

          // ── CTA ─────────────────────────────────────────────────────────
          CosmicButton(
            label: _dob == null
                ? 'Vui lòng chọn ngày sinh trước'
                : _questionIdx == null
                    ? 'Chọn một câu hỏi để bắt đầu'
                    : '🔮  Nhận phân tích vũ trụ',
            isLoading: _loading,
            onTap: (_dob != null && _questionIdx != null && !_loading) ? _doReading : null,
          ),

          // ── Result ──────────────────────────────────────────────────────
          if (_card != null) ...[
            const SizedBox(height: 24),
            _buildResult(_card!),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildResult(Map<String, String> card) {
    final question = (_themes[_themeIdx]['questions'] as List)[_questionIdx!] as String;
    final cardName = card['cardName'] ?? 'Soul Mirror';
    final message  = card['message']  ?? '';
    final advice   = card['advice']   ?? '';

    return GlassPanel(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Row(children: [
          Text(_zodiacData[_zodiac!]!['emoji']!, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 8),
          const Text('✕', style: TextStyle(color: Colors.white38)),
          const SizedBox(width: 8),
          const Text('🔮', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 10),
          Expanded(child: Text('Phân tích vũ trụ cho bạn',
              style: GoogleFonts.lora(color: const Color(0xFFC9A84C), fontSize: 16, fontWeight: FontWeight.bold))),
        ]),
        const SizedBox(height: 14),

        // Question context
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.04),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text((_themes[_themeIdx]['icon'] as String), style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Expanded(child: Text('"$question"',
                style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12, fontStyle: FontStyle.italic, height: 1.5))),
          ]),
        ),
        const SizedBox(height: 16),

        // Card name
        Center(child: Text('✨ $_zodiac × $cardName ✨',
            style: GoogleFonts.lora(color: const Color(0xFFC9A84C), fontSize: 16, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center)),
        const SizedBox(height: 14),

        // Combined analysis
        Text(
          _buildCombinedAnalysis(cardName, message),
          style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.75),
          textAlign: TextAlign.justify,
        ),

        if (advice.isNotEmpty) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF4ECDC4).withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF4ECDC4).withOpacity(0.25)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('💫 Bước tiếp theo của bạn:', style: TextStyle(color: const Color(0xFF4ECDC4), fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 6),
              Text(advice, style: TextStyle(color: const Color(0xFF4ECDC4).withOpacity(0.9), fontSize: 13, height: 1.5)),
            ]),
          ),
        ],

        const SizedBox(height: 14),
        Text('🌟 Số chủ đạo $_lifePath × $_zodiac = $_lifePathInsight',
            style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12, fontStyle: FontStyle.italic, height: 1.5)),
      ]),
    );
  }

  String _buildCombinedAnalysis(String cardName, String message) {
    final z = _zodiac ?? '';
    final trait = _zodiacData[z]?['trait'] ?? '';
    return 'Với bản chất $z — $trait — lá bài $cardName hôm nay mang đến một thông điệp đặc biệt dành riêng cho bạn:\n\n'
           '$message\n\n'
           'Sự kết hợp giữa năng lượng $z và thông điệp từ $cardName cho thấy đây là thời điểm quan trọng để bạn lắng nghe chính mình và hành động có chủ đích.';
  }

  String get _lifePathInsight {
    const insights = {
      1:  'Người tiên phong — hãy dẫn đầu với sự tự tin',
      2:  'Người hòa giải — sức mạnh nằm ở sự hợp tác',
      3:  'Người sáng tạo — hãy biểu đạt bản thân',
      4:  'Người xây dựng — sự bền vững là nền tảng của bạn',
      5:  'Người tự do — thay đổi là nguồn năng lượng của bạn',
      6:  'Người chăm sóc — tình yêu là sứ mệnh của bạn',
      7:  'Người tìm kiếm — tri thức dẫn lối cho bạn',
      8:  'Người thành công — quyền năng và thịnh vượng đang đến',
      9:  'Người nhân văn — sự cống hiến là ý nghĩa cuộc đời bạn',
      11: 'Số chủ đạo — trực giác của bạn là món quà đặc biệt',
      22: 'Nhà kiến trúc vũ trụ — bạn sinh ra để tạo dựng điều lớn lao',
    };
    return insights[_lifePath] ?? 'Con số đặc biệt mang năng lượng độc nhất';
  }
}
