import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String baseUrl = 'http://localhost:8081/api/v1';

class AuthService {
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'displayName': displayName,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      await prefs.setString('user', jsonEncode(data));
      return data;
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Đăng ký thất bại');
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      await prefs.setString('user', jsonEncode(data));
      return data;
    } else {
      throw Exception('Email hoặc mật khẩu không chính xác');
    }
  }

  static Future<void> submitOnboarding(Map<String, String> answers) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token') ?? '';

    final payload = {
      ...answers,
      'birthDate': '2000-01-01',
      'q4MorningMood': 'neutral',
      'q5SelfDescribe': 'Tôi đang tìm kiếm sự bình yên',
    };

    await http.post(
      Uri.parse('$baseUrl/auth/onboarding'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(payload),
    );
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr == null) return null;
    return jsonDecode(userStr);
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
