package com.soulmirror.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public Map<String, String> generateReading(String cardName, String userContext, String description) {
        if (apiKey == null || apiKey.trim().isEmpty() || "YOUR_GEMINI_KEY".equals(apiKey)) {
            return Map.of(
                "message", "Hãy lắng nghe trực giác của bạn. Lá bài " + cardName + " đang mở ra một cánh cổng năng lượng mới cho bạn giữa những băn khoăn về cuộc sống.",
                "advice", "Dành 5 phút thiền định và cảm nhận bài học từ lá bài này."
            );
        }
        try {
            String prompt = String.format(
                "Bạn là bậc thầy Tarot thực chiến với 40 năm kinh nghiệm, kết hợp Chiêm tinh học, Thần số học và Tâm lý học Chiều Sâu. Bạn không bao giờ né tránh các góc khuất.\n\n" +
                "=== HỒ SƠ NGƯỜI DÙNG ===\n%s\n" +
                "=== VẤN ĐỀ ĐẶT RA ===\n%s\n" +
                "=== LÁ BÀI RÚT ĐƯỢC BỞI VŨ TRỤ ===\n%s\n\n" +
                "Nhiệm vụ của bạn:\n" +
                "1. \"message\": Viết bài luận giải thấu cảm nhưng sắc bén bằng tiếng Việt. Nếu lá bài là Chiều Ngược (Reversed), BẮT BUỘC phải phân tích sự tắc nghẽn năng lượng, nỗi sợ tiềm thức, sự kháng cự hoặc sự chậm trễ. Kết hợp 4 tầng phân tích: Chiêm tinh học, Thần số học, Tâm lý học, Thực tiễn. Giải thích thẳng thắn tại sao vũ trụ lại ném cho họ lá bài gai góc (hoặc tuyệt vời) này vào đúng lúc này (tối thiểu 250 từ).\n" +
                "2. \"advice\": Lời khuyên hành động thực tế, cụ thể, dễ hiểu và mạnh mẽ nhất mà họ phải làm ngay hôm nay để gỡ rối (tối thiểu 120 từ).\n\n" +
                "Hãy trả về kết quả dưới định dạng JSON duy nhất như sau:\n" +
                "{\n" +
                "  \"message\": \"nội dung thông điệp tập trung giải quyết vấn đề...\",\n" +
                "  \"advice\": \"nội dung lời khuyên hành động thực tế...\"\n" +
                "}",
                userContext, description, cardName
            );

            return callGeminiApi(prompt);
        } catch (Exception e) {
            System.err.println("Error generating reading: " + e.getMessage());
        }

        return Map.of();
    }

    public Map<String, String> drawCardWithAI(String userContext, String description) {
        if (apiKey == null || apiKey.trim().isEmpty() || "YOUR_GEMINI_KEY".equals(apiKey)) {
            return Map.of(); // Return empty to trigger backend database fallback
        }

        try {
            String prompt = String.format(
                "Bạn là một bậc thầy Tarot 40 năm kinh nghiệm, kết hợp Chiêm tinh học, Thần số học và Tâm lý học sâu (Carl Jung) để đưa ra những bài đọc siêu thấu cảm và chính xác tối cao.\n\n" +
                "%s\n" +
                "=== CÂU HỎI / VẤN ĐỀ ĐẶT RA ===\n" +
                "%s\n\n" +
                "=== NHIỆM VỤ CỦA BẠN ===\n" +
                "1. ĐỌC kỹ toàn bộ hồ sơ cá nhân bên trên (tên, ngày sinh, cung hoàng đạo, số chủ đạo, kiểu tính cách, giai đoạn cuộc sống, mức năng lượng, lĩnh vực cần soi, phạm vi thời gian).\n" +
                "2. Dựa trên hồ sơ đó, hãy chọn ra đúng 1 lá bài Tarot chuẩn xác nhất từ bộ 78 lá (tên tiếng Anh chuẩn).\n" +
                "3. Viết bài luận giải sâu sắc bằng tiếng Việt theo 4 tầng phân tích sau (mỗi tầng tối thiểu 60 từ):\n" +
                "   ● Tầng Chiêm tinh học: Cung hoàng đạo của người dùng đang tương tác thế nào với lá bài này? Nguyên tố (Lửa/Đất/Khí/Nước) hỗ trợ hay cản trở?\n" +
                "   ● Tầng Thần số học: Số chủ đạo đưa ra thông điệp gì cho vấn đề này? Năng lượng số mệnh hỗ trợ hay là bài học?\n" +
                "   ● Tầng Tâm lý học (Carl Jung): Kiểu tính cách và giai đoạn cuộc sống hiện tại hé lộ điều gì về nội tâm tiềm thức của họ? Phần Bóng Tối (Shadow) hay Nguyên mẫu (Archetype) nào đang hoạt động?\n" +
                "   ● Tầng Thực tiễn: Lời khuyên cụ thể dựa trên mức năng lượng và lĩnh vực họ chọn.\n" +
                "4. Đưa ra advice: Bước hành động cụ thể cho HIỆN TẠI (đủ rõ ràng để làm ngay hôm nay). Tối thiểu 120 từ.\n\n" +
                "TRẢ VỀ JSON (không markdown ```json):\n" +
                "{\n" +
                "  \"cardName\": \"Tên tiếng Anh lá bài (ví dụ: 'The Moon', 'Five of Swords')\",\n" +
                "  \"message\": \"bài luận giải 4 tầng sâu sắc bằng tiếng Việt...\",\n" +
                "  \"advice\": \"lời khuyên thực tiễn cụ thể bằng tiếng Việt...\"\n" +
                "}",
                userContext, description
            );

            return callGeminiApi(prompt);
        } catch (Exception e) {
            System.err.println("Error drawing card with AI: " + e.getMessage());
            e.printStackTrace();
        }

        return Map.of();
    }

    public String chatWithAI(String userMessage, String chatHistory) {
        if (apiKey == null || apiKey.trim().isEmpty() || "YOUR_GEMINI_KEY".equals(apiKey)) {
            return "Mình luôn ở đây lắng nghe bạn. Hãy chia sẻ thêm nhé.";
        }

        try {
            String prompt = String.format(
                "Bạn là Cosmic Guide AI - một người bạn đồng hành tâm linh thấu hiểu, ấm áp, kiêm chuyên gia tâm lý học thấu cảm.\n" +
                "Nhiệm vụ của bạn:\n" +
                "- Lắng nghe và làm rõ, làm sáng tỏ tận gốc vấn đề mà người dùng đang gặp phải một cách cực kỳ chi tiết, tinh tế.\n" +
                "- KHÔNG trả lời hời hợt, chung chung. Bạn hãy phân tích sâu vào trạng thái cảm xúc, tâm lý của họ và đặt những câu hỏi mở thông thái hoặc đưa ra các góc nhìn thấu suốt để giúp họ tự nhìn nhận sâu sắc vấn đề của bản thân và tìm ra hướng tháo gỡ.\n" +
                "- Sử dụng văn phong nhẹ nhàng, chữa lành, sâu sắc, chia sẻ chân thành.\n" +
                "- Giữ phản hồi ngắn gọn nhưng cực kỳ chất lượng và đi thẳng vào trọng tâm tâm lý (khoảng 100-150 từ).\n\n" +
                "Lịch sử trò chuyện trước đó (nếu có):\n%s\n\n" +
                "Tin nhắn mới của người dùng: \"%s\"\n\n" +
                "Hãy đưa ra phản hồi của bạn dưới dạng văn bản tiếng Việt tự nhiên nhất, không cần định dạng JSON hay bất kỳ markdown code block nào.",
                chatHistory != null ? chatHistory : "", userMessage
            );

            return callGeminiApiForChat(prompt);
        } catch (Exception e) {
            System.err.println("Error in AI chat: " + e.getMessage());
        }

        return "Mình hiểu cảm giác của bạn. Bạn có muốn chia sẻ chi tiết hơn về những gì đang diễn ra không?";
    }

    private String callGeminiApiForChat(String prompt) throws Exception {
        Map<String, Object> contents = Map.of(
            "parts", new Object[] { Map.of("text", prompt) }
        );
        Map<String, Object> requestBody = Map.of(
            "contents", new Object[] { contents }
        );

        String requestBodyJson = objectMapper.writeValueAsString(requestBody);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        int maxRetries = 3;
        int delayMs = 1000;
        HttpResponse<String> response = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                        .timeout(Duration.ofSeconds(15))
                        .build();

                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode textNode = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode()) {
                        return textNode.asText().trim();
                    }
                } else if (response.statusCode() == 503 || response.statusCode() == 429) {
                    System.err.println("Gemini API for Chat returned " + response.statusCode() + " (temporary overload), retrying attempt " + attempt + "/" + maxRetries + "...");
                } else {
                    break; // Don't retry other error codes
                }
            } catch (Exception e) {
                System.err.println("Network error in Chat API, retrying attempt " + attempt + "/" + maxRetries + ": " + e.getMessage());
            }

            if (attempt < maxRetries) {
                Thread.sleep(delayMs * attempt);
            }
        }
        
        if (response != null) {
            throw new RuntimeException("Chat API Call Failed: status code " + response.statusCode());
        }
        throw new RuntimeException("Chat API Call Failed");
    }

    private Map<String, String> callGeminiApi(String prompt) throws Exception {
        Map<String, Object> contents = Map.of(
            "parts", new Object[] { Map.of("text", prompt) }
        );
        Map<String, Object> requestBody = Map.of(
            "contents", new Object[] { contents },
            "generationConfig", Map.of(
                "responseMimeType", "application/json"
            )
        );

        String requestBodyJson = objectMapper.writeValueAsString(requestBody);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        int maxRetries = 3;
        int delayMs = 1000;
        HttpResponse<String> response = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                        .timeout(Duration.ofSeconds(15))
                        .build();

                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode textNode = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
                    
                    if (!textNode.isMissingNode()) {
                        String jsonText = textNode.asText();
                        JsonNode resultJson = objectMapper.readTree(jsonText);
                        
                        if (resultJson.has("cardName")) {
                            return Map.of(
                                "cardName", resultJson.path("cardName").asText(""),
                                "message", resultJson.path("message").asText(""),
                                "advice", resultJson.path("advice").asText("")
                            );
                        } else {
                            return Map.of(
                                "message", resultJson.path("message").asText(""),
                                "advice", resultJson.path("advice").asText("")
                            );
                        }
                    }
                } else if (response.statusCode() == 503 || response.statusCode() == 429) {
                    System.err.println("Gemini API returned " + response.statusCode() + " (temporary overload), retrying attempt " + attempt + "/" + maxRetries + "...");
                } else {
                    break;
                }
            } catch (Exception e) {
                System.err.println("Network error calling Gemini API, retrying attempt " + attempt + "/" + maxRetries + ": " + e.getMessage());
            }

            if (attempt < maxRetries) {
                Thread.sleep(delayMs * attempt);
            }
        }
        
        if (response != null) {
            System.err.println("Gemini API returned status code: " + response.statusCode() + " with body: " + response.body());
        }
        throw new RuntimeException("API Call Failed");
    }

    public String generateNatalChart(int day, int month, int year, int hour, int minute, String birthPlace) {
        if (apiKey == null || apiKey.trim().isEmpty() || "YOUR_GEMINI_KEY".equals(apiKey)) {
            return null;
        }

        try {
            String prompt = String.format(
                "Bạn là một bậc thầy Chiêm tinh học chuyên nghiệp và nhà tư vấn bản đồ sao (Natal Chart) thấu hiểu chiều sâu tâm lý con người.\\n" +
                "Hãy lập bản đồ sao cá nhân cho người sinh ngày: %02d/%02d/%d lúc %02d:%02d tại \"%s\".\\n\\n" +
                "Nhiệm vụ của bạn:\\n" +
                "1. Tính toán hoặc ước lượng chính xác tuyệt đối theo dữ liệu thiên văn vị trí các cung hoàng đạo, góc độ (0 đến 30 độ) và nhà địa bàn của Cung Mọc (Ascendant) và 10 hành tinh chính (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto).\\n" +
                "2. Tính toán chính xác phân chia 12 Nhà địa bàn (Houses 1-12) bắt đầu từ cung hoàng đạo nào.\\n" +
                "3. Liệt kê các Góc chiếu (Aspects) quan trọng giữa các hành tinh (ví dụ: Conjunction, Sextile, Square, Trine, Opposition).\\n" +
                "4. Viết lời giải nghĩa (meaning) bằng tiếng Việt cực kỳ chi tiết, thấu cảm, mang tính chữa lành và sâu sắc cho từng Placement (Vị trí hành tinh) và Nhà địa bàn. Không viết chung chung lý thuyết, hãy cá nhân hóa bài đọc (tối thiểu 100 từ mỗi vị trí).\\n" +
                "5. Thống kê tỷ lệ cân bằng 4 nguyên tố (Fire, Earth, Air, Water) dưới dạng phần trăm (tổng bằng 100).\\n" +
                "6. Viết bản phân tích tổng hợp cuộc đời chuyên sâu (overallAnalysis) tối thiểu 300 từ bằng tiếng Việt.\\n\\n" +
                "BẮT BUỘC TRẢ VỀ kết quả dưới định dạng JSON duy nhất, chính xác như sau (không kèm mã markdown ```json hoặc bất kỳ ký tự thừa nào ngoài JSON):\\n" +
                "{\\n" +
                "  \"ascendant\": {\\n" +
                "    \"sign\": \"Tên cung hoàng đạo tiếng Việt (ví dụ: 'Song Tử')\",\\n" +
                "    \"degree\": 15.5,\\n" +
                "    \"house\": 1,\\n" +
                "    \"meaning\": \"Lời luận giải sâu sắc về Cung Mọc (tối thiểu 100 từ)...\"\\n" +
                "  },\\n" +
                "  \"planets\": {\\n" +
                "    \"Sun\": { \"sign\": \"Song Tử\", \"degree\": 29.1, \"house\": 10, \"meaning\": \"Luận giải Mặt Trời...\" },\\n" +
                "    \"Moon\": { \"sign\": \"Cự Giải\", \"degree\": 4.5, \"house\": 11, \"meaning\": \"Luận giải Mặt Trăng...\" },\\n" +
                "    \"Mercury\": { \"sign\": \"Kim Ngưu\", \"degree\": 15.2, \"house\": 9, \"meaning\": \"Luận giải Sao Thủy...\" },\\n" +
                "    \"Venus\": { \"sign\": \"Cự Giải\", \"degree\": 22.8, \"house\": 11, \"meaning\": \"Luận giải Sao Kim...\" },\\n" +
                "    \"Mars\": { \"sign\": \"Sư Tử\", \"degree\": 5.7, \"house\": 12, \"meaning\": \"Luận giải Sao Hỏa...\" },\\n" +
                "    \"Jupiter\": { \"sign\": \"Bảo Bình\", \"degree\": 18.3, \"house\": 6, \"meaning\": \"Luận giải Sao Mộc...\" },\\n" +
                "    \"Saturn\": { \"sign\": \"Bạch Dương\", \"degree\": 9.4, \"house\": 8, \"meaning\": \"Luận giải Sao Thổ...\" },\\n" +
                "    \"Uranus\": { \"sign\": \"Bảo Bình\", \"degree\": 11.2, \"house\": 6, \"meaning\": \"Luận giải Sao Thiên Vương...\" },\\n" +
                "    \"Neptune\": { \"sign\": \"Ma Kết\", \"degree\": 28.6, \"house\": 5, \"meaning\": \"Luận giải Sao Hải Vương...\" },\\n" +
                "    \"Pluto\": { \"sign\": \"Nhân Mã\", \"degree\": 3.9, \"house\": 4, \"meaning\": \"Luận giải Sao Diêm Vương...\" }\\n" +
                "  },\\n" +
                "  \"houses\": {\\n" +
                "    \"1\": { \"sign\": \"Cung hoàng đạo đỉnh Nhà 1\", \"meaning\": \"Luận giải Nhà 1...\" },\\n" +
                "    \"2\": { \"sign\": \"Cung hoàng đạo đỉnh Nhà 2\", \"meaning\": \"Luận giải Nhà 2...\" },\\n" +
                "    \"3\": { \"sign\": \"Cung hoàng đạo đỉnh Nhà 3\", \"meaning\": \"Luận giải...\" },\\n" +
                "    \"4\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"5\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"6\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"7\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"8\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"9\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"10\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"11\": { \"sign\": \"...\", \"meaning\": \"...\" },\\n" +
                "    \"12\": { \"sign\": \"...\", \"meaning\": \"...\" }\\n" +
                "  },\\n" +
                "  \"aspects\": [\\n" +
                "    { \"planet1\": \"Sun\", \"planet2\": \"Moon\", \"type\": \"Sextile\", \"angle\": 60, \"meaning\": \"Luận giải góc chiếu...\" }\\n" +
                "  ],\\n" +
                "  \"overallAnalysis\": \"Phân tích tổng hợp sâu sắc về số mệnh...\",\\n" +
                "  \"elementBalance\": { \"Fire\": 30, \"Earth\": 20, \"Air\": 40, \"Water\": 10 }\\n" +
                "}",
                day, month, year, hour, minute, birthPlace
            );

            return callGeminiApiForChat(prompt);
        } catch (Exception e) {
            System.err.println("Error generating natal chart from Gemini: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }
}
