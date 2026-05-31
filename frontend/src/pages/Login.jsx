import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Logo from '../../public/auxlogo.jpg';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  
  // 🌟 NEW: State to handle the OTP transition
  const [step, setStep] = useState('login'); // 'login' | 'otp'
  const [savedUsername, setSavedUsername] = useState('');
  const [otp, setOtp] = useState('');

  // ==========================================
  // Step 1: Initial Login Submit
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_otp) {
          // 🚨 Backend caught an Admin! Switch to OTP view.
          setSavedUsername(username);
          setStep('otp');
          setStatus({ type: 'success', message: data.message || 'OTP sent securely.' });
        } else {
          // Normal student login
          setStatus({ type: 'success', message: 'Authentication successful. Redirecting...' });
          setTimeout(() => navigate(data.redirect || '/dashboard'), 1000); 
        }
      } else {
        setStatus({ type: 'error', message: data.error || 'Invalid username or password.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Secure connection failed. Please check your network.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // Step 2: OTP Verification Submit
  // ==========================================
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/verify_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: savedUsername, otp: otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Verification complete. Entering Command Center...' });
        setTimeout(() => navigate(data.redirect || '/admin_dashboard'), 1000); 
      } else {
        setStatus({ type: 'error', message: data.error || 'Invalid OTP code.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Connection failed during verification.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white font-sans selection:bg-[#B1DDF1] selection:text-slate-900">
      
      {/* Branding Panel */}
      <div className="w-full lg:w-1/2 relative bg-[#111827] flex flex-col items-center justify-center lg:items-start lg:justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 0% 0%, #B1DDF1 0%, transparent 60%)' }}
        />
        <div className="hidden lg:block absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none translate-x-1/3 translate-y-1/3 border-[1px] border-[#B1DDF1]" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 text-center lg:text-left w-full max-w-2xl lg:max-w-none">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center p-2 shadow-lg">
             <img 
               src={Logo}
               alt="Auxilium College Logo" 
               className="w-full h-full object-contain"
               onError={(e) => {
                 e.target.style.display = 'none';
                 e.target.parentElement.innerHTML = '<span class="text-[#111827] font-bold text-xs">LOGO</span>';
               }}
             />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              AUXILIUM COLLEGE <span className="font-semibold block sm:inline mt-1 sm:mt-0 text-xl sm:text-3xl">(AUTONOMOUS)</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium mt-3 sm:mt-2">
              Gandhi Nagar, Vellore - 632006, Tamil Nadu, India
            </p>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
              Accredited by NAAC with A++ Grade | Ranked Among Top Colleges in India
            </p>
          </div>
        </div>

        <div className="hidden lg:block relative z-10 max-w-md mt-24">
          <h2 className="text-3xl text-white font-medium tracking-tight leading-tight mb-4">
            Welcome to the Learning Portal
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Securely access your academic dashboard to manage study materials, monitor progress, and engage with the curriculum.
          </p>
        </div>

        <div className="hidden lg:flex relative z-10 items-center gap-4 text-slate-500 text-sm mt-auto pt-12">
          <span>© {new Date().getFullYear()} Auxilium College</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
        </div>
      </div>

      {/* Dynamic Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white min-h-[60vh] lg:min-h-0 overflow-hidden relative">
        <div className="w-full max-w-[400px]">
          
          <AnimatePresence mode="wait">
            {/* Status Banner */}
            {status.message && (
              <motion.div
                key="status-banner"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className={cn(
                  "overflow-hidden rounded-lg border p-4 flex items-start gap-3 text-sm",
                  status.type === 'success' 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-red-50 border-red-200 text-red-800"
                )}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                )}
                <span className="font-medium pt-0.5">{status.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {step === 'login' ? (
              
              // ==========================================
              // STANDARD LOGIN VIEW
              // ==========================================
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Sign in to your account</h2>
                  <p className="text-slate-500 text-sm">Enter your credentials to continue.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      required
                      className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827] sm:text-sm transition-colors"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        required
                        className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827] sm:text-sm transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 active:scale-[0.98] transition-all"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>Sign In <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                  Need an account?{' '}
                  <Link to="/register" className="font-semibold text-[#111827] hover:underline underline-offset-4">
                    Register here
                  </Link>
                </div>
              </motion.div>

            ) : (

              // ==========================================
              // OTP VERIFICATION VIEW
              // ==========================================
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <button 
                  onClick={() => {
                    setStep('login');
                    setStatus({ type: null, message: '' });
                    setOtp('');
                  }}
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                >
                  <ArrowLeft size={16} /> Back to login
                </button>

                <div className="mb-8 text-center lg:text-left">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto lg:mx-0">
                    <ShieldCheck size={24} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Two-Factor Authentication</h2>
                  <p className="text-slate-500 text-sm">Please enter the 6-digit verification code sent to your admin email address.</p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <label htmlFor="otp" className="block text-sm font-medium text-slate-700 text-center lg:text-left">
                      Secure Code
                    </label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Only allow numbers
                      maxLength={6}
                      required
                      autoComplete="one-time-code"
                      className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-4 text-slate-900 text-center text-2xl tracking-[0.5em] font-mono focus:bg-white focus:border-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827] transition-all"
                      placeholder="------"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-70 active:scale-[0.98] transition-all"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>Verify Identity</>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="lg:hidden flex flex-wrap justify-center gap-3 text-xs text-slate-400 mt-12">
            <span>© {new Date().getFullYear()} Auxilium College</span>
            <span>•</span>
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;