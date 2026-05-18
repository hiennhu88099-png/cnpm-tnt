import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String baseUrl = 'http://localhost:8081/api/v1';

class ApiService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, dynamic>> drawTarot(String moodLevel) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/tarot/draw'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'currentMood': moodLevel, 'numberOfCards': 1}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Không thể rút bài: ${response.statusCode}');
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
}
