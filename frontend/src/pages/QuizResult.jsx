import React, { useState, useEffect , useRef} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Clock, Target, ArrowRight, BrainCircuit, 
  CheckCircle2, XCircle, AlertCircle, ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {  AnimatePresence } from "framer-motion";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const QuizResult = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return; // 2. Stop double-firing
    hasFetched.current = true;

    const fetchResults = async () => {
      try {
        const response = await fetch('/api/quiz/results_data', { credentials: 'include' });
        if (!response.ok) throw new Error('No quiz results found');
        const resultData = await response.json();
        setData(resultData);
      } catch (err) {
        setError("Unable to load results. You may not have an active session.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Calculating your score...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Results Unavailable</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/quiz-select" className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">
          Return to Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
      
      {/* Grand Title / Hero */}
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-xl"
          style={{ backgroundColor: `${data.color}20`, color: data.color }}
        >
          <span className="text-5xl">{data.emoji}</span>
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2"
        >
          {data.message}
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-500 font-medium"
        >
          You scored <strong className="text-slate-900">{data.score} out of {data.total}</strong> correct.
        </motion.p>
      </div>

      {/* Main Stats Grid */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Target size={24} className="mx-auto mb-2 text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Accuracy</p>
          <p className="text-2xl font-bold text-slate-900">{data.percentage}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Clock size={24} className="mx-auto mb-2 text-indigo-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Time Taken</p>
          <p className="text-2xl font-bold text-slate-900">{data.time_min}m {data.time_sec}s</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Trophy size={24} className="mx-auto mb-2 text-amber-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Points Earned</p>
          <p className="text-2xl font-bold text-slate-900">+{data.points_earned}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <BrainCircuit size={24} className="mx-auto mb-2 text-emerald-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">FSRS Acc</p>
          <p className="text-2xl font-bold text-slate-900">{data.fsrs_percent}%</p>
        </div>
      </motion.div>

      {/* Detailed Review Section */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors mb-4"
        >
          <span className="font-semibold text-slate-900">Review Answers</span>
          <ChevronDown size={20} className={cn("text-slate-400 transition-transform", showDetails && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pb-8">
                {data.answers.map((ans, idx) => (
                  <div key={idx} className={cn(
                    "p-5 rounded-2xl border",
                    ans.correct ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                  )}>
                    <div className="flex items-start gap-3">
                      {ans.correct ? (
                        <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 mb-3">{ans.question}</p>
                        <div className="space-y-1.5 text-sm">
                          <p className="flex items-center gap-2">
                            <span className="text-slate-500 w-16">Your Ans:</span>
                            <span className={ans.correct ? "text-emerald-700 font-medium" : "text-red-700 font-medium line-through decoration-red-400/50"}>
                              {ans.user || "No Answer"}
                            </span>
                          </p>
                          {!ans.correct && (
                            <p className="flex items-center gap-2">
                              <span className="text-slate-500 w-16">Correct:</span>
                              <span className="text-emerald-700 font-medium">{ans.correct_answer}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
      >
        <Link to="/quiz-select" className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
          Take Another Quiz
        </Link>
        <Link to="/dashboard" className="flex items-center justify-center gap-2 px-8 py-3 bg-[#111827] text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm">
          Return to Dashboard <ArrowRight size={18} />
        </Link>
      </motion.div>

    </div>
  );
};

export default QuizResult;