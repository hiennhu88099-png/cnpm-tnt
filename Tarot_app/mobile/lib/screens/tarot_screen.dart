import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;
import '../widgets/cosmic_widgets.dart';
import '../services/api_service.dart';
import 'cosmic_reading_screen.dart';

const _fallbackCards = [
  { 'cardName': 'The Fool', 'emoji': '🌟',
    'message': 'Hôm nay, vũ trụ mời bạn đứng tại ngưỡng cửa của một cuộc phiêu lưu mới. The Fool là người dũng cảm nhất, đủ can đảm để tin vào điều chưa nhìn thấy. Hãy bước đi với trái tim rộng mở, buông bỏ nỗi sợ hãi. Mọi hành trình vĩ đại đều bắt đầu từ một bước chân không chắc chắn — nhưng đầy hy vọng.',
    'advice': 'Đừng chờ đến khi mọi thứ hoàn hảo. Hãy bắt đầu ngay hôm nay, dù chỉ là một bước nhỏ.' },
  { 'cardName': 'The Magician', 'emoji': '🪄',
    'message': 'Vũ trụ đang trao cho bạn mọi công cụ cần thiết để kiến tạo thực tại của riêng mình. Bạn có trí tuệ, kỹ năng và nguồn năng lượng vô tận. Đừng nghi ngờ năng lực bản thân nữa. Đây là thời điểm vạn vật đồng điệu để ủng hộ bạn biến ý tưởng thành hiện thực.',
    'advice': 'Hãy hành động một cách tự tin. Khả năng làm chủ cuộc sống đang nằm trong tay bạn.' },
  { 'cardName': 'The High Priestess', 'emoji': '🔮',
    'message': 'Bà ngồi yên lặng tại ngưỡng cửa nội tâm. Hôm nay, vũ trụ nhắc bạn rằng câu trả lời đã có sẵn bên trong bạn từ lâu, nhưng tiếng ồn của cuộc sống đang che lấp nó. Hãy lắng nghe trực giác — đó chính là sự thật thuần khiết nhất.',
    'advice': 'Dành 10 phút trong yên lặng hoàn toàn. Không điện thoại, chỉ bạn và hơi thở của mình.' },
  { 'cardName': 'The Empress', 'emoji': '🌸',
    'message': 'Năng lượng của Đất Mẹ đang ôm ấp bạn. Đây là thời kỳ của sự sinh sôi, nuôi dưỡng và cái đẹp. Dù là một dự án mới, một mối quan hệ hay chính tâm hồn bạn, mọi thứ đang đơm hoa kết trái. Hãy đón nhận tình yêu thương một cách tự nhiên nhất.',
    'advice': 'Chăm sóc bản thân và những người xung quanh bằng sự dịu dàng và lòng trắc ẩn.' },
  { 'cardName': 'The Emperor', 'emoji': '👑',
    'message': 'Sự hỗn loạn đang cần được đưa vào trật tự. Năng lượng của The Emperor mang lại sức mạnh của sự kỷ luật, bảo vệ và nền tảng vững chắc. Vũ trụ khuyên bạn hãy làm chủ cảm xúc, thiết lập ranh giới rõ ràng và có trách nhiệm với con đường của mình.',
    'advice': 'Lập kế hoạch cụ thể cho mục tiêu của bạn và kiên định theo đuổi nó từng bước một.' },
  { 'cardName': 'The Hierophant', 'emoji': '📜',
    'message': 'Có những bài học sâu sắc đang chờ bạn thông qua truyền thống, người thầy hoặc hệ thống niềm tin cốt lõi. Đây không phải lúc để nổi loạn, mà là lúc để tìm kiếm sự thông thái từ những giá trị được thử thách qua thời gian. Một bậc thầy đang xuất hiện trong đời bạn.',
    'advice': 'Hãy cởi mở học hỏi từ người có kinh nghiệm hoặc tìm đến những triết lý tâm linh lâu đời.' },
  { 'cardName': 'The Lovers', 'emoji': '💞',
    'message': 'Một sự kết nối sâu sắc đang được kích hoạt — có thể là với một người khác, hoặc sự hòa hợp giữa các mặt đối lập bên trong chính bạn. The Lovers cũng báo hiệu một ngã rẽ quan trọng. Bạn phải lựa chọn dựa trên những giá trị chân thật nhất của trái tim mình.',
    'advice': 'Đưa ra quyết định từ tình yêu, không phải từ nỗi sợ. Hãy chọn con đường phản chiếu linh hồn bạn.' },
  { 'cardName': 'The Chariot', 'emoji': '🐎',
    'message': 'Bạn đang nắm giữ dây cương của cuộc đời mình. Xung đột và sự mâu thuẫn có thể tồn tại, nhưng với ý chí mạnh mẽ và sự tập trung cao độ, bạn sẽ tiến lên phía trước. Đừng để những yếu tố xao nhãng đánh gục sự kiên định của bạn. Thắng lợi đang ở rất gần.',
    'advice': 'Tập trung toàn bộ năng lượng vào mục tiêu lớn nhất. Đừng chùn bước trước trở ngại.' },
  { 'cardName': 'Strength', 'emoji': '🦁',
    'message': 'Sức mạnh thực sự không đến từ cơ bắp — nó đến từ lòng trắc ẩn và sự nhẫn nại. Người phụ nữ không đánh nhau với sư tử, bà thuần phục nó bằng tình yêu vô điều kiện. Bạn cũng vậy, hãy dùng sự mềm mỏng để đối mặt với thử thách gai góc nhất.',
    'advice': 'Hãy bao dung với những khiếm khuyết của bản thân và tiếp cận tình huống bằng sự thấu hiểu.' },
  { 'cardName': 'The Hermit', 'emoji': '🏮',
    'message': 'The Hermit chọn con đường đơn độc vì ông hiểu câu trả lời nằm trong tĩnh lặng. Chiếc đèn lồng ông cầm soi sáng con đường của chính ông. Đã đến lúc bạn lùi lại khỏi tiếng ồn, rút lui vào thế giới nội tâm để tìm kiếm ánh sáng của riêng mình.',
    'advice': 'Hãy dành không gian riêng tư tuyệt đối cho bản thân để chiêm nghiệm lại chặng đường vừa qua.' },
  { 'cardName': 'Wheel of Fortune', 'emoji': '🎡',
    'message': 'Bánh xe vận mệnh không ngừng quay — đó là vô thường. Nếu bạn đang ở đáy, bánh xe sẽ mang bạn lên cao. Nếu ở đỉnh, hãy trân trọng và đừng chủ quan. Mỗi sự xoay chuyển đều mang đến một cơ hội ẩn giấu, định mệnh đang can thiệp để đưa bạn về đúng hướng.',
    'advice': 'Đừng cố chống lại dòng chảy. Hãy bình thản đón nhận sự thay đổi và tìm kiếm cơ hội trong đó.' },
  { 'cardName': 'Justice', 'emoji': '⚖️',
    'message': 'Cán cân của vũ trụ luôn khao khát sự thăng bằng. Bất kỳ hành động hay quyết định nào trong quá khứ giờ đây đang mang lại kết quả tương xứng. Sự thật sẽ được phơi bày. Hãy sống trung thực với lương tâm, bởi nhân quả là quy luật không thể bẻ cong.',
    'advice': 'Hãy cân nhắc kỹ càng mọi khía cạnh và hành xử một cách công bằng nhất, trước hết là với chính mình.' },
  { 'cardName': 'The Hanged Man', 'emoji': '🧘',
    'message': 'Sự bế tắc hiện tại không phải là sự trừng phạt — nó là cơ hội để bạn nhìn nhận thế giới từ một góc độ hoàn toàn khác. Đôi khi sự buông bỏ, ngừng kiểm soát lại là cách giải quyết tốt nhất. Hãy tận dụng khoảng thời gian "treo lơ lửng" này để thức tỉnh nội tâm.',
    'advice': 'Ngừng kháng cự. Hãy buông xuôi và thay đổi góc nhìn về vấn đề bạn đang gặp phải.' },
  { 'cardName': 'Death', 'emoji': '🦋',
    'message': 'Đừng sợ hãi — Death hiếm khi mang nghĩa cái chết vật lý, mà là sự biến đổi sâu sắc. Một chu kỳ cũ đang kết thúc để nhường chỗ cho chương mới rực rỡ hơn. Bạn phải rũ bỏ lớp vỏ cũ kỹ, dù đau đớn, để có thể tái sinh như một con bướm phá kén bay lên.',
    'advice': 'Dũng cảm khép lại những gì không còn phục vụ cho sự phát triển của bạn nữa.' },
  { 'cardName': 'Temperance', 'emoji': '🕊️',
    'message': 'Năng lượng của sự pha trộn, kiên nhẫn và thuật giả kim tâm hồn đang đến với bạn. Bạn đang học cách kết hợp những mảng đối lập để tạo ra sự bình yên tĩnh tại. Đừng vội vã, mọi thứ đang hòa quyện lại với nhau một cách hoàn hảo theo đúng trình tự thiêng liêng.',
    'advice': 'Tránh những hành động cực đoan. Hãy đi tìm điểm cân bằng và sự hài hòa trong tâm trí.' },
  { 'cardName': 'The Devil', 'emoji': '⛓️',
    'message': 'Ảo ảnh, sự trói buộc và những thói quen độc hại đang kéo bạn xuống. Bạn cảm thấy mình bị mắc kẹt, nhưng sự thật là chiếc xích trên cổ bạn rất lỏng lẻo — bạn có thể bước ra bất cứ lúc nào nếu đủ dũng khí đối mặt với phần "bóng tối" (shadow self) của mình.',
    'advice': 'Nhận diện điều gì đang thao túng hoặc làm bạn phụ thuộc, và chủ động cắt đứt mối dây đó.' },
  { 'cardName': 'The Tower', 'emoji': '🌩️',
    'message': 'Một tia chớp đánh sập tòa tháp được xây trên nền móng mục nát. Những sự thay đổi đột ngột và đổ vỡ có thể khiến bạn choáng váng. Nhưng hãy nhớ, vũ trụ chỉ phá hủy sự giả dối để bạn có cơ hội xây lại sự thật vững chắc hơn. Ánh sáng đang ùa vào những vết nứt.',
    'advice': 'Đừng cố níu kéo những thứ đang sụp đổ. Hãy dọn dẹp tàn tích và sẵn sàng xây dựng lại từ đầu.' },
  { 'cardName': 'The Star', 'emoji': '⭐',
    'message': 'Sau mọi cơn bão, The Star xuất hiện như lời hứa thiêng liêng từ vũ trụ. Bạn đang được tắm trong năng lượng của sự chữa lành, thanh tẩy và hy vọng thuần khiết. Những vết thương đang khép miệng. Cứ tin tưởng bước đi, các vì sao đang soi rọi con đường bạn.',
    'advice': 'Nuôi dưỡng niềm tin bất diệt. Sự phục hồi không phải là yếu đuối — đó là sức mạnh tối thượng.' },
  { 'cardName': 'The Moon', 'emoji': '🌙',
    'message': 'Ánh trăng huyền bí làm mọi thứ trở nên mờ ảo. Không phải sự thật nào cũng lộ diện ngay. Có những điều ẩn giấu trong tiềm thức đang chực chờ bộc lộ. Hãy tin vào cảm nhận sâu thẳm, nhưng đừng để bóng tối của ảo tưởng làm bạn sợ hãi hay lạc lối.',
    'advice': 'Lắng nghe trực giác và chú ý đến những giấc mơ của bạn trong thời gian này.' },
  { 'cardName': 'The Sun', 'emoji': '☀️',
    'message': 'The Sun mang đến năng lượng huy hoàng, niềm vui thuần khiết và sự thành công rực rỡ. Đám mây u ám đã tan biến. Bạn đang ở trong đỉnh cao của sức sống và sự tự tin. Hãy lan tỏa sự rạng rỡ này, thế giới xung quanh đang cần hơi ấm từ bạn.',
    'advice': 'Hãy tận hưởng niềm hạnh phúc hiện tại và làm những điều khiến trái tim bạn hát ca.' },
  { 'cardName': 'Judgement', 'emoji': '📯',
    'message': 'Tiếng kèn thức tỉnh vang lên, kêu gọi bạn vươn lên một phiên bản cao cấp hơn của linh hồn mình. Quá khứ đã khép lại, mọi lỗi lầm đều được ân xá. Bạn đang đứng trước khoảnh khắc của sự giác ngộ và thấu hiểu sâu sắc mục đích sống thực sự của mình.',
    'advice': 'Lắng nghe tiếng gọi từ nội tâm và sẵn sàng bước sang một trang mới thanh tẩy và nhẹ nhàng hơn.' },
  { 'cardName': 'The World', 'emoji': '🌍',
    'message': 'Một chu kỳ vĩ đại đã hoàn tất một cách trọn vẹn. Bạn đã đi một chặng đường dài, vượt qua mọi bài học mà vũ trụ thử thách. Giờ đây, bạn là một thể thống nhất, tự do và viên mãn. Hãy ăn mừng sự trưởng thành này trước khi bắt đầu một vòng lặp mới ở tầng mức cao hơn.',
    'advice': 'Hãy tự hào về những gì bạn đã đạt được. Bạn hoàn toàn xứng đáng với sự bình an này.' },
];

