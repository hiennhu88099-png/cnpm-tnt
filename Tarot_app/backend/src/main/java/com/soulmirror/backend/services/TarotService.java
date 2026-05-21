package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.TarotDrawRequest;
import com.soulmirror.backend.dto.TarotDrawResponse;
import com.soulmirror.backend.entities.TarotCard;
import com.soulmirror.backend.entities.TarotCardMeaning;
import com.soulmirror.backend.entities.TarotHistory;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.entities.UserProfile;
import com.soulmirror.backend.repositories.TarotCardMeaningRepository;
import com.soulmirror.backend.repositories.TarotCardRepository;
import com.soulmirror.backend.repositories.TarotHistoryRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TarotService {

    private final TarotCardRepository tarotCardRepository;
    private final TarotCardMeaningRepository meaningRepository;
    private final TarotHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;

    // ─── Zodiac sign from birth date ─────────────────────────────────────────
    private String calculateZodiac(int day, int month) {
        if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Bạch Dương (Aries) - Lửa, Sao Hỏa, năng động và dũng cảm";
        if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Kim Ngưu (Taurus) - Đất, Sao Kim, kiên định và thực tế";
        if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Song Tử (Gemini) - Khí, Sao Thủy, linh hoạt và tò mò";
        if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cự Giải (Cancer) - Nước, Mặt Trăng, nhạy cảm và chăm sóc";
        if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Sư Tử (Leo) - Lửa, Mặt Trời, tự hào và lãnh đạo";
        if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Xử Nữ (Virgo) - Đất, Sao Thủy, tỉ mỉ và phân tích";
        if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Thiên Bình (Libra) - Khí, Sao Kim, cân bằng và hài hòa";
        if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Thiên Yết (Scorpio) - Nước, Sao Hỏa/Diêm Vương, bí ẩn và sâu sắc";
        if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Nhân Mã (Sagittarius) - Lửa, Sao Mộc, tự do và triết học";
        if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "Ma Kết (Capricorn) - Đất, Sao Thổ, kỷ luật và tham vọng";
        if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Bảo Bình (Aquarius) - Khí, Sao Thổ/Thiên Vương, độc lập và nhân văn";
        return "Song Ngư (Pisces) - Nước, Sao Hải Vương, mộng mơ và thấu cảm";
    }

    // ─── Life Path Number (Numerology) ───────────────────────────────────────
    private String calculateLifePath(int day, int month, int year) {
        int sum = sumDigits(day) + sumDigits(month) + sumDigits(year);
        while (sum > 9 && sum != 11 && sum != 22 && sum != 33) {
            sum = sumDigits(sum);
        }
        Map<Integer, String> meanings = Map.ofEntries(
            Map.entry(1, "số 1 - Người Tiên Phong: độc lập, lãnh đạo, ý chí sắt đá"),
            Map.entry(2, "số 2 - Người Hòa Giải: nhạy cảm, hợp tác, trực giác cao"),
            Map.entry(3, "số 3 - Người Sáng Tạo: biểu đạt, vui vẻ, nghệ thuật và giao tiếp"),
            Map.entry(4, "số 4 - Người Xây Dựng: kỷ luật, ổn định, thực tế và bền bỉ"),
            Map.entry(5, "số 5 - Người Tự Do: thay đổi, phiêu lưu, đa tài và linh hoạt"),
            Map.entry(6, "số 6 - Người Nuôi Dưỡng: trách nhiệm, yêu thương, gia đình và chữa lành"),
            Map.entry(7, "số 7 - Người Tìm Kiếm: nội tâm sâu sắc, tâm linh, trí tuệ và bí ẩn"),
            Map.entry(8, "số 8 - Người Quyền Lực: tham vọng, thành công vật chất, kinh doanh"),
            Map.entry(9, "số 9 - Người Nhân Ái: từ bi, hoàn thành sứ mệnh, cống hiến cho nhân loại"),
            Map.entry(11, "số 11 - Bậc Thầy Trực Giác: tâm linh cao, nhạy bén siêu nhiên, sứ giả ánh sáng"),
            Map.entry(22, "số 22 - Bậc Thầy Kiến Tạo: tiềm năng vô hạn, biến ước mơ thành hiện thực lớn lao"),
            Map.entry(33, "số 33 - Bậc Thầy Yêu Thương: chữa lành thế giới, trí tuệ tâm linh tối thượng")
        );
        return meanings.getOrDefault(sum, "số " + sum);
    }

    private int sumDigits(int n) {
        int s = 0;
        while (n > 0) { s += n % 10; n /= 10; }
        return s;
    }

    // ─── Translate focusArea/timeframe to Vietnamese ──────────────────────────
    private String translateFocusArea(String area) {
        if (area == null) return null;
        return switch (area.toLowerCase()) {
            case "love"    -> "Tình yêu & Các mối quan hệ";
            case "career"  -> "Sự nghiệp & Công việc";
            case "self"    -> "Bản thân & Phát triển cá nhân";
            case "finance" -> "Tài chính & Vật chất";
            case "family"  -> "Gia đình & Cộng đồng";
            default        -> area;
        };
    }

    private String translateTimeframe(String tf) {
        if (tf == null) return null;
        return switch (tf.toLowerCase()) {
            case "today"   -> "Hôm nay (năng lượng ngắn hạn)";
            case "week"    -> "Tuần này";
            case "month"   -> "Tháng này";
            case "general" -> "Tổng quan (không giới hạn thời gian)";
            default        -> tf;
        };
    }

    private String translatePersonality(String p) {
        if (p == null) return null;
        return switch (p) {
            case "Seeker"   -> "Người Tìm Kiếm - luôn khao khát ý nghĩa và chân lý";
            case "Healer"   -> "Người Chữa Lành - năng lượng chữa trị, thấu cảm sâu sắc";
            case "Dreamer"  -> "Người Mộng Mơ - trí tưởng tượng phong phú, thế giới nội tâm rộng lớn";
            case "Builder"  -> "Người Kiến Tạo - thực tế, có mục tiêu rõ ràng, hành động quyết đoán";
            case "Guardian" -> "Người Bảo Vệ - trách nhiệm cao, yêu thương và muốn gìn giữ mọi thứ";
            default         -> p;
        };
    }

    // ─── CORE: Build deep multi-layer user context ────────────────────────────
    private String buildDeepUserContext(User user, TarotDrawRequest request) {
        StringBuilder ctx = new StringBuilder();
        ctx.append("=== HỒ SƠ CÁ NHÂN CỦA NGƯỜI DÙNG ===\n");

        // Use explicit request data if provided, otherwise fallback to profile
        String name = request.getUserName() != null && !request.getUserName().trim().isEmpty() 
            ? request.getUserName().trim() 
            : user.getDisplayName();
        ctx.append("Tên: ").append(name).append("\n");

        UserProfile profile = user.getProfile();
        LocalDate bd = null;
        if (request.getBirthDate() != null && !request.getBirthDate().trim().isEmpty()) {
            try {
                bd = LocalDate.parse(request.getBirthDate().trim());
            } catch (Exception ignored) {}
        }
        if (bd == null && profile != null) {
            bd = profile.getBirthDate();
        }

        if (bd != null) {
            int day = bd.getDayOfMonth(), month = bd.getMonthValue(), year = bd.getYear();
            ctx.append("Ngày sinh: ").append(day).append("/").append(month).append("/").append(year).append("\n");

            // Layer 2: Astrology
            String zodiac = calculateZodiac(day, month);
            ctx.append("Cung hoàng đạo: ").append(zodiac).append("\n");

            // Layer 3: Numerology
            String lifePath = calculateLifePath(day, month, year);
            ctx.append("Số chủ đạo (Life Path): ").append(lifePath).append("\n");
        }

        // Layer 4: Onboarding psychographic profile
        if (profile != null) {
            ctx.append("\n=== HỒ SƠ TÂM LÝ (từ trắc nghiệm cá nhân) ===\n");
            if (profile.getPersonalityType() != null)
                ctx.append("Kiểu tính cách: ").append(translatePersonality(profile.getPersonalityType())).append("\n");
            if (profile.getQ1LifeFeeling() != null)
                ctx.append("Giai đoạn cuộc sống: ").append(profile.getQ1LifeFeeling()).append("\n");
            if (profile.getQ2SupportStyle() != null)
                ctx.append("Phong cách cần hỗ trợ: ").append(profile.getQ2SupportStyle()).append("\n");
            if (profile.getQ3Challenge() != null)
                ctx.append("Nỗi trăn trở lớn nhất: ").append(profile.getQ3Challenge()).append("\n");
        }

        // Layer 5: Current session context (optional fields from request)
        ctx.append("\n=== NGỮ CẢNH BUỔI TRẢI BÀI HÔM NAY ===\n");
        if (request.getFocusArea() != null) {
            ctx.append("Lĩnh vực cần soi: ").append(translateFocusArea(request.getFocusArea())).append("\n");
        }
        if (request.getTimeframe() != null) {
            ctx.append("Phạm vi thời gian: ").append(translateTimeframe(request.getTimeframe())).append("\n");
        }

        return ctx.toString();
    }

    public TarotDrawResponse drawCard(String email, TarotDrawRequest request) {
        String description = request.getDescription() != null ? request.getDescription().trim() : "";
        if (description.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng mô tả chi tiết vấn đề của bạn trước khi trải bài.");
        }
        if (description.length() < 15) {
            throw new IllegalArgumentException("Mô tả vấn đề quá ngắn (tối thiểu 15 ký tự). Vui lòng viết chi tiết hơn.");
        }
        if (description.length() > 500) {
            throw new IllegalArgumentException("Mô tả vấn đề quá dài (tối đa 500 ký tự). Hãy viết ngắn gọn hơn.");
        }

        String lower = description.toLowerCase();
        
        // 1. Repeating characters validation (e.g. aaaaa, qqqqq)
        if (lower.matches(".*(.)\\1{4,}.*")) {
            throw new IllegalArgumentException("Mô tả chứa ký tự lặp bất thường. Vui lòng đặt câu hỏi nghiêm túc.");
        }

        // 2. High consonant density / gibberish sequence (e.g. jklmnq)
        if (lower.matches(".*[bcdfghjklmnpqrstvwxyz]{5,}.*")) {
            throw new IllegalArgumentException("Mô tả chứa chuỗi ký tự không hợp lệ. Vui lòng tịnh tâm viết câu hỏi rõ ràng.");
        }

        User user = userRepository.findByEmail(email).orElseThrow();
        
        // Build the comprehensive deep user context
        String userContext = buildDeepUserContext(user, request);
        
        List<TarotCard> allCards = tarotCardRepository.findAll();
        List<TarotCard> fallback78 = getFallback78Cards();
        
        // ─── SYNCHRONISTIC RANDOMIZER ENGINE ───
        // We use SecureRandom for true synchronicity instead of standard Random
        java.security.SecureRandom secureRandom = new java.security.SecureRandom();
        List<TarotCard> targetList = allCards.isEmpty() ? fallback78 : allCards;
        TarotCard drawnCard = targetList.get(secureRandom.nextInt(targetList.size()));
        
        // 50% chance of the card being Reversed (Ngược)
        boolean isReversed = secureRandom.nextBoolean();
        
        String message = "";
        String advice = "";
        
        // ─── FORCED INTERPRETATION LAYER ───
        // Ép buộc AI phải diễn giải lá bài cụ thể này trên vấn đề cụ thể,
        // chấm dứt hiện tượng AI tự ý chọn những lá bài chung chung lạc quan.
        try {
            String cardFullName = drawnCard.getNameVi() + " (" + drawnCard.getNameEn() + ")";
            if (isReversed) {
                cardFullName += " - Chiều Ngược (Reversed)";
            } else {
                cardFullName += " - Chiều Thuận (Upright)";
            }
            
            Map<String, String> aiReading = geminiService.generateReading(
                cardFullName, 
                userContext, 
                request.getDescription()
            );
            message = aiReading.get("message");
            advice = aiReading.get("advice");
        } catch (Exception e) {
            System.err.println("AI interpretation failed, falling back: " + e.getMessage());
        }


        // Nếu mọi nỗ lực vẫn trống (phòng vệ cao nhất khi mạng đứt hoặc API sập hoàn toàn)
        if (message == null || message.trim().isEmpty()) {
            List<TarotCardMeaning> meanings = meaningRepository.findByTarotCardIdAndMoodContext(drawnCard.getId(), request.getCurrentMood());
            if (!meanings.isEmpty()) {
                TarotCardMeaning meaning = meanings.get(0);
                message = meaning.getMessageUpright();
                advice = meaning.getActionSuggestion();
            } else {
                // Phân tích sâu theo chủ đề của câu hỏi để đưa ra thông điệp vô cùng thấu cảm
                String cardVi = drawnCard.getNameVi();
                String cardEn = drawnCard.getNameEn();
                
                if (lower.contains("yêu") || lower.contains("tình") || lower.contains("duyên") || lower.contains("crush") || lower.contains("người cũ") || lower.contains("bạn gái") || lower.contains("bạn trai")) {
                    message = "Lá bài " + cardVi + " (" + cardEn + ") xuất hiện tại thời điểm này mang theo năng lượng đồng điệu sâu sắc với trăn trở tình cảm của bạn: \"" + description + "\". " +
                              "Trong chuyện tình cảm, lá bài này nhắc nhở bạn rằng tiềm thức đang thúc đẩy một sự chuyển hóa hoặc lựa chọn lớn. " +
                              "Có thể những nỗi sợ hãi từ quá khứ, sự phân vân hay kỳ vọng chưa được giải tỏa đang che mấp lý trí chân thật của bạn. " +
                              "Lá bài khuyên bạn hãy nhìn nhận mối quan hệ này không chỉ bằng cảm xúc nhất thời, mà bằng sự thấu hiểu sâu sắc từ tâm hồn. " +
                              "Hãy cho đối phương và chính mình không gian để dòng chảy năng lượng tự nhiên được dẫn lối.";
                    advice = "Dành một khoảng thời gian yên tĩnh tối nay để lắng nghe tiếng nói sâu thẳm từ trái tim. Viết ra giấy 3 điều bạn trân trọng nhất ở người ấy và 3 điều bạn còn e ngại để làm rõ tâm trí. Đừng vội vã quyết định.";
                } else if (lower.contains("tiền") || lower.contains("học") || lower.contains("thi") || lower.contains("việc") || lower.contains("sự nghiệp") || lower.contains("công ty") || lower.contains("kinh doanh") || lower.contains("nợ") || lower.contains("lương")) {
                    message = "Lá bài " + cardVi + " (" + cardEn + ") phản chiếu trực tiếp những nỗ lực và trăn trở về công danh, học tập hoặc tài chính của bạn: \"" + description + "\". " +
                              "Vũ trụ đang gửi đến bạn tín hiệu mạnh mẽ rằng bạn đang có đầy đủ tiềm năng và nguồn lực nội tại để xoay chuyển tình thế. " +
                              "Tuy nhiên, sự trì trệ, nỗi sợ thất bại hoặc những áp lực vô hình từ xung quanh đang làm lu mờ đi ý chí của bạn. " +
                              "Đây là thời điểm vàng để tái cấu trúc lại kế hoạch hành động, giữ vững tính kỷ luật cao và dũng cảm đối mặt với thử thách mới.";
                    advice = "Hãy lập tức viết ra danh sách 3 đầu việc quan trọng và thực tế nhất cần hoàn thành trong tuần để tháo gỡ vấn đề này. Tập trung hoàn thành triệt để từng mục và tránh để bản thân bị xao nhãng bởi các ý kiến tiêu cực bên ngoài.";
                } else {
                    message = "Lá bài " + cardVi + " (" + cardEn + ") mang năng lượng chữa lành thấu cảm đến với những băn khoăn và lo âu hiện tại của bạn: \"" + description + "\". " +
                              "Cuộc sống đang kêu gọi bạn tạm thời lùi lại một bước để có cái nhìn toàn cảnh và thông thái hơn. " +
                              "Mọi sự kiện, biến cố xuất hiện đều ẩn chứa một bài học quý giá giúp linh hồn bạn trưởng thành và kiên cường hơn. " +
                              "Hãy học cách buông bỏ những thứ nằm ngoài tầm kiểm soát, tin tưởng vào dòng chảy vô thường của vũ trụ và giữ cho tâm trí mình được bình yên.";
                    advice = "Hãy thực hành hít thở sâu 10 nhịp chậm, uống một ly nước ấm và dành 10 phút ngồi tĩnh lặng hoàn toàn trước khi đi ngủ hôm nay để thanh lọc mọi năng lượng tiêu cực.";
                }
            }
        }

        // Save history (chỉ lưu nếu card đã tồn tại trong DB, nếu không tạo dummy card tạm thời lưu)
        TarotCard cardToSave = drawnCard;
        if (drawnCard.getId() == null) {
            final TarotCard tempCard = drawnCard;
            var existing = tarotCardRepository.findAll().stream()
                .filter(c -> c.getNameEn().equalsIgnoreCase(tempCard.getNameEn()))
                .findFirst();
            if (existing.isPresent()) {
                cardToSave = existing.get();
            } else {
                try {
                    cardToSave = tarotCardRepository.save(drawnCard);
                } catch (Exception e) {
                    cardToSave = null;
                }
            }
        }

        if (cardToSave != null && cardToSave.getId() != null) {
            TarotHistory history = TarotHistory.builder()
                    .user(user)
                    .card(cardToSave)
                    .moodAtDrawTime(request.getCurrentMood())
                    .displayedMessage(message)
                    .build();
            historyRepository.save(history);
            if (message == null || message.isEmpty()) message = "Vũ trụ đang gửi tới bạn một thông điệp bí ẩn...";
            if (advice == null || advice.isEmpty()) advice = "Hãy lắng nghe trực giác của bạn.";
        }

        return TarotDrawResponse.builder()
                .cardName(drawnCard.getNameVi())
                .imageUrl(drawnCard.getImagePath() != null ? drawnCard.getImagePath() : "assets/images/tarot/" + drawnCard.getNameEn().toLowerCase().replace(" ", "_") + ".png")
                .emoji("🔮")
                .message(message)
                .advice(advice)
                .isReversed(isReversed)
                .build();
    }

    private List<TarotCard> getFallback78Cards() {
        List<TarotCard> cards = new ArrayList<>();
        
        // 1. 22 Major Arcana Cards
        String[] majorEn = {
            "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
            "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
            "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
            "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
            "Judgement", "The World"
        };
        String[] majorVi = {
            "Chàng Khờ", "Ảo Thuật Gia", "Nữ Tư Tế", "Nữ Hoàng", "Hoàng Đế",
            "Giáo Hoàng", "Tình Nhân", "Chiến Xa", "Sức Mạnh", "Ẩn Sĩ",
            "Bánh Xe Vận Mệnh", "Công Lý", "Người Treo Ngược", "Tử Thần", "Cân Bằng",
            "Ác Quỷ", "Tòa Tháp", "Ngôi Sao", "Mặt Trăng", "Mặt Trời",
            "Phán Xét", "Thế Giới"
        };
        
        for (int i = 0; i < majorEn.length; i++) {
            cards.add(TarotCard.builder()
                .nameEn(majorEn[i])
                .nameVi(majorVi[i])
                .arcana("major")
                .number(i)
                .imagePath("assets/images/tarot/" + majorEn[i].toLowerCase().replace(" ", "_") + ".png")
                .build());
        }

        // 2. 56 Minor Arcana Cards
        String[] suits = {"wands", "cups", "swords", "pentacles"};
        String[] suitsVi = {"Gậy", "Cốc", "Kiếm", "Tiền"};
        
        String[] numbersEn = {"Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"};
        String[] numbersVi = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"};
        
        for (int s = 0; s < suits.length; s++) {
            for (int n = 0; n < numbersEn.length; n++) {
                String nameEn = numbersEn[n] + " of " + suits[s].substring(0, 1).toUpperCase() + suits[s].substring(1);
                String nameVi = numbersVi[n] + " " + suitsVi[s];
                
                cards.add(TarotCard.builder()
                    .nameEn(nameEn)
                    .nameVi(nameVi)
                    .arcana("minor")
                    .suit(suits[s])
                    .number(n + 1)
                    .imagePath("assets/images/tarot/" + nameEn.toLowerCase().replace(" ", "_") + ".png")
                    .build());
            }
        }
        
        return cards;
    }

    private TarotCard findBestMatchingCard(String aiCardName, List<TarotCard> allCards, List<TarotCard> fallback78) {
        if (aiCardName == null || aiCardName.trim().isEmpty()) {
            return null;
        }

        String cleanAiName = aiCardName.trim().toLowerCase()
            .replaceAll("[^a-zA-Z0-9\\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]", "")
            .replaceAll("\\s+", " ");

        List<TarotCard> searchList = new ArrayList<>();
        if (allCards != null) searchList.addAll(allCards);
        searchList.addAll(fallback78);

        // 1. Exact or contains match on English Name
        for (TarotCard card : searchList) {
            String cleanNameEn = card.getNameEn().toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", "").replaceAll("\\s+", " ");
            if (cleanAiName.equals(cleanNameEn) || cleanAiName.contains(cleanNameEn) || cleanNameEn.contains(cleanAiName)) {
                return card;
            }
        }

        // 2. Exact or contains match on Vietnamese Name (in case Gemini returns Vietnamese card name)
        for (TarotCard card : searchList) {
            if (card.getNameVi() != null) {
                String cleanNameVi = card.getNameVi().toLowerCase().replaceAll("[^a-zA-Z0-9\\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]", "").replaceAll("\\s+", " ");
                if (cleanAiName.equals(cleanNameVi) || cleanAiName.contains(cleanNameVi) || cleanNameVi.contains(cleanAiName)) {
                    return card;
                }
            }
        }

        // 3. Number conversions (e.g. "3 of cups" -> "three of cups")
        String normalizedNumberName = normalizeNumbers(cleanAiName);
        for (TarotCard card : searchList) {
            String cleanNameEn = card.getNameEn().toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", "").replaceAll("\\s+", " ");
            String normalizedCardName = normalizeNumbers(cleanNameEn);
            if (normalizedNumberName.equals(normalizedCardName) || normalizedNumberName.contains(normalizedCardName) || normalizedCardName.contains(normalizedNumberName)) {
                return card;
            }
        }

        return null;
    }

    private String normalizeNumbers(String text) {
        return text
            .replace("1 of", "ace of")
            .replace("2 of", "two of")
            .replace("3 of", "three of")
            .replace("4 of", "four of")
            .replace("5 of", "five of")
            .replace("6 of", "six of")
            .replace("7 of", "seven of")
            .replace("8 of", "eight of")
            .replace("9 of", "nine of")
            .replace("10 of", "ten of")
            .replace("one of", "ace of")
            .replace("two of", "two of")
            .replace("three of", "three of")
            .replace("four of", "four of")
            .replace("five of", "five of")
            .replace("six of", "six of")
            .replace("seven of", "seven of")
            .replace("eight of", "eight of")
            .replace("nine of", "nine of")
            .replace("ten of", "ten of");
    }

    private TarotCard selectHeuristicCard(String description, List<TarotCard> allCards, List<TarotCard> fallback78) {
        String lower = description.toLowerCase();
        List<TarotCard> searchList = new ArrayList<>();
        if (allCards != null && !allCards.isEmpty()) {
            searchList.addAll(allCards);
        } else {
            searchList.addAll(fallback78);
        }

        String targetCardEn = "The Star"; // Default absolute fallback

        // Relationship / Love
        if (lower.contains("yêu") || lower.contains("tình") || lower.contains("ly hôn") || 
            lower.contains("cưới") || lower.contains("bạn gái") || lower.contains("bạn trai") || 
            lower.contains("hẹn hò") || lower.contains("crush") || lower.contains("người cũ")) {
            targetCardEn = "The Lovers";
        }
        // Work / Career / Study / Money
        else if (lower.contains("tiền") || lower.contains("học") || lower.contains("thi") || 
                 lower.contains("việc") || lower.contains("sự nghiệp") || lower.contains("công ty") || 
                 lower.contains("kinh doanh") || lower.contains("nợ") || lower.contains("lương")) {
            targetCardEn = "The Magician";
        }
        // Emotional distress, stress, health
        else if (lower.contains("buồn") || lower.contains("khóc") || lower.contains("mệt") || 
                 lower.contains("áp lực") || lower.contains("stress") || lower.contains("bệnh") || 
                 lower.contains("lo lắng") || lower.contains("sợ")) {
            targetCardEn = "Strength";
        }

        final String finalTarget = targetCardEn;
        return searchList.stream()
            .filter(c -> c.getNameEn().equalsIgnoreCase(finalTarget))
            .findFirst()
            .orElse(fallback78.stream().filter(c -> c.getNameEn().equalsIgnoreCase(finalTarget)).findFirst().get());
    }
}
