import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNotification } from '../../contexts/NotificationContext';

interface AdminLoginProps {
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => void;
  onForgotPassword: (email: string) => void;
  onBack: () => void;
  isAuthenticating?: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onEmailLogin, onGoogleLogin, onForgotPassword, onBack, isAuthenticating = false }) => {
  const { showNotification } = useNotification();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Simple CAPTCHA
  const [captcha, setCaptcha] = useState({ q: '', a: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ q: `${num1} + ${num2}`, a: num1 + num2 });
    setCaptchaInput('');
    setCaptchaError(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showNotification('Please enter both email and secret key.', 'error');
      return;
    }

    if (captchaInput !== captcha.a.toString()) {
      setCaptchaError(true);
      showNotification('Incorrect CAPTCHA answer.', 'error');
      generateCaptcha();
      return;
    }

    try {
      await onEmailLogin(email, password);
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md mb-4 shadow-2xl">
          <Shield className="w-10 h-10 text-orange-500" fill="currentColor" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Admin Portal</h1>
        <p className="text-slate-400 font-medium">Secure administrative access for VerifiedStudentShousing</p>
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-[40px] shadow-2xl p-10 relative z-10"
      >
        <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-orange-200/80 leading-relaxed">
            Authorized personnel only. All administrative actions are logged and monitored for security purposes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Admin Email
            </label>
            <div className="relative group">
              <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@verifiedstudentshousing.com"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Secret Key
            </label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Security Check
              </label>
              <button 
                type="button" 
                onClick={generateCaptcha}
                className="text-[10px] font-bold text-orange-500 uppercase tracking-wider hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-white font-black tracking-widest">
                {captcha.q} = ?
              </div>
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className={`w-24 px-4 py-4 bg-white/5 border ${captchaError ? 'border-rose-500' : 'border-white/10'} rounded-2xl text-center text-white font-bold focus:outline-none transition-all`}
                placeholder="Ans"
                required
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end px-1">
            <button 
              type="button"
              onClick={() => {
                if (!email) {
                  showNotification('Please enter your admin email first.', 'error');
                  return;
                }
                onForgotPassword(email);
              }}
              className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
            >
              Forgot Secret Key?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthenticating ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In to Console <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
            <span className="bg-[#0a0f1d] px-4 text-slate-500">Secure Identity Provider</span>
          </div>
        </div>

        {/* Google Login - Primary Method for Admins */}
        <button 
          onClick={onGoogleLogin}
          disabled={isAuthenticating}
          className="w-full flex items-center justify-center gap-4 py-4 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAuthenticating ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              <span className="text-base font-bold">Continue with Google Admin</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Back Link */}
      <button 
        onClick={onBack}
        className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white transition-colors relative z-10"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Public Site
      </button>

      {/* Security Footer */}
      <div className="mt-12 text-center relative z-10">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" /> End-to-End Encrypted Session
        </p>
      </div>
    </div>
  );
};
