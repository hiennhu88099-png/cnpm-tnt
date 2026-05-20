import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String baseUrl = 'http://localhost:8081/api/v1';

class ApiService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, dynamic>> drawTarot(String moodLevel, [String description = ""]) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/tarot/draw'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'currentMood': moodLevel, 
        'numberOfCards': 1,
        'description': description
      }),
    ).timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      try {
        final Map<String, dynamic> err = jsonDecode(response.body);
        if (err.containsKey('error')) {
          throw Exception(err['error']);
        }
      } catch (_) {}
      throw Exception('Không thể kết nối đến vũ trụ. Vui lòng thử lại sau.');
    }
  }

  static Future<void> saveMood(String moodLevel, String note) async {
    final token = await _getToken();
    await http.post(
      Uri.parse('$baseUrl/moods'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'moodLevel': moodLevel, 'note': note}),
    );
  }

  static Future<void> saveJournal(String content, String q1, String q2, String q3) async {
    final token = await _getToken();
    await http.post(
      Uri.parse('$baseUrl/journals'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'content': content,
        'q1BestThing': q1,
        'q2Challenge': q2,
        'q3TomorrowChange': q3,
      }),
    );
  }

  static Future<List<dynamic>> getJournals() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/journals'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<List<dynamic>> getConnections() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/connections/discover'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<void> pokeUser(String soulId) async {
    final token = await _getToken();
    await http.post(
      Uri.parse('$baseUrl/connections/poke/$soulId'),
      headers: {'Authorization': 'Bearer $token'},
    );
  }

  static Future<Map<String, dynamic>?> getProfileStats() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/profile/stats'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  static Future<String> chat(String message, String history) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/tarot/chat'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'message': message,
        'history': history,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['response'] ?? 'Không thể nhận phản hồi từ Cosmic Guide.';
    } else {
      throw Exception('Lỗi trò chuyện: ${response.statusCode}');
    }
  }

  static Future<List<dynamic>> getRealMessages(String soulId) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/messages/$soulId'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<Map<String, dynamic>> sendRealMessage(String soulId, String content) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/messages/$soulId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'content': content}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Lỗi gửi tin nhắn');
    }
  }

  static Future<Map<String, dynamic>> getNatalChart({
    required int day,
    required int month,
    required int year,
    required int hour,
    required int minute,
    required String birthPlace,
  }) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/astrology/natal-chart'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'day': day,
        'month': month,
        'year': year,
        'hour': hour,
        'minute': minute,
        'birthPlace': birthPlace,
      }),
    ).timeout(const Duration(seconds: 45));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Không thể lập bản đồ sao từ vũ trụ.');
    }
  }

  static Future<Map<String, dynamic>> getCachedNatalChart() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/astrology/natal-chart'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Không thể lấy bản đồ sao đã lưu.');
    }
  }
}
