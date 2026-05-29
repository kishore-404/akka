import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Star, Target, Flame, TrendingUp, PenTool, 
  FlaskConical, BookMarked, Download, FileSpreadsheet, 
  Plus, X, ChevronRight, LayoutDashboard, Settings, LogOut 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ----------------------------------------------------------------------
// COMPONENT: Top Navigation Bar
// ----------------------------------------------------------------------
const TopNavigation = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'GET' });
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
             <LayoutDashboard size={18} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">Akka Learning</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            System Online
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-medium text-slate-700 group-hover:border-slate-300 transition-colors">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

// ----------------------------------------------------------------------
// COMPONENT: Metric Card
// ----------------------------------------------------------------------
const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
      className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col hover:border-slate-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-lg", colorClass)}>
          <Icon size={20} />
        </div>
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// COMPONENT: Create Deck Modal
// ----------------------------------------------------------------------
const CreateDeckModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target;
    const name = form.name.value;
    const subject = form.subject.value;
    
    await onSubmit({ name, subject });
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden pointer-events-auto"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Create New Deck</h3>
                <button 
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Deck Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:text-sm"
                      placeholder="e.g., Python Fundamentals"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Subject <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:text-sm"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-70 transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Create Deck'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// ----------------------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ----------------------------------------------------------------------
const Dashboard = () => {
  // State initialization mirroring your backend data structure
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    username: 'Student',
    stars: 0,
    total_points: 0,
    streak: 0,
  });
  const [stats, setStats] = useState({
    total_mastered: 0,
    total_cards: 0,
  });
  const [decks, setDecks] = useState([]);

  // Data Fetching Simulation (Replace with actual fetch calls later)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulated API Call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock Data based on your template
        setUserData({
          username: 'Kishore',
          stars: 12,
          total_points: 1250,
          streak: 5,
        });
        setStats({
          total_mastered: 45,
          total_cards: 120,
        });
        setDecks([
          { id: 1, name: 'Data Structures', subject: 'Computer Science', count: 40 },
          { id: 2, name: 'Machine Learning Basics', subject: 'AI', count: 25 },
          { id: 3, name: 'React Hooks', subject: 'Web Dev', count: 15 },
        ]);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handler for creating a new deck
  const handleCreateDeck = async (deckData) => {
    try {
      // Example POST request to your backend:
      /*
      const formData = new URLSearchParams();
      formData.append('name', deckData.name);
      formData.append('subject', deckData.subject);
      const res = await fetch('/api/create_deck', { method: 'POST', body: formData });
      if (res.ok) { ...reload decks... }
      */
      
      // Simulating a successful creation for the UI
      await new Promise(resolve => setTimeout(resolve, 500));
      const newDeck = {
        id: Date.now(),
        name: deckData.name,
        subject: deckData.subject || 'Uncategorized',
        count: 0
      };
      setDecks(prev => [newDeck, ...prev]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create deck", error);
    }
  };

  // Calculate progress percentage securely
  const progressPercentage = stats.total_cards > 0 
    ? Math.round((stats.total_mastered / stats.total_cards) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-[#B1DDF1]">
      <TopNavigation user={userData} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
            Welcome back, {userData.username}.
          </h1>
          <p className="text-slate-500 text-base sm:text-lg">
            Here is what's happening with your learning progress today.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <MetricCard 
            title="Cards Mastered" 
            value={`${stats.total_mastered} / ${stats.total_cards}`}
            subtitle="Total retention rate"
            icon={BookOpen}
            colorClass="bg-blue-50 text-blue-600"
            delay={0.1}
          />
          <MetricCard 
            title="Stars Earned" 
            value={userData.stars}
            subtitle="1 star per 100 points"
            icon={Star}
            colorClass="bg-amber-50 text-amber-600"
            delay={0.2}
          />
          <MetricCard 
            title="Total Points" 
            value={userData.total_points.toLocaleString()}
            subtitle="+5 to +20 per card"
            icon={Target}
            colorClass="bg-emerald-50 text-emerald-600"
            delay={0.3}
          />
          <MetricCard 
            title="Day Streak" 
            value={userData.streak}
            subtitle="Consistent daily study"
            icon={Flame}
            colorClass="bg-rose-50 text-rose-600"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Column (Left/Center) */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Overall Progress Section */}
            <motion.section 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Overall Progress</h2>
                  <p className="text-sm text-slate-500 mt-1">Your mastery across all decks.</p>
                </div>
                <div className="text-2xl font-bold text-slate-900">{progressPercentage}%</div>
              </div>
              
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                  className="absolute top-0 left-0 h-full bg-slate-900 rounded-full"
                />
              </div>
              <div className="mt-4 flex justify-between text-sm font-medium">
                <span className="text-slate-500">0%</span>
                <span className="text-slate-700">{stats.total_mastered} mastered</span>
                <span className="text-slate-500">100%</span>
              </div>
            </motion.section>

            {/* Decks Section */}
            <motion.section 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-semibold">Your Decks</h2>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Plus size={16} />
                  New Deck
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {decks.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <BookMarked size={24} />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 mb-1">No decks found</h3>
                    <p className="text-sm text-slate-500 mb-4">Get started by creating your first study deck.</p>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Plus size={16} />
                      Create Deck
                    </button>
                  </div>
                ) : (
                  decks.map((deck) => (
                    <div key={deck.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                      <div>
                        <h3 className="text-base font-medium text-slate-900 mb-1">{deck.name}</h3>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-slate-600 bg-slate-100 font-medium">
                            {deck.subject}
                          </span>
                          <span className="text-slate-400 font-medium">{deck.count} cards</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/decks/${deck.id}`}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-center transition-colors"
                        >
                          View
                        </Link>
                        <Link 
                          to={`/study/${deck.id}`}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 text-center transition-colors"
                        >
                          Study
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>
          </div>

          {/* Side Column (Right) - Quick Actions */}
          <div className="lg:col-span-1">
            <motion.section 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24"
            >
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-col gap-2">
                
                <Link to="/progress" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">View Progress Charts</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </Link>

                <Link to="/quiz" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <PenTool size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Take a Quiz</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </Link>

                <Link to="/research" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                      <FlaskConical size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Research Dashboard</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </Link>

                <Link to="/materials" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Learning Materials</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </Link>

                <div className="h-px bg-slate-100 my-2" />

                <button className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Export to Excel</span>
                  </div>
                  <Download size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
                
                <button className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Download size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Export to CSV</span>
                  </div>
                </button>

              </div>
            </motion.section>
          </div>

        </div>
      </main>

      <CreateDeckModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateDeck}
      />
    </div>
  );
};

export default Dashboard;