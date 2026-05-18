import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';
import '../services/api_service.dart';

class JournalScreen extends StatefulWidget {
  const JournalScreen({super.key});
  @override
  State<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends State<JournalScreen> {
  bool _writing = false;
  final _textCtrl = TextEditingController();
  List<dynamic> _entries = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadJournals();
  }

  Future<void> _loadJournals() async {
    setState(() => _loading = true);
    final data = await ApiService.getJournals();
    if (mounted) setState(() { _entries = data; _loading = false; });
  }

  Future<void> _submitEntry() async {
    if (_textCtrl.text.trim().isEmpty) return;
    await ApiService.saveJournal(_textCtrl.text, 'Good', 'Bad', 'Change');
    _textCtrl.clear();
    setState(() => _writing = false);
    _loadJournals();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
          child: Row(
            children: [
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Nhật ký', style: GoogleFonts.lora(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                  Text('Ghi lại hành trình nội tâm của bạn', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
                ],
              )),
              GestureDetector(
                onTap: () => setState(() => _writing = !_writing),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE86EAD).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE86EAD).withOpacity(0.4)),
                  ),
                  child: Icon(_writing ? Icons.close : Icons.add, color: const Color(0xFFE86EAD), size: 22),
                ),
              ),
            ],
          ),
        ),

        if (_writing) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: GlassPanel(
              child: Column(
                children: [
                  const _EveningQuestions(),
                  const SizedBox(height: 14),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: TextField(
                      controller: _textCtrl,
                      maxLines: 5,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Viết tự do về cảm xúc của bạn hôm nay...',
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  CosmicButton(label: 'Lưu nhật ký hôm nay', onTap: _submitEntry),
                ],
              ),
            ),
          ),
        ],

        const SizedBox(height: 20),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Text('Hành trình của bạn', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, fontWeight: FontWeight.w600))),
        const SizedBox(height: 12),

        Expanded(
          child: _loading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFE86EAD)))
            : ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _entries.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => _JournalCard(entry: _entries[i] as Map<String, dynamic>),
              ),
        ),
      ],
    );
  }
}

class _EveningQuestions extends StatefulWidget {
  const _EveningQuestions();
  @override
  State<_EveningQuestions> createState() => _EveningQuestionsState();
}

class _EveningQuestionsState extends State<_EveningQuestions> {
  final _qs = ['Điều tốt nhất xảy ra hôm nay là gì?', 'Điều gì khiến bạn cảm thấy khó khăn?', 'Ngày mai bạn muốn thay đổi điều gì?'];
  int _idx = 0;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Text('💭  ${_qs[_idx]}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13))),
        IconButton(icon: const Icon(Icons.refresh, color: Color(0xFF4ECDC4), size: 18), onPressed: () => setState(() => _idx = (_idx + 1) % _qs.length)),
      ],
    );
  }
}

class _JournalCard extends StatelessWidget {
  final Map<String, dynamic> entry;
  const _JournalCard({required this.entry});

  String _weekdayVi(int w) {
    const days = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    return days[w];
  }

  @override
  Widget build(BuildContext context) {
    final dt = DateTime.tryParse(entry['createdAt'] ?? '')?.toLocal();
    final card = entry['tarotCardName'];
    final content = (entry['content'] ?? '') as String;
    final preview = content.length > 80 ? '${content.substring(0, 80)}...' : content;
    final mood = entry['moodEmoji'] ?? '😌';

    return GlassPanel(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: mood + date/time
          Row(children: [
            Text(mood, style: const TextStyle(fontSize: 28)),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (dt != null) ...[
                  Text(
                    '${_weekdayVi(dt.weekday)}, ${dt.day.toString().padLeft(2,'0')}/${dt.month.toString().padLeft(2,'0')}/${dt.year}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  Text(
                    '🕐 ${dt.hour.toString().padLeft(2,'0')}:${dt.minute.toString().padLeft(2,'0')}',
                    style: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 11),
                  ),
                ] else
                  Text('--/--/----', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
              ],
            )),
            if (card != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: const Color(0xFFC9A84C).withOpacity(0.12),
                  border: Border.all(color: const Color(0xFFC9A84C).withOpacity(0.3)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.auto_awesome, size: 10, color: Color(0xFFC9A84C)),
                  const SizedBox(width: 4),
                  Text(card, style: const TextStyle(color: Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.w600)),
                ]),
              ),
          ]),
          if (preview.isNotEmpty) ...[
            const SizedBox(height: 10),
            Divider(color: Colors.white.withOpacity(0.07), height: 1),
            const SizedBox(height: 10),
            Text(preview, style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 13, height: 1.55)),
          ],
        ],
      ),
    );
  }
}
