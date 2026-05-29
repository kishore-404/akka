import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    const form = e.target;
    const username = form.username.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;

    // 1. Client-Side Validation
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match. Please try again.' });
      setIsLoading(false);
      return;
    }

    if (password.length < 4) {
      setStatus({ type: 'error', message: 'Password must be at least 4 characters long.' });
      setIsLoading(false);
      return;
    }

    // 2. Network Request via Vite Proxy
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('confirm_password', confirmPassword);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual', 
      });

      // Assuming Flask redirects to /login or /dashboard after successful registration
      if (response.type === 'opaqueredirect' || response.status === 302) {
        setStatus({ type: 'success', message: 'Account created successfully. Redirecting...' });
        setTimeout(() => navigate('/login'), 1500); 
      } 
      else if (response.ok) {
         setStatus({ type: 'success', message: 'Account created successfully. Redirecting...' });
         setTimeout(() => navigate('/login'), 1500); 
      }
      else {
        // If Flask returns a 400 series error (e.g., username taken)
        setStatus({ 
          type: 'error', 
          message: 'Registration failed. Username or email may already be in use.' 
        });
      }
    } catch (error) {
      console.error("Registration Error:", error);
      setStatus({ type: 'error', message: 'Secure connection failed. Please check your network.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white font-sans selection:bg-[#B1DDF1] selection:text-slate-900">
      
      {/* Branding Panel (Exact match to Login for seamless transitions) */}
      <div className="w-full lg:w-1/2 relative bg-[#111827] flex flex-col items-center justify-center lg:items-start lg:justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 0% 0%, #B1DDF1 0%, transparent 60%)' }}
        />
        <div className="hidden lg:block absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none translate-x-1/3 translate-y-1/3 border-[1px] border-[#B1DDF1]" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 text-center lg:text-left w-full max-w-2xl lg:max-w-none">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center p-2 shadow-lg">
             <img 
               src="/static/auxlogo.jpg" 
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
            Join the Learning Portal
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Create your academic account to securely access study materials, track your progress, and manage your learning journey.
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

      {/* Register Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white min-h-[60vh] lg:min-h-0">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Create an account</h2>
            <p className="text-slate-500 text-sm">Register to access the learning portal.</p>
          </div>

          <AnimatePresence mode="wait">
            {status.message && (
              <motion.div
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

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827] sm:text-sm transition-colors"
                placeholder="Choose a username"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827] sm:text-sm transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827] sm:text-sm transition-colors"
                  placeholder="Min 4 characters"
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

            <div className="space-y-1.5">
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm_password"
                  name="confirm_password"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#111827] focus:outline-none focus:ring-1 focus:ring-[#111827] sm:text-sm transition-colors"
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#111827] px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 active:scale-[0.98] transition-all mt-6"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  Register Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#111827] hover:underline underline-offset-4">
              Login here
            </Link>
          </div>

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

export default Register;