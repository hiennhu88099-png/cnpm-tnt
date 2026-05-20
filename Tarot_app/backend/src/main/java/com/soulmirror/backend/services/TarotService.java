package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.TarotDrawRequest;
import com.soulmirror.backend.dto.TarotDrawResponse;
import com.soulmirror.backend.entities.TarotCard;
import com.soulmirror.backend.entities.TarotCardMeaning;
import com.soulmirror.backend.entities.TarotHistory;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.repositories.TarotCardMeaningRepository;
import com.soulmirror.backend.repositories.TarotCardRepository;
import com.soulmirror.backend.repositories.TarotHistoryRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class TarotService {

    private final TarotCardRepository tarotCardRepository;
    private final TarotCardMeaningRepository meaningRepository;
    private final TarotHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;

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
        
        List<TarotCard> allCards = tarotCardRepository.findAll();
        List<TarotCard> fallback78 = getFallback78Cards();
        
        TarotCard drawnCard = null;
        String message = "";
        String advice = "";
        
        String moodStr = request.getCurrentMood() != null ? request.getCurrentMood().name() : "NORMAL";
        
        // ─── 1. THUẬT TOÁN LLM SPIRIT GUIDE & CỰC KỲ THẤU CẢM ───
        // AI sẽ tự tay lựa chọn lá bài chuẩn xác nhất dựa trên mô tả vấn đề của người dùng
        try {
            Map<String, String> aiReading = geminiService.drawCardWithAI(moodStr, request.getDescription());
            
            if (aiReading != null && !aiReading.isEmpty() && aiReading.containsKey("cardName")) {
                String aiCardName = aiReading.get("cardName").trim();
                message = aiReading.get("message");
                advice = aiReading.get("advice");
                
                // Advanced fuzzy and multilingual card matching algorithm
                drawnCard = findBestMatchingCard(aiCardName, allCards, fallback78);
            }
        } catch (Exception e) {
            System.err.println("AI drawing card failed, falling back to heuristic topic draw: " + e.getMessage());
        }

        // ─── 2. CƠ CHẾ DỰ PHÒNG AN TOÀN CHỦ ĐỀ (HEURISTIC TOPIC FALLBACK) ───
        // Nếu AI bốc bài lỗi hoặc không tìm thấy lá bài tương thích, hệ thống sẽ tự động bốc lá bài liên quan nhất đến chủ đề
        if (drawnCard == null) {
            drawnCard = selectHeuristicCard(description, allCards, fallback78);
            
            // Sinh lời giải mặc định cá nhân hóa
            if (message == null || message.trim().isEmpty()) {
                Map<String, String> fallbackReading = geminiService.generateReading(
                    drawnCard.getNameVi() + " (" + drawnCard.getNameEn() + ")", 
                    moodStr, 
                    request.getDescription()
                );
                message = fallbackReading.get("message");
                advice = fallbackReading.get("advice");
            }
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
        }

        return TarotDrawResponse.builder()
                .cardName(drawnCard.getNameVi())
                .imageUrl(drawnCard.getImagePath() != null ? drawnCard.getImagePath() : "assets/images/tarot/" + drawnCard.getNameEn().toLowerCase().replace(" ", "_") + ".png")
                .emoji("🔮")
                .message(message)
                .advice(advice)
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
