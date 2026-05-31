import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Frown, CheckCircle, Flame, ArrowLeft, Trophy, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const StudyCard = () => {
  const navigate = useNavigate();
  
  // 1. Grab the Deck ID and Algorithm from the URL
  const { deckId, algo } = useParams(); 
  
  const hasInitialized = useRef(false);
  const [data, setData] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
const [isRetrying, setIsRetrying] = useState(false);
  // Fetch a single card from the active session
 const fetchCard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://kishoredev.pythonanywhere.com/study/current_card', { credentials: 'include' });
      const result = await response.json();
      
      if (result.status === 'completed') {
        setIsCompleted(true);
        setCompletionStats(result);
      } else {
        setData(result);
        setIsFlipped(false);
        setStartTime(Date.now());
        setIsRetrying(false); // <--- ADD THIS: Reset retry state for new cards
      }
    } catch (err) {
      console.error(err);
      setError("Lost connection to the study server.");
    } finally {
      setIsLoading(false);
    }
  };

  // INITIALIZE THE SESSION
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const startSession = async () => {
      try {
        setIsLoading(true);
        
        // Tell Flask to load the specific deck and algorithm into memory
        const response = await fetch(`https://kishoredev.pythonanywhere.com/study/start/${deckId}/${algo || 'all'}`, {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to initialize study session.");
        }

        // Now that the backend is ready, fetch the first card!
        await fetchCard();
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, algo]);


  const handleRate = async (rating) => {
    const responseTime = (Date.now() - startTime) / 1000;
    const rtFloat = responseTime.toFixed(2);
    
    setIsLoading(true); 

    try {
      // ONLY send the rating to the backend if this is the FIRST attempt.
      // This stops the backend from skipping cards when you retry.
      if (!isRetrying) {
        await fetch(`https://kishoredev.pythonanywhere.com/study/rate/${data.card.id}/${rating}/${rtFloat}`, {
          method: 'POST',
          credentials: 'include'
        });
      }
      
      if (rating === 1) {
        // They want to retry. Stay on the card.
        setIsFlipped(false);       
        setStartTime(Date.now());  
        setIsRetrying(true);       // <--- Mark that they are now retrying
        setIsLoading(false);       
      } else {
        // They are done with this card. Fetch the next one.
        setIsRetrying(false);      // <--- Reset state
        fetchCard();               // This will successfully fetch Question 2
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // ----- ERROR STATE -----
  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Session Error</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ----- COMPLETION SCREEN -----
  if (isCompleted && completionStats) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
          <Trophy size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Study Session Complete!</h1>
        <p className="text-slate-500 mb-8 max-w-md">
          Great job! You reviewed {completionStats.total} cards. The spaced repetition algorithm has updated your next review dates.
        </p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500 font-medium mb-1">Accuracy</p>
            <p className="text-2xl font-bold text-emerald-600">{completionStats.accuracy}%</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500 font-medium mb-1">Points Earned</p>
            <p className="text-2xl font-bold text-amber-500">+{completionStats.points_earned}</p>
          </div>
        </div>

        <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-[#111827] text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ----- LOADING STATE -----
  if (isLoading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-3xl min-h-screen mx-auto px-4 py-8 lg:py-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/materials')} className="text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold mb-1">
            <Brain size={14} /> {data.card.algorithm} Mode
          </div>
          <p className="text-sm font-medium text-slate-500">Card {data.idx} of {data.total}</p>
        </div>
        <div className="w-6" /> 
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-10 overflow-hidden">
        <motion.div 
          initial={{ width: `${((data.idx - 1) / data.total) * 100}%` }}
          animate={{ width: `${(data.idx / data.total) * 100}%` }}
          className="h-full bg-blue-500 rounded-full"
        />
      </div>

      {/* 3D Flipping Flashcard */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] perspective-1000 mb-8 cursor-pointer" onClick={() => !isFlipped && setIsFlipped(true)}>
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card (Question) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-lg hover:shadow-xl hover:border-slate-300 transition-all">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Question</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-slate-900 leading-tight">
              {data.card.question}
            </h2>
            <p className="absolute bottom-6 text-slate-400 text-sm animate-pulse">Tap to reveal answer</p>
          </div>

          {/* Back of Card (Answer) */}
          <div 
            className="absolute inset-0 w-full h-full backface-hidden bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ transform: 'rotateX(180deg)' }}
          >
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Answer</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-white leading-tight">
              {data.card.answer}
            </h2>
          </div>
        </motion.div>
      </div>

      {/* Rating Controls */}
      <div className="h-24">
        <AnimatePresence>
          {isFlipped && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              <button onClick={() => handleRate(1)} className="group flex flex-col items-center p-3 sm:p-4 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all active:scale-95">
                <Frown size={24} className="text-red-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-red-700">Again</span>
              </button>
              
              <button onClick={() => handleRate(2)} className="group flex flex-col items-center p-3 sm:p-4 bg-white border border-orange-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all active:scale-95">
                <AlertCircle size={24} className="text-orange-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-orange-700">Hard</span>
              </button>
              
              <button onClick={() => handleRate(3)} className="group flex flex-col items-center p-3 sm:p-4 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all active:scale-95">
                <CheckCircle size={24} className="text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-emerald-700">Good</span>
              </button>
              
              <button onClick={() => handleRate(4)} className="group flex flex-col items-center p-3 sm:p-4 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95">
                <Flame size={24} className="text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-blue-700">Easy</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default StudyCard;