import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BrainCircuit, Trophy, Target, Timer, 
  Zap, BookOpen, AlertCircle, PlayCircle, Flame
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from "../config";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ----------------------------------------------------------------------
// Animation Variants for Staggered Loading
// ----------------------------------------------------------------------
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
const QuizSelect = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/quiz_select_data`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include' 
        });

        if (!response.ok) throw new Error('Failed to fetch quiz data');

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("API Error:", err);
        setError("Unable to load quiz modules. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading assessments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Modules Unavailable</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const safeData = data || {};
  const userDecks = safeData.user_decks || [];

  return (
    <div className="w-full p-7">
      
      {/* Header Area */}
      <div className="mb-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
          Knowledge Assessments
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl">
          Test your retention and understanding. Choose a comprehensive exam or focus on a specific unit.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        
        {/* Progress Summary Section */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Quiz Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Quizzes Taken</p>
                <p className="text-2xl font-bold text-slate-900">{safeData.quizzes_taken || 0}</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center">
                <BrainCircuit size={24} />
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Average Score</p>
                <p className="text-2xl font-bold text-emerald-600">{safeData.avg_score || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <Target size={24} />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Best Score</p>
                <p className="text-2xl font-bold text-blue-600">{safeData.best_score || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Trophy size={24} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Full Course Quizzes Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Comprehensive Exams</h2>
            <p className="text-sm text-slate-500">Randomized questions pulled from all your active decks.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Quick Check */}
            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/quiz/start/all/10')}
              className="group relative bg-white border border-slate-200 rounded-2xl p-6 text-left overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={64} className="text-emerald-500 -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">
                  <Zap size={14} /> Quick
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Quick Check</h3>
                <p className="text-slate-500 text-sm mb-6">A fast-paced refresher to keep your memory sharp.</p>
                
                <div className="flex items-center gap-4 text-sm font-medium text-slate-700 mb-6">
                  <span className="flex items-center gap-1.5"><BookOpen size={16} className="text-slate-400" /> 10 Qs</span>
                  <span className="flex items-center gap-1.5"><Timer size={16} className="text-slate-400" /> 5 Min</span>
                </div>
                
                <div className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
                  <PlayCircle size={18} /> Start Assessment
                </div>
              </div>
            </motion.button>

            {/* Standard Test */}
            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/quiz/start/all/25')}
              className="group relative bg-white border border-slate-200 rounded-2xl p-6 text-left overflow-hidden hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={64} className="text-blue-500 -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 border border-blue-100">
                  <Target size={14} /> Standard
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Standard Test</h3>
                <p className="text-slate-500 text-sm mb-6">A balanced evaluation of your overall curriculum knowledge.</p>
                
                <div className="flex items-center gap-4 text-sm font-medium text-slate-700 mb-6">
                  <span className="flex items-center gap-1.5"><BookOpen size={16} className="text-slate-400" /> 25 Qs</span>
                  <span className="flex items-center gap-1.5"><Timer size={16} className="text-slate-400" /> 12 Min</span>
                </div>
                
                <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                  <PlayCircle size={18} /> Start Assessment
                </div>
              </div>
            </motion.button>

            {/* Challenge Exam */}
            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/quiz/start/all/50')}
              className="group relative bg-white border border-slate-200 rounded-2xl p-6 text-left overflow-hidden hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/10 active:scale-[0.98] transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame size={64} className="text-rose-500 -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-4 border border-rose-100">
                  <Flame size={14} /> Hard
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Challenge Exam</h3>
                <p className="text-slate-500 text-sm mb-6">A rigorous, deep-dive examination to test true mastery.</p>
                
                <div className="flex items-center gap-4 text-sm font-medium text-slate-700 mb-6">
                  <span className="flex items-center gap-1.5"><BookOpen size={16} className="text-slate-400" /> 50 Qs</span>
                  <span className="flex items-center gap-1.5"><Timer size={16} className="text-slate-400" /> 25 Min</span>
                </div>
                
                <div className="flex items-center gap-2 text-rose-600 font-semibold group-hover:translate-x-1 transition-transform">
                  <PlayCircle size={18} /> Start Challenge
                </div>
              </div>
            </motion.button>

          </div>
        </section>

        {/* Unit-wise Quizzes Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Unit-wise Quizzes</h2>
              <p className="text-sm text-slate-500">Target specific topics and decks. Standard 25 question format.</p>
            </div>
          </div>

          {userDecks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No decks available</p>
              <p className="text-slate-400 text-sm mt-1">Create and populate decks to unlock unit quizzes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {userDecks.map((deck) => (
                <motion.button
                  key={deck.id}
                  variants={itemVariants}
                  onClick={() => navigate(`/quiz/start/deck/${deck.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-slate-300 hover:shadow-sm active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#111827] rounded-lg flex items-center justify-center text-white">
                      <BookOpen size={18} />
                    </div>
                    <ArrowLeft size={16} className="text-slate-300 group-hover:text-[#111827] rotate-135 transition-colors opacity-0 group-hover:opacity-100" style={{ transform: 'rotate(135deg)' }} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 truncate">{deck.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{deck.subject || 'General'}</p>
                </motion.button>
              ))}
            </div>
          )}
        </section>

      </motion.div>
    </div>
  );
};

export default QuizSelect;