// ─── Asset lookup map ────────────────────────────────────────────────────────
const _assetMap = <String, String>{
  'the fool'           : 'the_fool',
  'the high priestess' : 'the_high_priestess',
  'the moon'           : 'the_moon',
  'the star'           : 'the_star',
  'the sun'            : 'the_sun',
  'wheel of fortune'   : 'wheel_of_fortune',
  // Vietnamese names
  'kẻ khờ'            : 'the_fool',
  'nữ tư tế'          : 'the_high_priestess',
  'vầng trăng'        : 'the_moon',
  'ngôi sao'          : 'the_star',
  'mặt trời'          : 'the_sun',
  'bánh xe vận mệnh'  : 'wheel_of_fortune',
};

// ─── Mood list ───────────────────────────────────────────────────────────────
const _moods = [
  {'emoji': '😊', 'label': 'Vui vẻ',   'value': 'GOOD'},
  {'emoji': '😌', 'label': 'Bình yên', 'value': 'NEUTRAL'},
  {'emoji': '😔', 'label': 'Buồn bã',  'value': 'LOW'},
  {'emoji': '😤', 'label': 'Lo lắng',  'value': 'VERY_LOW'},
  {'emoji': '😞', 'label': 'Kiệt sức', 'value': 'VERY_LOW'},
];

