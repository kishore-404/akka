import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, TrendingUp, PenTool, BookOpen, 
  LogOut, Menu, FlaskConical, X, Users, AlertOctagon, ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ChatWidget from './ChatWidget';
import Logo from '../../public/auxlogo.jpg';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation(); // 🌟 Hooks into the current URL

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch user role on mount to determine which navbar to show
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/current_user', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.is_admin);
        } else {
          // If unauthorized, kick them to login
          navigate('/login');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkUserRole();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // ==========================================
  // DYNAMIC NAVIGATION LINKS
  // ==========================================
  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Progress', path: '/progress', icon: TrendingUp },
    { name: 'Quizzes', path: '/quiz-select', icon: PenTool },
    { name: 'Materials', path: '/materials', icon: BookOpen },
    { name: 'Research', path: '/research', icon: FlaskConical }
  ];

  const adminLinks = [
    { name: 'Command Center', path: '/admin_dashboard', icon: ShieldAlert },
    { name: 'Manage Students', path: '/admin/students', icon: Users },
    { name: 'Struggle Matrix', path: '/admin/matrix', icon: AlertOctagon }
  ];

  const activeLinks = isAdmin ? adminLinks : studentLinks;

  const isTakingQuiz = location.pathname.includes('/quiz') && !location.pathname.includes('/quiz-select');

  if (isLoadingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center" />;
  }
 

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#B1DDF1]">
      
      {/* ==========================================
          TIER 1: BRANDING BANNER (Dark Theme)
          ========================================== */}
      <div className="w-full bg-[#111827] text-white py-4 sm:py-6 px-4 sm:px-6 lg:px-8 shadow-md relative z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4 sm:gap-6">
          
          {/* Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center p-1.5 sm:p-2 shadow-lg">
             <img 
               src={Logo}
               alt="Auxilium College Logo" 
               className="w-full h-full object-contain"
               onError={(e) => {
                 e.target.style.display = 'none';
                 e.target.parentElement.innerHTML = '<span class="text-[#111827] font-bold text-[10px] sm:text-xs">LOGO</span>';
               }}
             />
          </div>

          {/* Text Content - Highly Responsive */}
          <div className="flex flex-col justify-center">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              AUXILIUM COLLEGE <span className="font-semibold block md:inline mt-0.5 md:mt-0 text-sm sm:text-xl lg:text-3xl text-[#B1DDF1] md:text-white">(AUTONOMOUS)</span>
            </h1>
            <p className="hidden sm:block text-slate-300 text-xs lg:text-sm font-medium mt-1 lg:mt-2">
              Gandhi Nagar, Vellore - 632006, Tamil Nadu, India
            </p>
            <p className="hidden lg:block text-slate-400 text-xs mt-1 leading-relaxed">
              Accredited by NAAC with A++ Grade | Ranked Among Top Colleges in India
            </p>
          </div>

        </div>
      </div>

      {/* ==========================================
          TIER 2: NAVIGATION BAR (Light Theme)
          ========================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              {activeLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                    isActive 
                      ? isAdmin ? "bg-red-50 text-red-700" : "bg-slate-100 text-[#111827]" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <link.icon size={18} />
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Title */}
            <div className="flex md:hidden items-center text-sm font-bold text-slate-800">
              {isAdmin ? "Admin Portal" : "Learning Portal"}
            </div>

            {/* User Actions & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 bg-white overflow-hidden shadow-lg absolute w-full"
            >
              <div className="px-4 pt-2 pb-4 space-y-1">
                {activeLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors",
                      isActive 
                        ? isAdmin ? "bg-red-50 text-red-700" : "bg-slate-100 text-[#111827]" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <link.icon size={18} />
                    {link.name}
                  </NavLink>
                ))}
                <div className="h-px bg-slate-200 my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Page Content */}
      <main className="w-full">
        <Outlet /> 
      </main>
      
      {/* 🌟 Hides ChatWidget from Admins AND from students actively taking a quiz */}
      {!isAdmin && !isTakingQuiz && <ChatWidget />}
    </div>
  );
};

export default MainLayout;