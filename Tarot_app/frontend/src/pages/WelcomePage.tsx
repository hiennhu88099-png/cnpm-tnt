import { Link } from 'react-router-dom';
import { Sparkles, Moon, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="mb-12 relative"
      >
        <div className="absolute -inset-4 bg-cosmic-pink/20 blur-2xl rounded-full" />
        <Moon className="w-24 h-24 text-white/90 relative z-10" strokeWidth={1} />
        <Sparkles className="w-6 h-6 text-cosmic-gold absolute top-0 -right-4 animate-pulse" />
        <Star className="w-4 h-4 text-cosmic-teal absolute bottom-4 -left-6 animate-pulse delay-300" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-cosmic-pink/80 to-white">
          Soul Mirror
        </h1>
        <p className="text-lg md:text-xl text-white/70 font-light max-w-md mx-auto mb-12">
          Nền tảng chăm sóc nội tâm, nơi những tâm hồn đồng điệu tìm thấy nhau qua sự tĩnh lặng.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="flex flex-col w-full max-w-xs gap-4"
      >
        <Link to="/register" className="btn-primary w-full shadow-[0_0_20px_rgba(232,110,173,0.3)]">
          Bắt đầu hành trình
        </Link>
        <Link to="/login" className="btn-outline w-full mt-2">
          Tôi đã có tài khoản
        </Link>
      </motion.div>

    </div>
  );
}