// ─── Screen ──────────────────────────────────────────────────────────────────
// ─── Outer wrapper with internal tabs ────────────────────────────────────────
class TarotScreen extends StatefulWidget {
  const TarotScreen({super.key});
  @override
  State<TarotScreen> createState() => _TarotScreenState();
}

class _TarotScreenState extends State<TarotScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Internal tab bar ─────────────────────────────────────────────
        Container(
          margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Row(children: [
            _TabBtn(label: '🔮 Rút lá bài', selected: _tab == 0, onTap: () => setState(() => _tab = 0)),
            _TabBtn(label: '🌌 Bản đồ Vũ Trụ', selected: _tab == 1, onTap: () => setState(() => _tab = 1)),
          ]),
        ),
        Expanded(
          child: _tab == 0 ? const _SingleCardTab() : const CosmicReadingScreen(),
        ),
      ],
    );
  }
}

class _TabBtn extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _TabBtn({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFFE86EAD).withOpacity(0.25) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? Colors.white : Colors.white38,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Single Card Draw Tab ─────────────────────────────────────────────────────
class _SingleCardTab extends StatefulWidget {
  const _SingleCardTab();
  @override
  State<_SingleCardTab> createState() => _SingleCardTabState();
}

class _SingleCardTabState extends State<_SingleCardTab>
    with SingleTickerProviderStateMixin {
  int? _selectedMood;

  // Always null-safe: either from API or null
  Map<String, String>? _card;

  bool _isDrawing = false;
  late AnimationController _flipCtrl;
  late Animation<double> _flipAnim;
  final TextEditingController _problemCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _card = null;
    _isDrawing = false;
    _flipCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _flipAnim = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _flipCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _flipCtrl.dispose();
    _problemCtrl.dispose();
    super.dispose();
  }

  // ── Safely normalize any API response or fallback into Map<String,String> ──
  Map<String, String> _normalise(Map<String, dynamic> raw) {
    final name = (raw['cardName'] ?? raw['name'] ?? 'Soul Mirror').toString();
    var message = (raw['message'] ?? '').toString();
    var advice = (raw['advice'] ?? '').toString();
    var emoji = (raw['emoji'] ?? '🔮').toString();

    // The backend might return very short or generic messages (e.g. "Major Arcana").
    // To ensure the user always gets a rich, deep message, we intercept and use our rich local dictionary.
    final localCard = _fallbackCards.cast<Map<String, String>?>().firstWhere(
        (c) {
          final n1 = name.toLowerCase();
          final n2 = c!['cardName']!.toLowerCase();
          if (n1 == n2) return true;
          final a1 = _assetMap[n1];
          final a2 = _assetMap[n2];
          if (a1 != null && a2 != null && a1 == a2) return true;
          return false;
        },
        orElse: () => null);

    if (localCard != null) {
      // Always override with our beautiful long Vietnamese messages
      message = localCard['message']!;
      advice = localCard['advice']!;
      emoji = localCard['emoji']!;
    } else if (message.isEmpty) {
      message = 'Vũ trụ đang gửi tới bạn một thông điệp bí ẩn...';
    }

    return {
      'cardName': name,
      'emoji': emoji,
      'message': message,
      'advice': advice,
    };
  }

  Future<void> _drawCard() async {
    if (_selectedMood == null) return;

    setState(() {
      _isDrawing = true;
      _card = null;
    });
    _flipCtrl.reset();

    await Future.delayed(const Duration(milliseconds: 600));

    try {
      final moodLevel = _moods[_selectedMood!]['value']!;
      final raw = await ApiService.drawTarot(moodLevel);
      final normalised = _normalise(raw);
      setState(() {
        _card = normalised;
        _isDrawing = false;
      });
    } catch (_) {
      // Use fallback local card on API error
      final idx = math.Random().nextInt(_fallbackCards.length);
      final normalised = _normalise(Map<String, dynamic>.from(_fallbackCards[idx]));
      if (mounted) setState(() { _card = normalised; _isDrawing = false; });
      return;
    }

    await Future.delayed(const Duration(milliseconds: 200));
    _flipCtrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ──────────────────────────────────────────────────────
          Text('✨ Tarot Thông Minh',
              style: GoogleFonts.playfairDisplay(
                  fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 6),
          Text('Bài Tarot được chọn dựa trên cảm xúc của bạn hôm nay.',
              style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 13)),
          const SizedBox(height: 24),

          // ── Mood picker ──────────────────────────────────────────────────
          Text('Tôi đang cảm thấy...',
              style: TextStyle(
                  color: Colors.white.withOpacity(0.85),
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(_moods.length, (i) {
              final sel = _selectedMood == i;
              return GestureDetector(
                onTap: () => setState(() => _selectedMood = i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: sel
                            ? const Color(0xFFE86EAD)
                            : Colors.white.withOpacity(0.15)),
                    color: sel
                        ? const Color(0xFFE86EAD).withOpacity(0.18)
                        : Colors.white.withOpacity(0.04),
                  ),
                  child: Column(children: [
                    Text(_moods[i]['emoji']!,
                        style: const TextStyle(fontSize: 22)),
                    const SizedBox(height: 4),
                    Text(_moods[i]['label']!,
                        style: TextStyle(
                            color: sel ? Colors.white : Colors.white54,
                            fontSize: 10)),
                  ]),
                ),
              );
            }),
          ),
          // ── Problem input ────────────────────────────────────────────────
          const SizedBox(height: 16),
          Text('Vấn đề bạn đang gặp phải (Tùy chọn)',
              style: TextStyle(
                  color: Colors.white.withOpacity(0.85),
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
          const SizedBox(height: 12),
          TextField(
            controller: _problemCtrl,
            maxLines: 3,
            style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.5),
            decoration: InputDecoration(
              hintText: 'Ví dụ: Tôi đang phân vân không biết có nên chuyển việc...',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 13),
              filled: true,
              fillColor: Colors.white.withOpacity(0.04),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE86EAD))),
            ),
          ),
          const SizedBox(height: 24),

          // ── Draw button ──────────────────────────────────────────────────
          CosmicButton(
            label: _selectedMood == null
                ? 'Chọn cảm xúc trước'
                : '🔮  Rút lá bài',
            isLoading: _isDrawing,
            onTap: _selectedMood != null && !_isDrawing ? _drawCard : null,
          ),
          const SizedBox(height: 28),

          // ── Loading ──────────────────────────────────────────────────────
          if (_isDrawing)
            Center(
              child: Column(children: [
                const SizedBox(height: 20),
                const CircularProgressIndicator(color: Color(0xFFE86EAD)),
                const SizedBox(height: 16),
                Text('Vũ trụ đang lắng nghe bạn...',
                    style: GoogleFonts.playfairDisplay(
                        color: Colors.white70, fontSize: 16)),
              ]),
            ),

          // ── Card reveal ──────────────────────────────────────────────────
          if (!_isDrawing && _card != null)
            AnimatedBuilder(
              animation: _flipAnim,
              builder: (_, child) {
                final angle = _flipAnim.value * 3.14159;
                return Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001)
                    ..rotateY(angle < 1.57 ? angle : 3.14159 - angle),
                  child: angle < 1.57 ? _buildBack() : child,
                );
              },
              child: _buildFront(_card!),
            ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ── Card back ─────────────────────────────────────────────────────────────
  Widget _buildBack() {
    return GlassPanel(
      padding: const EdgeInsets.all(48),
      child: Center(
        child: Column(children: [
          const Text('🔮', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 12),
          Text('Soul Mirror',
              style: GoogleFonts.playfairDisplay(
                  color: const Color(0xFFC9A84C), fontSize: 22)),
        ]),
      ),
    );
  }

  // ── Card front ────────────────────────────────────────────────────────────
  Widget _buildFront(Map<String, String> card) {
    final name    = card['cardName'] ?? 'Soul Mirror';
    final emoji   = card['emoji']    ?? '🔮';
    final message = card['message']  ?? '';
    final advice  = card['advice']   ?? '';

    final assetKey   = name.toLowerCase();
    final assetFile  = _assetMap[assetKey];
    final hasImage   = assetFile != null;

    return GlassPanel(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // ── Artwork ───────────────────────────────────────────────────
          ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Container(
              width: double.infinity,
              height: 420,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF0D0518), Color(0xFF1A0A2E)],
                ),
                border: Border.all(
                    color: const Color(0xFFC9A84C).withOpacity(0.5),
                    width: 1.5),
                boxShadow: [
                  BoxShadow(
                      color: const Color(0xFFE86EAD).withOpacity(0.25),
                      blurRadius: 32,
                      spreadRadius: 2),
                ],
              ),
              child: hasImage
                  ? Image.asset(
                      'assets/images/tarot/$assetFile.png',
                      fit: BoxFit.contain,
                      alignment: Alignment.center,
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(emoji,
                            style: const TextStyle(fontSize: 72)),
                        const SizedBox(height: 12),
                        Text(name,
                            style: GoogleFonts.playfairDisplay(
                                color: const Color(0xFFC9A84C),
                                fontSize: 20,
                                fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center),
                      ],
                    ),
            ),
          ),

          const SizedBox(height: 16),

          // ── Card name ─────────────────────────────────────────────────
          Text(name,
              style: GoogleFonts.playfairDisplay(
                  color: const Color(0xFFC9A84C),
                  fontSize: 20,
                  fontWeight: FontWeight.bold),
              textAlign: TextAlign.center),

          const SizedBox(height: 16),

          // ── Divider ───────────────────────────────────────────────────
          Row(children: [
            Expanded(child: Divider(color: Colors.white.withOpacity(0.12))),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text('✨  Thông điệp từ vũ trụ',
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 11,
                      letterSpacing: 1.2)),
            ),
            Expanded(child: Divider(color: Colors.white.withOpacity(0.12))),
          ]),

          const SizedBox(height: 12),

          // ── Message & Problem Context ──────────────────────────────────
          if (_problemCtrl.text.trim().isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('💭', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('Vấn đề của bạn: "${_problemCtrl.text.trim()}"',
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                            height: 1.5)),
                  ),
                ],
              ),
            ),
            Text('Năng lượng của $name gửi đến bạn:',
                style: GoogleFonts.playfairDisplay(
                    color: const Color(0xFFC9A84C),
                    fontWeight: FontWeight.bold,
                    fontSize: 15)),
            const SizedBox(height: 8),
          ],
          
          Text(message,
              style: const TextStyle(
                  color: Colors.white, fontSize: 14, height: 1.75),
              textAlign: TextAlign.justify),

          // ── Advice / Solution box ───────────────────────────────────────
          if (advice.isNotEmpty) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF4ECDC4).withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: const Color(0xFF4ECDC4).withOpacity(0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lightbulb_outline, color: Color(0xFF4ECDC4), size: 18),
                      const SizedBox(width: 8),
                      Text(
                        _problemCtrl.text.trim().isNotEmpty 
                            ? 'Hướng giải quyết cho vấn đề của bạn:' 
                            : 'Hướng giải quyết từ vũ trụ:',
                        style: const TextStyle(
                            color: Color(0xFF4ECDC4),
                            fontWeight: FontWeight.bold,
                            fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(advice,
                      style: TextStyle(
                          color: const Color(0xFF4ECDC4).withOpacity(0.9),
                          fontSize: 13,
                          height: 1.55)),
                ],
              ),
            ),
          ],

          const SizedBox(height: 20),
          CosmicOutlineButton(
            label: '📓  Ghi vào nhật ký',
            onTap: () => _showJournalDialog(context, name, message),
          ),
        ],
      ),
    );
  }

  // ── Journal dialog ────────────────────────────────────────────────────────
  void _showJournalDialog(BuildContext ctx, String cardName, String message) {
    final ctrl = TextEditingController(
      text: '🔮 Lá bài hôm nay: $cardName\n\n'
            'Thông điệp: $message\n\n'
            'Cảm nhận của tôi: ',
    );
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1A0A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('📓 Ghi vào nhật ký',
            style: GoogleFonts.playfairDisplay(color: Colors.white, fontSize: 18)),
        content: SizedBox(
          width: 400,
          child: TextField(
            controller: ctrl,
            maxLines: 8,
            style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.6),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Hủy', style: TextStyle(color: Colors.white.withOpacity(0.5))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE86EAD),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await ApiService.saveJournal(ctrl.text, 'Tarot: $cardName', '', '');
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: const Color(0xFF1A0A2E),
                    content: Row(children: [
                      const Text('✅ ', style: TextStyle(fontSize: 16)),
                      Text('Đã lưu vào nhật ký!',
                          style: TextStyle(color: Colors.white.withOpacity(0.9))),
                    ]),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            },
            child: const Text('Lưu lại', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
