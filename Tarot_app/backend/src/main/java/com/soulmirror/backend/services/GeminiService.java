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

    public Map<String, String> generateReading(String cardName, String mood, String description) {
        if (apiKey == null || apiKey.trim().isEmpty() || "YOUR_GEMINI_KEY".equals(apiKey)) {
            return Map.of(
                "message", "Hãy lắng nghe trực giác của bạn. Lá bài " + cardName + " đang mở ra một cánh cổng năng lượng mới cho bạn giữa những băn khoăn về cuộc sống.",
                "advice", "Dành 5 phút thiền định và cảm nhận bài học từ lá bài này."
            );
        }
        try {
            String prompt = String.format(
                "Bạn là một bậc thầy giải bài Tarot và nhà tham vấn tâm lý tâm linh thấu hiểu lòng người sâu sắc.\n" +
                "Người dùng đang gặp vấn đề cụ thể: \"%s\"\n" +
                "Tâm trạng hiện tại của họ: \"%s\"\n" +
                "Lá bài họ rút được: \"%s\"\n\n" +
                "Nhiệm vụ của bạn:\n" +
                "1. \"message\": Giải thích sự liên kết thiêng liêng và cực kỳ sâu sắc giữa lá bài này với vấn đề cụ thể của họ. Hãy viết với văn phong huyền bí, thấu cảm, ấm áp, mang tính chữa lành và phân tích tâm lý rõ ràng. Tránh xa các câu lý thuyết Tarot sáo rỗng, chung chung. Bạn phải chỉ rõ ý nghĩa lá bài này phản ánh khía cạnh nào trong câu chuyện của họ, gốc rễ của sự việc nằm ở đâu (tối thiểu 250 từ).\n" +
                "2. \"advice\": Lời khuyên hành động thực tế, cụ thể, dễ hiểu và hữu hiệu nhất mà họ có thể thực hiện ngay hôm nay. Hãy chỉ ra từng bước nhỏ họ cần làm để tháo gỡ khó khăn, cải thiện tình hình của mình một cách rõ ràng và truyền cảm hứng (tối thiểu 120 từ).\n\n" +
                "CHÚ Ý TỐI QUAN TRỌNG VỀ BẢN ĐỒ VŨ TRỤ:\n" +
                "- Nếu trong mô tả vấn đề có chứa dữ liệu về ngày sinh, Cung hoàng đạo (Zodiac) hay Số chủ đạo (Life Path Number), bạn BẮT BUỘC phải thực hiện phân tích sự giao thoa, tương tác và cộng hưởng năng lượng cực kỳ chính xác giữa các yếu tố này với lá bài Tarot rút được và câu hỏi của họ.\n" +
                "- Hãy phân tích xem năng lượng tự nhiên của cung hoàng đạo đó (ví dụ: nguyên tố Khí linh hoạt của Song Tử, nguyên tố Đất kiên nhẫn của Ma Kết...) cùng những đặc trưng hành vi của con số chủ đạo đó (ví dụ: số 7 - người tìm kiếm chân lý, số 11 - trực giác tâm linh...) đang bổ trợ tích cực hay cản trở/tạo ra nút thắt nào đối với câu hỏi cụ thể của họ.\n" +
                "- Bài phân tích phải đan cài nhuần nhuyễn cả 3 yếu tố (Tarot, Cung hoàng đạo, Số chủ đạo) để đưa ra câu trả lời thuyết phục, mang tính cá nhân hóa tuyệt đối, cụ thể và thấu suốt nhất.\n\n" +
                "Hãy trả về kết quả dưới định dạng JSON duy nhất như sau:\n" +
                "{\n" +
                "  \"message\": \"nội dung thông điệp tập trung giải quyết vấn đề...\",\n" +
                "  \"advice\": \"nội dung lời khuyên hành động thực tế...\"\n" +
                "}",
                description, mood, cardName
            );

            return callGeminiApi(prompt);
        } catch (Exception e) {
            System.err.println("Error generating reading: " + e.getMessage());
        }

        return Map.of();
    }

    public Map<String, String> drawCardWithAI(String mood, String description) {
        if (apiKey == null || apiKey.trim().isEmpty() || "YOUR_GEMINI_KEY".equals(apiKey)) {
            return Map.of(); // Return empty to trigger backend database fallback
        }

        try {
            String prompt = String.format(
                "Bạn là một bậc thầy Tarot thông thái kiêm nhà tâm lý học phân tích theo trường phái Carl Jung (Tâm lý học chiều sâu) và thuyết Đồng điệu (Jungian Synchronicity).\n" +
                "Người dùng đang đối mặt với vấn đề cụ thể: \"%s\"\n" +
                "Tâm trạng hiện tại của họ: \"%s\"\n\n" +
                "Nhiệm vụ của bạn:\n" +
                "1. Chọn ra đúng 1 lá bài Tarot phù hợp và ý nghĩa nhất từ bộ 78 lá Tarot (phải chọn đúng tên tiếng Anh chuẩn từ danh sách 78 lá, ví dụ: 'The Lovers', 'Death', 'Three of Cups', 'Ten of Swords', 'Ace of Pentacles', 'King of Wands', v.v.).\n" +
                "2. Viết lời luận giải bằng tiếng Việt theo phong cách tâm lý học chiều sâu Carl Jung:\n" +
                "   - Hãy phân tích các biểu tượng nguyên mẫu (Archetypes), khám phá phần tiềm thức (Subconscious) hoặc phần Bóng tối (Shadow) của người dùng liên quan trực tiếp đến vấn đề cụ thể họ mô tả.\n" +
                "   - Giải thích vì sao lá bài này xuất hiện vào đúng thời điểm này trong cuộc đời họ như một sự đồng điệu tâm linh thiêng liêng (Synchronicity).\n" +
                "   - Văn phong thấu cảm, cực kỳ sâu sắc, mang tính khai sáng và trị liệu tâm lý mạnh mẽ. Tránh hoàn toàn việc mô tả chung chung mơ hồ, hãy chỉ ra gốc rễ tinh thần và hướng dẫn tư duy rõ ràng (phần message tối thiểu 250 từ).\n" +
                "3. Đưa ra lời khuyên hành động cụ thể, thực tế, dễ thực hiện và sâu sắc để tháo gỡ vấn đề đó (phần advice tối thiểu 120 từ).\n\n" +
                "CHÚ Ý CỐT LÕI VỀ BẢN ĐỒ VŨ TRỤ:\n" +
                "- Nếu trong mô tả vấn đề ('description') có chứa dữ liệu về ngày sinh, Cung hoàng đạo (Zodiac) hay Số chủ đạo (Life Path Number), bạn BẮT BUỘC phải thực hiện phân tích sự giao thoa, tương tác và cộng hưởng năng lượng cực kỳ chính xác giữa các yếu tố này với lá bài Tarot bạn chọn và câu hỏi của họ.\n" +
                "- Hãy phân tích xem năng lượng tự nhiên của cung hoàng đạo đó (ví dụ: nguyên tố Khí linh hoạt của Song Tử, nguyên tố Đất kiên nhẫn của Ma Kết...) cùng những đặc trưng hành vi của con số chủ đạo đó (ví dụ: số 7 - người tìm kiếm chân lý, số 11 - trực giác tâm linh...) đang bổ trợ tích cực hay cản trở/tạo ra nút thắt nào đối với câu hỏi cụ thể của họ.\n" +
                "- Bài luận giải phải đan cài nhuần nhuyễn cả 3 yếu tố (Tarot, Cung hoàng đạo, Số chủ đạo) để đưa ra câu trả lời thuyết phục, mang tính cá nhân hóa tuyệt đối, cụ thể và thấu suốt nhất.\n\n" +
                "Hãy trả về kết quả dưới định dạng JSON chính xác như sau (không kèm ký tự markdown ```json):\n" +
                "{\n" +
                "  \"cardName\": \"Tên tiếng Anh chính xác của lá bài bạn chọn (ví dụ: 'The Moon' hoặc 'Five of Swords')\",\n" +
                "  \"message\": \"nội dung luận giải tâm lý chiều sâu tập trung vào vấn đề bằng tiếng Việt...\",\n" +
                "  \"advice\": \"lời khuyên hành động thực tế tháo gỡ vấn đề bằng tiếng Việt...\"\n" +
                "}",
                description, mood
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
