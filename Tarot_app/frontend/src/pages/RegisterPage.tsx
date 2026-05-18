import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Lock } from 'lucide-react';
import axios from 'axios';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8081/api/v1/auth/register', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <button onClick={() => navigate(-1)} className="p-2 w-fit rounded-full hover:bg-white/10 transition-colors mb-8">
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <h2 className="text-3xl font-serif font-bold mb-2">Tạo tài khoản</h2>
        <p className="text-white/60 mb-8">Một Soul ID ẩn danh sẽ được tạo tự động cho bạn.</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Tên hiển thị (Tên gọi thân mật)"
              className="input-field pl-12"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email"
              className="input-field pl-12"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Mật khẩu"
              className="input-field pl-12"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-8 opacity-100 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Đăng ký'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
