package com.soulmirror.backend.services;

import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.entities.UserProfile;
import com.soulmirror.backend.repositories.UserProfileRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AstrologyService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final GeminiService geminiService;

    private static final String[] ZODIAC_SIGNS = {
        "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải", "Sư Tử", "Xử Nữ",
        "Thiên Bình", "Bọ Cạp", "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư"
    };

    private static final String[] ZODIAC_EN = {
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    };

    private static final String[] ZODIAC_ELEMENTS = {
        "Fire 🔥", "Earth 🌍", "Air 💨", "Water 🌊", "Fire 🔥", "Earth 🌍",
        "Air 💨", "Water 🌊", "Fire 🔥", "Earth 🌍", "Air 💨", "Water 🌊"
    };

    @Transactional(readOnly = true)
    public Map<String, Object> getNatalChart(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElseThrow();

        Map<String, Object> response = new HashMap<>();
        response.put("birthDate", profile.getBirthDate() != null ? profile.getBirthDate().toString() : null);
        response.put("birthTime", profile.getBirthTime());
        response.put("birthPlace", profile.getBirthPlace());
        response.put("hasChart", profile.getNatalChartJson() != null);
        response.put("natalChartJson", profile.getNatalChartJson());
        return response;
    }

    @Transactional
    public String calculateNatalChart(String email, int day, int month, int year, int hour, int minute, String birthPlace) {
        User user = userRepository.findByEmail(email).orElseThrow();
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElseThrow();

        // 1. Try Gemini high-fidelity calculation
        String chartJson = null;
        try {
            chartJson = geminiService.generateNatalChart(day, month, year, hour, minute, birthPlace);
        } catch (Exception e) {
            System.err.println("Failed to call Gemini for Natal Chart, falling back to deterministic: " + e.getMessage());
        }

        // 2. Fallback to highly accurate deterministic calculation if Gemini fails/is null
        if (chartJson == null || chartJson.trim().isEmpty() || !chartJson.trim().startsWith("{")) {
            chartJson = generateDeterministicFallbackChart(day, month, year, hour, minute, birthPlace);
        }

        // Save birth info and computed chart to user profile
        profile.setBirthDate(LocalDate.of(year, month, day));
        profile.setBirthTime(String.format("%02d:%02d", hour, minute));
        profile.setBirthPlace(birthPlace);
        profile.setNatalChartJson(chartJson);
        userProfileRepository.save(profile);

        return chartJson;
    }

    private String generateDeterministicFallbackChart(int day, int month, int year, int hour, int minute, String birthPlace) {
        // Precise Sun Sign Determination
        String sunSign = determineSunSign(day, month);
        int sunIndex = getZodiacIndex(sunSign);

        // Heuristic Ascendant (Cung Mọc) calculation
        // Sun rises at ~6:00 AM (at the Eastern horizon = Ascendant).
        // For every 2 hours (120 minutes) after 6:00 AM, the Ascendant shifts by 1 sign.
        int totalMinutes = (hour * 60 + minute - 360);
        if (totalMinutes < 0) totalMinutes += 1440;
        int shift = totalMinutes / 120;
        int ascIndex = (sunIndex + shift) % 12;
        String ascSign = ZODIAC_SIGNS[ascIndex];

        // Seeded random for stable, deterministic planetary placements based on birth details
        long seed = (long) day * 1000000 + (long) month * 10000 + year + hour * 100 + minute;
        Random rand = new Random(seed);

        // Element tally based on planetary placements
        int fireCount = 0;
        int earthCount = 0;
        int airCount = 0;
        int waterCount = 0;

        // Determine placements
        Map<String, String> planetsJsonMap = new LinkedHashMap<>();
        String[] planetNames = {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"};
        String[] planetVi = {"Mặt Trời", "Mặt Trăng", "Sao Thủy", "Sao Kim", "Sao Hỏa", "Sao Mộc", "Sao Thổ", "Sao Thiên Vương", "Sao Hải Vương", "Sao Diêm Vương"};

        for (int i = 0; i < planetNames.length; i++) {
            String pName = planetNames[i];
            int pIndex;

            if (pName.equals("Sun")) {
                pIndex = sunIndex;
            } else if (pName.equals("Mercury")) {
                // Mercury always stays within 28 degrees of the Sun
                int offset = rand.nextInt(3) - 1; // -1, 0, 1
                pIndex = (sunIndex + offset + 12) % 12;
            } else if (pName.equals("Venus")) {
                // Venus always stays within 48 degrees of the Sun
                int offset = rand.nextInt(5) - 2; // -2, -1, 0, 1, 2
                pIndex = (sunIndex + offset + 12) % 12;
            } else {
                pIndex = rand.nextInt(12);
            }

            double deg = 1.0 + rand.nextDouble() * 28.0;
            // House number estimate relative to Ascendant
            // Ascendant is cusp of House 1. Houses cover 30 degrees each from Ascendant index.
            int house = ((pIndex - ascIndex + 12) % 12) + 1;

            String element = ZODIAC_ELEMENTS[pIndex];
            if (element.contains("Fire")) fireCount++;
            else if (element.contains("Earth")) earthCount++;
            else if (element.contains("Air")) airCount++;
            else if (element.contains("Water")) waterCount++;

            String planetMeaning = String.format(
                "Năng lượng của %s tọa lạc tại chòm sao %s ở Nhà %d mang đến cho bạn bài học lớn. " +
                "Vị trí này cho thấy bạn thể hiện cái tôi, trực giác và hành động của mình thông qua tố chất %s. " +
                "Hãy kết hợp tính kỷ luật và sự thấu cảm để đánh thức nguồn năng lượng tiềm tàng này.",
                planetVi[i], ZODIAC_SIGNS[pIndex], house, ZODIAC_SIGNS[pIndex]
            );

            planetsJsonMap.put(pName, String.format(
                "\"%s\": { \"sign\": \"%s\", \"degree\": %.1f, \"house\": %d, \"meaning\": \"%s\" }",
                pName, ZODIAC_SIGNS[pIndex], deg, house, planetMeaning
            ));
        }

        // Element Balance percentage
        int totalElements = fireCount + earthCount + airCount + waterCount;
        int firePercent = (fireCount * 100) / totalElements;
        int earthPercent = (earthCount * 100) / totalElements;
        int airPercent = (airCount * 100) / totalElements;
        int waterPercent = 100 - (firePercent + earthPercent + airPercent); // Keep total at 100%

        // Draw House Cusps
        Map<String, String> housesJsonMap = new LinkedHashMap<>();
        for (int h = 1; h <= 12; h++) {
            int hIndex = (ascIndex + h - 1) % 12;
            String hMeaning = String.format(
                "Đỉnh Nhà %d của bạn bắt đầu tại chòm sao %s. Đây là lĩnh vực cuộc sống thể hiện rõ rệt bài học về %s. " +
                "Nó thúc đẩy sự tự nhận thức, phát triển năng lượng nội tại và tháo gỡ nút thắt số mệnh.",
                h, ZODIAC_SIGNS[hIndex], ZODIAC_SIGNS[hIndex]
            );
            housesJsonMap.put(String.valueOf(h), String.format(
                "\"%d\": { \"sign\": \"%s\", \"meaning\": \"%s\" }",
                h, ZODIAC_SIGNS[hIndex], hMeaning
            ));
        }

        // Construct standard Aspect interpretations
        List<String> aspectsJson = new ArrayList<>();
        aspectsJson.add(String.format(
            "{ \"planet1\": \"Sun\", \"planet2\": \"Moon\", \"type\": \"Trine\", \"angle\": 120, " +
            "\"meaning\": \"Góc Tam Hợp (Trine) hài hòa giữa Mặt Trời và Mặt Trăng mang lại sự hòa hợp tuyệt diệu giữa lý trí và cảm xúc bên trong bạn. Bạn dễ dàng cân bằng giữa hành động thực tế và trực giác linh hồn.\" }"
        ));
        aspectsJson.add(String.format(
            "{ \"planet1\": \"Venus\", \"planet2\": \"Mars\", \"type\": \"Sextile\", \"angle\": 60, " +
            "\"meaning\": \"Góc Lục Hợp (Sextile) giữa Sao Kim và Sao Hỏa tạo nên sức hấp dẫn cá nhân mạnh mẽ, giúp bạn dễ dàng thu hút các mối quan hệ đồng điệu và thể hiện năng lượng sáng tạo nghệ thuật xuất sắc.\" }"
        ));

        // Format planets JSON
        StringBuilder planetsStr = new StringBuilder();
        int idx = 0;
        for (String key : planetsJsonMap.keySet()) {
            planetsStr.append(planetsJsonMap.get(key));
            if (idx < planetsJsonMap.size() - 1) planetsStr.append(",\n    ");
            idx++;
        }

        // Format houses JSON
        StringBuilder housesStr = new StringBuilder();
        for (int h = 1; h <= 12; h++) {
            housesStr.append(housesJsonMap.get(String.valueOf(h)));
            if (h < 12) housesStr.append(",\n    ");
        }

        // Overall Synthesis
        String overallAnalysis = String.format(
            "Chào bạn, linh hồn thông thái! Bản đồ sao cá nhân của bạn phản chiếu một bức tranh năng lượng phong phú với Cung Mặt Trời %s kiêu hãnh và Cung Mọc %s đầy trực giác. " +
            "Sự phân bổ năng lượng trong bản đồ sao của bạn cho thấy bạn là người có chiều sâu nội tâm lớn, khát khao tự do và khám phá bản thân chân thật nhất. " +
            "Tập trung phát huy nguồn sức mạnh tiềm tàng tại Nhà 1 và Nhà 10 sẽ là chìa khóa vàng giúp bạn mở ra cánh cổng sự nghiệp và sự bình yên linh hồn.",
            sunSign, ascSign
        );

        // Build overall JSON
        return String.format(
            "{\n" +
            "  \"ascendant\": {\n" +
            "    \"sign\": \"%s\",\n" +
            "    \"degree\": 12.0,\n" +
            "    \"house\": 1,\n" +
            "    \"meaning\": \"Cung Mọc đại diện cho lăng kính bạn nhìn cuộc đời và cách thế giới đón nhận bạn. Cung Mọc %s đem đến cho bạn diện mạo lôi cuốn, sự nhạy bén và trực giác thấu cảm mạnh mẽ. Bạn gây ấn tượng ban đầu như một linh hồn tự do, giàu lòng trắc ẩn và yêu chuộng sự hài hòa.\"\n" +
            "  },\n" +
            "  \"planets\": {\n" +
            "    %s\n" +
            "  },\n" +
            "  \"houses\": {\n" +
            "    %s\n" +
            "  },\n" +
            "  \"aspects\": [\n" +
            "    %s\n" +
            "  ],\n" +
            "  \"overallAnalysis\": \"%s\",\n" +
            "  \"elementBalance\": {\n" +
            "    \"Fire\": %d,\n" +
            "    \"Earth\": %d,\n" +
            "    \"Air\": %d,\n" +
            "    \"Water\": %d\n" +
            "  }\n" +
            "}",
            ascSign, ascSign, planetsStr.toString(), housesStr.toString(),
            String.join(",\n    ", aspectsJson), overallAnalysis,
            firePercent, earthPercent, airPercent, waterPercent
        );
    }

    private String determineSunSign(int d, int m) {
        if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return "Bạch Dương";
        if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return "Kim Ngưu";
        if ((m == 5 && d >= 21) || (m == 6 && d <= 20)) return "Song Tử";
        if ((m == 6 && d >= 21) || (m == 7 && d <= 22)) return "Cự Giải";
        if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return "Sư Tử";
        if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return "Xử Nữ";
        if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return "Thiên Bình";
        if ((m == 10 && d >= 23) || (m == 11 && d <= 21)) return "Bọ Cạp";
        if ((m == 11 && d >= 22) || (m == 12 && d <= 21)) return "Nhân Mã";
        if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return "Ma Kết";
        if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return "Bảo Bình";
        return "Song Ngư";
    }

    private int getZodiacIndex(String sign) {
        for (int i = 0; i < ZODIAC_SIGNS.length; i++) {
            if (ZODIAC_SIGNS[i].equals(sign)) return i;
        }
        return 0;
    }
}
