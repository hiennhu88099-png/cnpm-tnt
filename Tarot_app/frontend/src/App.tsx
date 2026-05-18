import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen relative w-full overflow-hidden">
        {/* Background cosmic effect */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-cosmic-purple/40 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-cosmic-blue/50 rounded-full blur-[80px]" />
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 w-full h-full min-h-screen">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
