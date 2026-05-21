import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;
import '../widgets/cosmic_widgets.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

// ─── Astrological Data Mappings ──────────────────────────────────────────────
const _zodiacColors = {
  'Bạch Dương': Color(0xFFFF5252), // Fire
  'Sư Tử':      Color(0xFFFF7A00),
  'Nhân Mã':    Color(0xFFFFAB40),
  
  'Kim Ngưu':   Color(0xFF8D6E63), // Earth
  'Xử Nữ':      Color(0xFFA1887F),
  'Ma Kết':     Color(0xFF6D4C41),
  
  'Song Tử':    Color(0xFF40C4FF), // Air
  'Thiên Bình': Color(0xFF00E5FF),
  'Bảo Bình':   Color(0xFF18FFFF),
  
  'Cự Giải':    Color(0xFFE040FB), // Water
  'Bọ Cạp':     Color(0xFFBA68C8),
  'Song Ngư':   Color(0xFFEA80FC),
};

const _zodiacSymbols = {
  'Bạch Dương': '♈', 'Kim Ngưu': '♉', 'Song Tử': '♊', 'Cự Giải': '♋',
  'Sư Tử': '♌', 'Xử Nữ': '♍', 'Thiên Bình': '♎', 'Bọ Cạp': '♏',
  'Nhân Mã': '♐', 'Ma Kết': '♑', 'Bảo Bình': '♒', 'Song Ngư': '♓',
};

const _planetSymbols = {
  'Sun': '☀️', 'Moon': '🌙', 'Mercury': '☿', 'Venus': '♀', 'Mars': '♂',
  'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '♅', 'Neptune': '♆', 'Pluto': '♇',
};

const _planetVi = {
  'Sun': 'Mặt Trời', 'Moon': 'Mặt Trăng', 'Mercury': 'Sao Thủy', 'Venus': 'Sao Kim', 'Mars': 'Sao Hỏa',
  'Jupiter': 'Sao Mộc', 'Saturn': 'Sao Thổ', 'Uranus': 'Sao Thiên Vương', 'Neptune': 'Sao Hải Vương', 'Pluto': 'Sao Diêm Vương',
};

// ─── Natal Chart Main Screen ──────────────────────────────────────────────────
class NatalChartScreen extends StatefulWidget {
  const NatalChartScreen({super.key});

  @override
  State<NatalChartScreen> createState() => _NatalChartScreenState();
}

class _NatalChartScreenState extends State<NatalChartScreen> with SingleTickerProviderStateMixin {
  bool _loading = false;
  bool _hasChart = false;
  Map<String, dynamic>? _chartData;
  String? _errorMessage;

  // Input fields state
  DateTime? _birthDate;
  TimeOfDay? _birthTime;
  final TextEditingController _placeController = TextEditingController();

  // Tab state inside chart view
  int _viewTab = 0; // 0: Overview, 1: Placements, 2: Houses, 3: Aspects
  String? _selectedPlanet;

  @override
  void initState() {
    super.initState();
    _loadSavedProfileAndChart();
  }

  @override
  void dispose() {
    _placeController.dispose();
    super.dispose();
  }

