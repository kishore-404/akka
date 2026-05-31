import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, AlertCircle, ChevronRight, X, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const QuizTake = () => {
  const navigate = useNavigate();
  const { type, idOrNum } = useParams(); 
  
  const hasInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const firstOptionRef = useRef(null);

  // ==========================================
  // 1. Fetch Question Data on Mount (Cache-Busted)
  // ==========================================
  const fetchCurrentQuestion = async () => {
    try {
      if (!quizData) setIsLoading(true); 
      
      // 🌟 FIXED: Removed /api prefix
      const response = await fetch(`/api/quiz/take_data?_t=${Date.now()}`, { 
        method: 'GET', 
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store',
        credentials: 'include' 
      });
      
      const data = await response.json();
      
      if (data.status === 'completed') {
          navigate('/quiz/results');
          return;
      }
      
      setQuizData(data);
      setTimeLeft(data.time_left);
      setSelectedAnswer('');
      setError(null);
      
      setTimeout(() => {
        if (firstOptionRef.current) firstOptionRef.current.focus();
      }, 100);

    } catch (err) {
      setError("Lost connection to the quiz server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const startQuiz = async () => {
      try {
        setIsLoading(true);
        
        // 🌟 FIXED: Removed /api prefixes
        const initUrl = type === 'deck' 
            ? `/api/quiz/start/deck/${idOrNum}?_t=${Date.now()}` 
            : `/api/quiz/start/all/${idOrNum}?_t=${Date.now()}`;

        const initResponse = await fetch(initUrl, { 
          method: 'GET', 
          headers: { 'Cache-Control': 'no-cache' },
          cache: 'no-store',
          credentials: 'include' 
        });
        
        if (!initResponse.ok) throw new Error('Failed to initialize quiz');

        await fetchCurrentQuestion();
      } catch (err) {
        console.error(err);
        setError("Failed to start the quiz. Ensure you have enough cards.");
        setIsLoading(false);
      }
    };

    startQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, idOrNum]);

  // ==========================================
  // 2. Countdown Timer Logic & Auto-Submit
  // ==========================================
  useEffect(() => {
    if (!quizData || timeLeft <= 0) {
      if (quizData && timeLeft <= 0 && !isSubmitting) {
        handleAnswerSubmit();
      }
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizData]);

  // ==========================================
  // 3. Answer Submission
  // ==========================================
  const handleAnswerSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new URLSearchParams();
      formData.append('answer', selectedAnswer || '');

      // 🌟 FIXED: Removed /api prefix
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        credentials: 'include'
      });

      if (response.ok) {
        await fetchCurrentQuestion(); 
      } else {
        throw new Error('Failed to submit answer');
      }
    } catch (err) {
      setError("Failed to save answer. Please check your connection.");
    } finally {
      setIsSubmitting(false); 
    }
  };

  const cleanQuestionText = (text) => {
    if (!text) return '';
    return text.replace(/^(Q?\d+[\.\)\:]\s*)/i, '').trim();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading && !quizData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your assessment...</p>
      </div>
    );
  }

  if (error && !quizData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Quiz Interrupted</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => navigate('/quiz-select')} className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">
          Return to Quizzes
        </button>
      </div>
    );
  }

  if (!quizData) return null;

  const progressPercentage = ((quizData.current - 1) / quizData.total) * 100;
  const isTimeCritical = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#B1DDF1] selection:text-slate-900 pb-20">
      
      {/* Top Progress & Timer Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {quizData.deck_name}
              </p>
              <h1 className="text-lg font-bold text-slate-900">
                Question {quizData.current} <span className="text-slate-400 font-medium">of {quizData.total}</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.confirm("Exit quiz? Your progress will be lost.")) {
                    navigate('/quiz-select');
                  }
                }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Exit Quiz"
              >
                <X size={20} />
              </button>
              
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold border transition-colors",
                isTimeCritical 
                  ? "bg-red-50 text-red-600 border-red-200 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.2)]" 
                  : "bg-slate-100 text-slate-700 border-slate-200"
              )}>
                {isTimeCritical ? <AlertCircle size={18} /> : <Clock size={18} />}
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: `${Math.max(0, progressPercentage - (100/quizData.total))}%` }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-[#111827] rounded-full"
            />
          </div>

        </div>
      </div>

      {/* Main Question Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={quizData.current} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question Text */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm mb-8">
              <h2 className="text-xl sm:text-2xl font-medium text-slate-900 leading-relaxed">
                {cleanQuestionText(quizData.card.question)}
              </h2>
            </div>

            {/* Answer Form */}
            <form onSubmit={handleAnswerSubmit} className="space-y-6">
              <div className="space-y-3">
                {quizData.options.map((option, index) => (
                  <label 
                    key={index}
                    className={cn(
                      "flex items-center p-4 sm:p-5 border-2 rounded-xl cursor-pointer transition-all",
                      selectedAnswer === option 
                        ? "border-[#111827] bg-slate-50" 
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    <div className="relative flex items-center justify-center w-5 h-5 mr-4 flex-shrink-0">
                      <input
                        type="radio"
                        name="quiz_answer"
                        value={option}
                        checked={selectedAnswer === option}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        ref={index === 0 ? firstOptionRef : null} 
                        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:ring-offset-2 transition-colors cursor-pointer"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-[#111827] rounded-full scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                    </div>
                    <span className={cn(
                      "text-base sm:text-lg leading-snug cursor-pointer",
                      selectedAnswer === option ? "text-slate-900 font-medium" : "text-slate-700"
                    )}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={!selectedAnswer || isSubmitting || timeLeft <= 0}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-[#111827] text-white rounded-xl font-semibold shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {quizData.current === quizData.total ? 'Finish Assessment' : 'Next Question'}
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
};

export default QuizTake;