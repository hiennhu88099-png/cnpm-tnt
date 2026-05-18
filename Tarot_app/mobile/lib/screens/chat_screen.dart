import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/cosmic_widgets.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _ctrl = TextEditingController();
  final List<Map<String, String>> _messages = [
    {
      'role': 'ai',
      'text': 'Chào bạn, mình là Cosmic Guide - người bạn đồng hành tâm linh của bạn. Hôm nay bạn cảm thấy thế nào? Hãy chia sẻ với mình nhé, mình luôn ở đây để lắng nghe.'
    }
  ];
  bool _isTyping = false;

  void _sendMessage() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    
    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _isTyping = true;
    });
    _ctrl.clear();

    // Giả lập độ trễ của AI để tạo cảm giác tự nhiên (ít tốn chi phí vì xử lý local/tĩnh trước khi tích hợp API thật)
    await Future.delayed(const Duration(seconds: 2));

    final aiResponse = _generateEmpathicResponse(text);
    
    if (mounted) {
      setState(() {
        _isTyping = false;
        _messages.add({'role': 'ai', 'text': aiResponse});
      });
    }
  }

  // Một hàm phân tích cảm xúc đơn giản (hoàn toàn miễn phí, chạy trên máy khách)
  String _generateEmpathicResponse(String input) {
    input = input.toLowerCase();
    if (input.contains('buồn') || input.contains('mệt') || input.contains('chán')) {
      return 'Mình cảm nhận được sự mệt mỏi trong lời nói của bạn. Vũ trụ luôn có chu kỳ của nó, và nỗi buồn này cũng chỉ là một đám mây bay ngang qua. Hãy cho phép bản thân được nghỉ ngơi nhé. Bạn không đơn độc đâu.';
    } else if (input.contains('vui') || input.contains('hạnh phúc') || input.contains('tuyệt')) {
      return 'Thật tuyệt vời! Năng lượng tích cực của bạn đang tỏa sáng rực rỡ. Hãy giữ gìn tần số rung động này và lan tỏa nó đến xung quanh nhé. Cảm ơn bạn đã chia sẻ niềm vui này với mình.';
    } else if (input.contains('cô đơn') || input.contains('một mình')) {
      return 'Sự tĩnh lặng đôi khi khiến ta cảm thấy trống vắng. Nhưng The Hermit trong Tarot dạy chúng ta rằng, sự cô độc chính là lúc để quay vào bên trong và thắp lên ánh sáng của riêng mình. Mình luôn ở đây lắng nghe bạn.';
    } else {
      return 'Mình hiểu những gì bạn đang trải qua. Dù chặng đường phía trước có ra sao, hãy nhớ rằng bạn mang trong mình sức mạnh của các vì sao. Bạn muốn kể thêm chi tiết cho mình nghe không?';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
          child: Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(colors: [Color(0xFFE86EAD), Color(0xFF4ECDC4)]),
                  boxShadow: [BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.3), blurRadius: 10)],
                ),
                child: const Center(child: Text('✨', style: TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Cosmic Guide AI', style: GoogleFonts.lora(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                  Text('Người bạn lắng nghe tâm hồn', style: TextStyle(color: const Color(0xFF4ECDC4).withOpacity(0.8), fontSize: 12)),
                ],
              )),
            ],
          ),
        ),
        
        // Chat Area
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            itemCount: _messages.length + (_isTyping ? 1 : 0),
            itemBuilder: (context, i) {
              if (i == _messages.length) {
                // Typing indicator
                return Align(
                  alignment: Alignment.centerLeft,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text('Cosmic Guide đang cảm nhận...', style: TextStyle(color: Colors.white.withOpacity(0.5), fontStyle: FontStyle.italic, fontSize: 12)),
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
        
        // Input Area
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
                      hintText: 'Nhập tâm sự của bạn...',
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
                    boxShadow: [BoxShadow(color: const Color(0xFFE86EAD).withOpacity(0.3), blurRadius: 8)],
                  ),
                  child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