  Future<void> _loadSavedProfileAndChart() async {
    setState(() => _loading = true);
    try {
      final cached = await ApiService.getCachedNatalChart();
      if (cached['hasChart'] == true && cached['natalChartJson'] != null) {
        setState(() {
          _chartData = jsonDecode(cached['natalChartJson']);
          _hasChart = true;
          _errorMessage = null;
        });
      } else {
        // Try to pre-fill DOB from onboarding
        final user = await AuthService.getUser();
        if (user != null && user['birthDate'] != null) {
          try {
            _birthDate = DateTime.parse(user['birthDate']);
          } catch (_) {}
        }
      }
    } catch (e) {
      // Quietly ignore or set message
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _generateChart() async {
    if (_birthDate == null || _birthTime == null || _placeController.text.trim().isEmpty) {
      setState(() => _errorMessage = 'Vui lòng điền đầy đủ thông tin sinh để lập bản đồ sao.');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final rawChart = await ApiService.getNatalChart(
        day: _birthDate!.day,
        month: _birthDate!.month,
        year: _birthDate!.year,
        hour: _birthTime!.hour,
        minute: _birthTime!.minute,
        birthPlace: _placeController.text.trim(),
      );

      setState(() {
        _chartData = rawChart;
        _hasChart = true;
        _errorMessage = null;
      });
    } catch (e) {
      setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && !_hasChart) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFE86EAD)));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!_hasChart) _buildInputForm() else _buildChartView(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ─── Input Form (Phase 1) ───────────────────────────────────────────────────
  Widget _buildInputForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        Text('Giải mã Bản đồ sao Cá nhân',
            style: GoogleFonts.lora(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 8),
        Text('Nhập chính xác giờ sinh và nơi sinh để vũ trụ lập biểu đồ tinh tú riêng cho cuộc đời bạn.',
            style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13, height: 1.4)),
        const SizedBox(height: 24),
        
        if (_errorMessage != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
              const SizedBox(width: 10),
              Expanded(child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 12))),
            ]),
          ),

        // Birth Date Picker
        _buildInputField(
          icon: Icons.calendar_today_rounded,
          label: 'Ngày sinh',
          valueText: _birthDate == null ? 'Chọn ngày sinh' : '${_birthDate!.day}/${_birthDate!.month}/${_birthDate!.year}',
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _birthDate ?? DateTime(2000, 1, 1),
              firstDate: DateTime(1950),
              lastDate: DateTime.now(),
            );
            if (picked != null) setState(() => _birthDate = picked);
          },
        ),
        const SizedBox(height: 16),

        // Birth Time Picker
        _buildInputField(
          icon: Icons.access_time_rounded,
          label: 'Giờ sinh chính xác (Cực kỳ quan trọng)',
          valueText: _birthTime == null ? 'Chọn giờ sinh' : _birthTime!.format(context),
          onTap: () async {
            final picked = await showTimePicker(
              context: context,
              initialTime: _birthTime ?? const TimeOfDay(hour: 12, minute: 0),
            );
            if (picked != null) setState(() => _birthTime = picked);
          },
        ),
        const SizedBox(height: 16),

        // Birth Place Input
        Text('Nơi sinh (Tỉnh/Thành phố, Quốc gia)', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: TextField(
            controller: _placeController,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Ví dụ: Hà Nội, Việt Nam',
              hintStyle: TextStyle(color: Colors.white38, fontSize: 14),
              prefixIcon: Icon(Icons.location_on_outlined, color: Colors.white60),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        const SizedBox(height: 32),

        CosmicButton(
          label: 'Giải mã Bản đồ sao',
          isLoading: _loading,
          onTap: _generateChart,
        ),
      ],
    );
  }

  Widget _buildInputField({required IconData icon, required String label, required String valueText, required VoidCallback onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Row(
              children: [
                Icon(icon, color: Colors.white60, size: 20),
                const SizedBox(width: 12),
                Text(valueText, style: TextStyle(color: _birthDate == null && valueText.contains('Chọn') ? Colors.white38 : Colors.white, fontSize: 14)),
                const Spacer(),
                const Icon(Icons.arrow_drop_down, color: Colors.white30),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── Chart View (Phase 2) ───────────────────────────────────────────────────
  Widget _buildChartView() {
    if (_chartData == null) return const SizedBox();

    final asc = _chartData!['ascendant'] ?? {};
    final planets = _chartData!['planets'] ?? {};
    final overall = _chartData!['overallAnalysis'] ?? '';
    final elements = _chartData!['elementBalance'] ?? {'Fire': 25, 'Earth': 25, 'Air': 25, 'Water': 25};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Bản đồ sao của bạn',
                    style: GoogleFonts.lora(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                Text('${_chartData!['birthPlace'] ?? ''} • ${_chartData!['birthTime'] ?? ''}',
                    style: TextStyle(color: Colors.white38, fontSize: 11)),
              ],
            ),
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Colors.white54, size: 20),
              onPressed: () => setState(() => _hasChart = false),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Beautiful Astrology Wheel View
        _buildAstrologyWheel(),
        const SizedBox(height: 24),

        // Visual Tab bar inside Chart
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildViewTabButton(0, '⭐️ Tổng quan'),
                _buildViewTabButton(1, '🪐 Các Tọa độ'),
                _buildViewTabButton(2, '🏠 12 Nhà'),
                _buildViewTabButton(3, '☄️ Góc chiếu'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Tab Content
        if (_viewTab == 0) _buildOverviewTab(asc, planets, overall, elements),
        if (_viewTab == 1) _buildPlacementsTab(planets),
        if (_viewTab == 2) _buildHousesTab(),
        if (_viewTab == 3) _buildAspectsTab(),
      ],
    );
  }

  Widget _buildViewTabButton(int idx, String label) {
    final selected = _viewTab == idx;
    return GestureDetector(
      onTap: () => setState(() {
        _viewTab = idx;
        _selectedPlanet = null;
      }),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        margin: const EdgeInsets.only(right: 4),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFC9A84C).withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? const Color(0xFFC9A84C).withOpacity(0.4) : Colors.transparent),
        ),
        child: Text(label, style: TextStyle(color: selected ? Colors.white : Colors.white38, fontSize: 11, fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
      ),
    );
  }

  // Interactive CustomPaint Astrology Wheel
  Widget _buildAstrologyWheel() {
    final asc = _chartData!['ascendant'] ?? {};
    final planets = _chartData!['planets'] ?? {};
    final aspects = _chartData!['aspects'] as List? ?? [];

    return LayoutBuilder(
      builder: (context, constraints) {
        final size = math.min(constraints.maxWidth, 330.0);
        return Center(
          child: Column(
            children: [
              GestureDetector(
                onTapDown: (details) {
                  final center = Offset(size / 2, size / 2);
                  final localPos = details.localPosition;
                  final dx = localPos.dx - center.dx;
                  final dy = localPos.dy - center.dy;
                  final dist = math.sqrt(dx * dx + dy * dy);
                  
                  // Taps falling inside planetary orbit range
                  if (dist > size * 0.2 && dist < size * 0.45) {
                    final angleRad = math.atan2(dy, dx);
                    double angleDeg = angleRad * 180 / math.pi;
                    if (angleDeg < 0) angleDeg += 360;

                    // Match tapped angle with planet placements
                    String? nearestPlanet;
                    double minDist = 360;
                    
                    planets.forEach((pName, data) {
                      final pSign = data['sign'] as String;
                      final pDeg = (data['degree'] as num).toDouble();
                      final zodiacIdx = _getZodiacIndex(pSign);
                      double planetAngle = (zodiacIdx * 30 + pDeg + 180) % 360; // offset wheel alignment
                      double diff = (planetAngle - angleDeg).abs();
                      if (diff > 180) diff = 360 - diff;
                      
                      if (diff < 15 && diff < minDist) {
                        minDist = diff;
                        nearestPlanet = pName;
                      }
                    });

                    if (nearestPlanet != null) {
                      setState(() {
                        _selectedPlanet = nearestPlanet;
                        _viewTab = 1; // Auto switch to Placements tab
                      });
                    }
                  }
                },
                child: Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF0F0B1E),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFFC9A84C).withOpacity(0.08), blurRadius: 30, spreadRadius: 5),
                    ],
                  ),
                  child: CustomPaint(
                    size: Size(size, size),
                    painter: AstrologyWheelPainter(
                      ascendantSign: asc['sign'] ?? 'Bạch Dương',
                      planets: planets,
                      aspects: aspects,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text('💡 Nhấp trực tiếp vào các ký hiệu hành tinh để xem giải nghĩa',
                  style: TextStyle(color: Colors.white24, fontSize: 10, fontStyle: FontStyle.italic)),
            ],
          ),
        );
      },
    );
  }

  // ─── Tab 0: Overview ────────────────────────────────────────────────────────
  Widget _buildOverviewTab(Map asc, Map planets, String overall, Map elements) {
    final sun = planets['Sun'] ?? {};
    final moon = planets['Moon'] ?? {};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Big Three Summary
        Text('BỘ BA CỐT LÕI (BIG THREE)', style: TextStyle(color: const Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 12),
        Row(
          children: [
            _buildBigThreeCard('☀️ Mặt Trời', sun['sign'] ?? 'Song Tử', 'Cái tôi & Sứ mệnh'),
            const SizedBox(width: 8),
            _buildBigThreeCard('🌙 Mặt Trăng', moon['sign'] ?? 'Cự Giải', 'Cảm xúc & Tiềm thức'),
            const SizedBox(width: 8),
            _buildBigThreeCard('🏹 Cung Mọc', asc['sign'] ?? 'Thiên Bình', 'Mặt nạ & Lăng kính'),
          ],
        ),
        const SizedBox(height: 20),

        // Element Balance Visualizer
        Text('CÁN CÂN NGUYÊN TỐ (ELEMENT BALANCE)', style: TextStyle(color: const Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 12),
        GlassPanel(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildElementBar('🔥 Lửa (Hành động, Nhiệt huyết)', elements['Fire'] ?? 25, Colors.redAccent),
              const SizedBox(height: 10),
              _buildElementBar('🌍 Đất (Thực tế, Bền bỉ)', elements['Earth'] ?? 25, Colors.brown),
              const SizedBox(height: 10),
              _buildElementBar('💨 Khí (Giao tiếp, Trí tuệ)', elements['Air'] ?? 25, Colors.cyan),
              const SizedBox(height: 10),
              _buildElementBar('🌊 Nước (Trực giác, Cảm xúc)', elements['Water'] ?? 25, Colors.purpleAccent),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Overall destiny analysis
        Text('LUẬN GIẢI SỐ MỆNH TỔNG HỢP', style: TextStyle(color: const Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 12),
        GlassPanel(
          child: Text(
            overall,
            style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.6),
          ),
        ),
      ],
    );
  }

  Widget _buildBigThreeCard(String title, String sign, String desc) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _zodiacColors[sign]?.withOpacity(0.3) ?? Colors.white10),
        ),
        child: Column(
          children: [
            Text(title, style: const TextStyle(color: Colors.white70, fontSize: 10)),
            const SizedBox(height: 6),
            Text(sign, style: GoogleFonts.lora(color: _zodiacColors[sign] ?? Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(_zodiacSymbols[sign] ?? '', style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 6),
            Text(desc, style: const TextStyle(color: Colors.white24, fontSize: 8), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildElementBar(String label, dynamic val, Color color) {
    final percent = (val as num).toDouble() / 100.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
            Text('${(percent * 100).toInt()}%', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percent,
            backgroundColor: Colors.white.withOpacity(0.05),
            valueColor: AlwaysStoppedAnimation(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  // ─── Tab 1: Placements ──────────────────────────────────────────────────────
  Widget _buildPlacementsTab(Map planets) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('TỌA ĐỘ CÁC CỰC TINH (PLANETARY PLACEMENTS)', style: TextStyle(color: const Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 12),
        
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: planets.length,
          itemBuilder: (context, index) {
            final pName = planets.keys.elementAt(index);
            final data = planets[pName] ?? {};
            final sign = data['sign'] ?? 'Bạch Dương';
            final degree = (data['degree'] as num?)?.toDouble() ?? 0.0;
            final house = data['house'] ?? 1;
            final meaning = data['meaning'] ?? '';
            final isSelected = _selectedPlanet == pName;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFC9A84C).withOpacity(0.08) : Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: isSelected ? const Color(0xFFC9A84C).withOpacity(0.5) : Colors.white.withOpacity(0.06)),
              ),
              child: ExpansionTile(
                initiallyExpanded: isSelected,
                key: PageStorageKey(pName),
                leading: Text(_planetSymbols[pName] ?? '🪐', style: const TextStyle(fontSize: 22)),
                title: Row(
                  children: [
                    Text(_planetVi[pName] ?? pName, style: GoogleFonts.lora(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: _zodiacColors[sign]?.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                      child: Text('$sign ${degree.toStringAsFixed(1)}°', style: TextStyle(color: _zodiacColors[sign], fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                subtitle: Text('Nhà địa bàn $house • Lĩnh vực cuộc sống', style: const TextStyle(color: Colors.white30, fontSize: 10)),
                iconColor: const Color(0xFFC9A84C),
                collapsedIconColor: Colors.white30,
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                children: [
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 6),
                  Text(meaning, style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12, height: 1.6)),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  // ─── Tab 2: Houses ──────────────────────────────────────────────────────────
  Widget _buildHousesTab() {
    final houses = _chartData!['houses'] ?? {};
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('12 NHÀ ĐỊA BÀN CHIÊM TINH (12 HOUSES)', style: TextStyle(color: const Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 12,
          itemBuilder: (context, index) {
            final hNum = (index + 1).toString();
            final data = houses[hNum] ?? {};
            final sign = data['sign'] ?? 'Bạch Dương';
            final meaning = data['meaning'] ?? '';

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
              ),
              child: ExpansionTile(
                leading: CircleAvatar(
                  radius: 14,
                  backgroundColor: const Color(0xFFC9A84C).withOpacity(0.15),
                  child: Text(hNum, style: const TextStyle(color: Color(0xFFC9A84C), fontSize: 11, fontWeight: FontWeight.bold)),
                ),
                title: Row(
                  children: [
                    Text('Nhà địa bàn $hNum', style: GoogleFonts.lora(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Text('Đỉnh Nhà: $sign', style: TextStyle(color: _zodiacColors[sign] ?? Colors.white70, fontSize: 10)),
                  ],
                ),
                subtitle: Text(_getHouseTheme(index + 1), style: const TextStyle(color: Colors.white38, fontSize: 10)),
                iconColor: const Color(0xFFC9A84C),
                collapsedIconColor: Colors.white30,
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                children: [
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 6),
                  Text(meaning, style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12, height: 1.6)),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  String _getHouseTheme(int h) {
    switch (h) {
      case 1: return 'Bản thân, Cá tính & Diện mạo';
      case 2: return 'Tài chính, Sở hữu & Giá trị cốt lõi';
      case 3: return 'Giao tiếp, Tư duy & Môi trường sống';
      case 4: return 'Gia đình, Nguồn cội & Sự riêng tư';
      case 5: return 'Sáng tạo, Tình yêu & Niềm vui';
      case 6: return 'Sức khỏe, Công việc & Thói quen hàng ngày';
      case 7: return 'Mối quan hệ, Đối tác & Hôn nhân';
      case 8: return 'Sự biến đổi, Chiều sâu & Tài sản chung';
      case 9: return 'Tri thức cao, Du hành & Triết học';
      case 10: return 'Sự nghiệp, Địa vị xã hội & Di sản';
      case 11: return 'Cộng đồng, Bạn bè & Lý tưởng sống';
      case 12: return 'Tâm linh, Tiềm thức & Sự chữa lành';
      default: return '';
    }
  }

  // ─── Tab 3: Aspects ─────────────────────────────────────────────────────────
  Widget _buildAspectsTab() {
    final aspects = _chartData!['aspects'] as List? ?? [];
    if (aspects.isEmpty) {
      return const Center(child: Text('Không phát hiện góc chiếu lớn nào.', style: TextStyle(color: Colors.white38, fontSize: 12)));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('CÁC GÓC CHIẾU ĐỐI THOẠI NĂNG LƯỢNG (ASPECTS)', style: TextStyle(color: const Color(0xFFC9A84C), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: aspects.length,
          itemBuilder: (context, index) {
            final data = aspects[index] ?? {};
            final p1 = data['planet1'] ?? '';
            final p2 = data['planet2'] ?? '';
            final type = data['type'] ?? 'Trine';
            final meaning = data['meaning'] ?? '';
            
            final String typeVi = _getAspectTypeVi(type);
            final Color aspectColor = _getAspectColor(type);

            return Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('${_planetSymbols[p1] ?? ''} ${_planetVi[p1] ?? p1}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: aspectColor.withOpacity(0.12), borderRadius: BorderRadius.circular(6), border: Border.all(color: aspectColor.withOpacity(0.4))),
                        child: Text(typeVi, style: TextStyle(color: aspectColor, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 8),
                      Text('${_planetSymbols[p2] ?? ''} ${_planetVi[p2] ?? p2}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(meaning, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12, height: 1.5)),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  String _getAspectTypeVi(String type) {
    switch (type.toLowerCase()) {
      case 'conjunction': return 'Trùng tụ (0°)';
      case 'sextile':     return 'Lục hợp (60°)';
      case 'square':      return 'Góc vuông (90°)';
      case 'trine':       return 'Tam hợp (120°)';
      case 'opposition':  return 'Đối đỉnh (180°)';
      default: return type;
    }
  }

  Color _getAspectColor(String type) {
    switch (type.toLowerCase()) {
      case 'conjunction': return Colors.amber;
      case 'trine':
      case 'sextile':     return Colors.cyan;
      case 'square':
      case 'opposition':  return Colors.redAccent;
      default: return Colors.white54;
    }
  }

  int _getZodiacIndex(String sign) {
    final signs = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'];
    return signs.indexOf(sign);
  }
}

// ─── Custom Painter for Visualizing Astrology Wheel ─────────────────────────────
class AstrologyWheelPainter extends CustomPainter {
  final String ascendantSign;
  final Map planets;
  final List aspects;

  AstrologyWheelPainter({
    required this.ascendantSign,
    required this.planets,
    required this.aspects,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final paintLine = Paint()
      ..color = Colors.white.withOpacity(0.08)
      ..strokeWidth = 1;

    final paintOuter = Paint()
      ..color = const Color(0xFFC9A84C).withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    // Draw concentric circles
    canvas.drawCircle(center, radius - 1, paintOuter);
    canvas.drawCircle(center, radius - 30, paintLine);
    canvas.drawCircle(center, radius - 60, paintLine);
    canvas.drawCircle(center, radius * 0.4, paintLine);

    final signs = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'];
    final ascIdx = signs.indexOf(ascendantSign);

    // ─── 1. Draw 12 Zodiac segments on Outer Ring ───
    for (int i = 0; i < 12; i++) {
      final signIdx = (ascIdx + i) % 12;
      final signName = signs[signIdx];
      
      // Arc coordinates
      double startAngle = (i * 30 + 180 - 15) * math.pi / 180; // Align House 1 on the left (West Ascendant)
      double sweepAngle = 30 * math.pi / 180;

      final signColor = _zodiacColors[signName] ?? Colors.white54;
      final paintSeg = Paint()
        ..color = signColor.withOpacity(0.05)
        ..style = PaintingStyle.fill;
      
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - 15),
        startAngle,
        sweepAngle,
        true,
        paintSeg,
      );

      // Draw separator line
      final angle = (i * 30 + 180 - 15) * math.pi / 180;
      final pOuter = Offset(center.dx + radius * math.cos(angle), center.dy + radius * math.sin(angle));
      final pInner = Offset(center.dx + (radius - 30) * math.cos(angle), center.dy + (radius - 30) * math.sin(angle));
      
      final paintSep = Paint()
        ..color = signColor.withOpacity(0.3)
        ..strokeWidth = 1;
      canvas.drawLine(pInner, pOuter, paintSep);

      // Draw Zodiac symbols text in outer arc center
      final textAngle = (i * 30 + 180) * math.pi / 180;
      final pText = Offset(center.dx + (radius - 15) * math.cos(textAngle), center.dy + (radius - 15) * math.sin(textAngle));
      
      _drawText(
        canvas,
        _zodiacSymbols[signName] ?? '',
        pText,
        color: signColor.withOpacity(0.9),
        fontSize: 10,
      );
    }

    // ─── 2. Draw 12 House spokes inside ───
    for (int i = 0; i < 12; i++) {
      double angle = (i * 30 + 180) * math.pi / 180;
      final pOuter = Offset(center.dx + (radius - 30) * math.cos(angle), center.dy + (radius - 30) * math.sin(angle));
      final pInner = Offset(center.dx + (radius * 0.4) * math.cos(angle), center.dy + (radius * 0.4) * math.sin(angle));
      canvas.drawLine(pInner, pOuter, paintLine);

      // Label house number in middle ring
      double labelAngle = (i * 30 + 180 + 15) * math.pi / 180;
      final pLabel = Offset(center.dx + (radius * 0.45) * math.cos(labelAngle), center.dy + (radius * 0.45) * math.sin(labelAngle));
      _drawText(canvas, '${i + 1}', pLabel, color: Colors.white24, fontSize: 8);
    }

    // ─── 3. Draw Aspect lines in center orbit ───
    for (final asp in aspects) {
      final p1 = asp['planet1'] as String?;
      final p2 = asp['planet2'] as String?;
      final type = asp['type'] as String? ?? '';

      if (planets.containsKey(p1) && planets.containsKey(p2)) {
        final data1 = planets[p1];
        final data2 = planets[p2];

        final s1 = data1['sign'] as String;
        final d1 = (data1['degree'] as num).toDouble();
        final s2 = data2['sign'] as String;
        final d2 = (data2['degree'] as num).toDouble();

        // Calculate planet angle on wheel based on Zodiac sign index & degree
        final zIdx1 = signs.indexOf(s1);
        final zIdx2 = signs.indexOf(s2);

        // Convert index and degree to coordinate angle
        double angle1 = ((zIdx1 * 30 + d1) + 180) * math.pi / 180;
        double angle2 = ((zIdx2 * 30 + d2) + 180) * math.pi / 180;

        final startOffset = Offset(center.dx + (radius * 0.55) * math.cos(angle1), center.dy + (radius * 0.55) * math.sin(angle1));
        final endOffset = Offset(center.dx + (radius * 0.55) * math.cos(angle2), center.dy + (radius * 0.55) * math.sin(angle2));

        final Color aspectColor = type.toLowerCase() == 'trine' || type.toLowerCase() == 'sextile'
            ? Colors.cyan.withOpacity(0.4)
            : Colors.redAccent.withOpacity(0.4);

        final paintAspect = Paint()
          ..color = aspectColor
          ..strokeWidth = 1.2
          ..style = PaintingStyle.stroke;

        canvas.drawLine(startOffset, endOffset, paintAspect);
      }
    }

    // ─── 4. Plot Planet Nodes ───
    planets.forEach((pName, data) {
      final sign = data['sign'] as String;
      final degree = (data['degree'] as num).toDouble();
      
      final signIdx = signs.indexOf(sign);
      double angle = ((signIdx * 30 + degree) + 180) * math.pi / 180;

      // Coordinate placement in orbit
      final pNode = Offset(center.dx + (radius - 45) * math.cos(angle), center.dy + (radius - 45) * math.sin(angle));
      
      // Draw tiny glowing circle around planet marker
      final pColor = _zodiacColors[sign] ?? Colors.cyan;
      final paintGlow = Paint()
        ..color = pColor.withOpacity(0.2)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(pNode, 10, paintGlow);

      _drawText(
        canvas,
        _planetSymbols[pName] ?? '🪐',
        pNode,
        color: Colors.white,
        fontSize: 10,
      );
    });
  }

  void _drawText(Canvas canvas, String text, Offset offset, {required Color color, required double fontSize}) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(color: color, fontSize: fontSize, fontFamily: 'Roboto'),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    final textOffset = Offset(offset.dx - textPainter.width / 2, offset.dy - textPainter.height / 2);
    textPainter.paint(canvas, textOffset);
  }

  @override
  bool shouldRepaint(covariant AstrologyWheelPainter oldDelegate) {
    return oldDelegate.ascendantSign != ascendantSign || oldDelegate.planets != planets || oldDelegate.aspects != aspects;
  }
}
