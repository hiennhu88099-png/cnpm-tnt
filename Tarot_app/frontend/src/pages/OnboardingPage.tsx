import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const questions = [
  {
    id: 'q1LifeFeeling',
    question: 'Hiện tại, bạn cảm thấy cuộc sống của mình đang ở giai đoạn nào?',
    options: [
      { value: 'growing', label: 'Đang phát triển, nhiều động lực' },
      { value: 'stuck', label: 'Cảm thấy bế tắc, cần lối ra' },
      { value: 'searching', label: 'Đang tìm kiếm ý nghĩa và hướng đi' },
      { value: 'healing', label: 'Đang chữa lành những vết thương cũ' },
      { value: 'thriving', label: 'Bình yên và trọn vẹn' }
    ]
  },
  {
    id: 'q2SupportStyle',
    question: 'Khi gặp khó khăn, bạn thường cần điều gì nhất?',
    options: [
      { value: 'listener', label: 'Một người lắng nghe không phán xét' },
      { value: 'advice', label: 'Những lời khuyên thực tế' },
      { value: 'presence', label: 'Sự hiện diện im lặng của ai đó' },
      { value: 'space', label: 'Không gian tĩnh lặng một mình' }
    ]
  },
  {
    id: 'q3Challenge',
    question: 'Điều gì đang làm bạn trăn trở nhiều nhất dạo gần đây?',
    options: [
      { value: 'relationships', label: 'Các mối quan hệ (tình cảm, gia đình...)' },
      { value: 'career', label: 'Sự nghiệp và tài chính' },
      { value: 'identity', label: 'Không biết mình thực sự là ai' },
      { value: 'health', label: 'Sức khỏe tinh thần/thể chất' },
      { value: 'purpose', label: 'Mục đích sống' }
    ]
  }
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSelect = (value: string) => {
    const currentQ = questions[step].id;
    const newAnswers = { ...answers, [currentQ]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 400);
    } else {
      submitOnboarding(newAnswers);
    }
  };

  const submitOnboarding = async (finalAnswers: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Thêm các trường mặc định cho khớp DTO
      const payload = {
        ...finalAnswers,
        birthDate: '2000-01-01',
        q4MorningMood: 'neutral',
        q5SelfDescribe: 'Tôi đang tìm kiếm sự bình yên'
      };
      
      await axios.post('http://localhost:8081/api/v1/auth/onboarding', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.onboardingCompleted = true;
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/home');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-cosmic-pink/30 border-t-cosmic-pink rounded-full animate-spin mb-6" />
        <h3 className="text-xl font-serif">Đang phân tích Hồ sơ nội tâm...</h3>
        <p className="text-white/60 mt-2">Chúng tôi đang thiết lập không gian riêng cho bạn</p>
      </div>
    );
  }

  const currentQuestion = questions[step];

  return (
    <div className="flex flex-col min-h-screen p-6 pt-20">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-between mb-8">
          {questions.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 flex-1 mx-1 rounded-full ${idx <= step ? 'bg-cosmic-pink' : 'bg-white/20'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-serif font-bold text-center mb-8">
              {currentQuestion.question}
            </h2>

            <div className="space-y-4">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300
                    ${answers[currentQuestion.id] === option.value 
                      ? 'border-cosmic-pink bg-cosmic-pink/20 shadow-[0_0_15px_rgba(232,110,173,0.3)]' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }
                  `}
                >
                  <span className="text-lg">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
