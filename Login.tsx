import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
// import { motion } from 'motion/react';
const motion = {
  div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
};

interface LoginProps {
  onLogin: (userType: 'student' | 'landlord', email: string, password: string) => void;
  onGoogleLogin: (userType: 'student' | 'landlord') => void;
  onSignup: () => void;
  onLandlordSignup: () => void;
  onForgotPassword: (email: string) => void;
  onBack: () => void;
  isAuthenticating?: boolean;
}

export const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  onGoogleLogin, 
  onSignup,
  onLandlordSignup,
  onForgotPassword,
  onBack, 
  isAuthenticating = false 
}) => {
  const [userType, setUserType] = useState<'student' | 'landlord'>('student');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(captchaInput) !== captcha.a) {
      setCaptchaError(true);
      generateCaptcha();
      return;
    }
    onLogin(userType, email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-2 bg-white rounded-xl shadow-sm border border-slate-100 mb-4">
          <Shield className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
        <p className="text-slate-500">Sign in to your VerifiedStudentShousing account</p>
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 p-8"
      >
        {/* User Type Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
          <button
            onClick={() => setUserType('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              userType === 'student' 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="text-lg">🎓</span> Student
          </button>
          <button
            onClick={() => setUserType('landlord')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              userType === 'landlord' 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="text-lg">🏠</span> Landlord
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Verification: {captcha.q} = ?
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Result"
                className={`flex-1 px-4 py-3.5 bg-slate-50 border ${captchaError ? 'border-red-500' : 'border-slate-200'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all`}
              />
              <button 
                type="button"
                onClick={generateCaptcha}
                className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            {captchaError && <p className="text-[10px] text-red-500 font-bold ml-1">Incorrect verification code. Please try again.</p>}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20" />
              <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
            </label>
            <button 
              type="button"
              onClick={() => {
                if (!email) {
                  alert('Please enter your email address first.');
                  return;
                }
                onForgotPassword(email);
              }}
              className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isAuthenticating ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white px-4 text-slate-400">Or continue with</span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => onGoogleLogin(userType)}
            disabled={isAuthenticating}
            className="flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-bold text-slate-700">Continue with Google</span>
          </button>
        </div>
      </motion.div>

      {/* Footer Links */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-sm text-slate-500">
          Don't have an account?{' '}
          <span className="inline-flex gap-2 font-bold">
            <button 
              onClick={onSignup}
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              Sign up as Student
            </button>
            <span className="text-slate-300">|</span>
            <button 
              onClick={onLandlordSignup}
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              Sign up as Landlord
            </button>
          </span>
        </p>
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
      </div>
    </div>
  );
};
