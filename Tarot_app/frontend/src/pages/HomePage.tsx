import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Book, User as UserIcon, Heart } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Chào {user.displayName || 'bạn'},</h1>
          <p className="text-white/60 text-sm">Hôm nay bạn cảm thấy thế nào?</p>
        </div>
        <button onClick={handleLogout} className="text-sm border border-white/20 px-3 py-1 rounded-lg hover:bg-white/10">
          Đăng xuất
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 mb-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-cosmic-pink/20 rounded-full blur-2xl -mr-10 -mt-10" />
        <Sparkles className="w-10 h-10 text-cosmic-gold mb-4" />
        <h2 className="text-xl font-serif mb-2">Trải bài của ngày</h2>
        <p className="text-white/70 text-sm mb-6">Rút một lá bài để nhận thông điệp từ vũ trụ dành riêng cho cảm xúc của bạn hôm nay.</p>
        <button className="btn-primary w-full shadow-[0_0_15px_rgba(232,110,173,0.3)]">
          Rút Tarot
        </button>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center"
        >
          <Book className="w-8 h-8 text-cosmic-teal mb-3" />
          <h3 className="font-serif font-medium mb-1">Nhật ký</h3>
          <p className="text-xs text-white/50">Ghi lại cảm xúc</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-5 flex flex-col items-center justify-center text-center"
        >
          <Heart className="w-8 h-8 text-cosmic-pink mb-3" />
          <h3 className="font-serif font-medium mb-1">Kết nối</h3>
          <p className="text-xs text-white/50">Người giống bạn</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 glass-panel p-5"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-white/70" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{user.soulId || 'Soul-XXXXX'}</h3>
            <p className="text-xs text-cosmic-teal">Hồ sơ nội tâm: Đang hình thành</p>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-gradient-to-r from-cosmic-teal to-cosmic-pink h-2 rounded-full" style={{ width: '25%' }} />
        </div>
        <p className="text-xs text-center text-white/50 mt-2">Năng lượng: 25/100</p>
      </motion.div>

    </div>
  );
}
