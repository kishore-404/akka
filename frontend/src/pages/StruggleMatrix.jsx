import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Brain, AlertOctagon, TrendingDown, 
  BookOpen, Users, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const StruggleMatrix = () => {
  const [matrixData, setMatrixData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        const response = await fetch('/api/admin/struggle_matrix', { credentials: 'include' });
        
        if (!response.ok) {
          if (response.status === 403) throw new Error("Access Denied. Administrator privileges required.");
          throw new Error("Failed to load the Struggle Matrix.");
        }
        
        const data = await response.json();
        setMatrixData(data.struggle_matrix);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatrixData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Analyzing curriculum performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertOctagon size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Analysis Failed</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/admin_dashboard" className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">Back to Command Center</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 selection:bg-red-200">
      
      {/* Header Section */}
      <div className="mb-8">
        <Link to="/admin_dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Command Center
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <Brain size={24} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            The Struggle Matrix
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl mt-2">
          Identify the most frequently failed flashcards across your entire student base. Use these insights to improve your course material and focus your lectures on the hardest concepts.
        </p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg"><BookOpen size={20} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Cards Analyzed</p>
            <p className="text-xl font-bold text-slate-900">Top 10</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Threshold</p>
            <p className="text-xl font-bold text-slate-900">&lt; 3.5 Rating</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Data Source</p>
            <p className="text-xl font-bold text-slate-900">Live Reviews</p>
          </div>
        </div>
      </div>

      {/* The Matrix List */}
      <div className="space-y-4">
        {matrixData.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Struggling Concepts!</h3>
            <p className="text-slate-500">Your students are mastering all the material. There are currently no cards with an average rating below 3.5.</p>
          </div>
        ) : (
          matrixData.map((card, index) => (
            <motion.div 
              key={card.card_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 relative overflow-hidden"
            >
              {/* Threat Level Indicator Bar */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                card.avg_rating < 2.0 ? "bg-red-500" : 
                card.avg_rating < 3.0 ? "bg-orange-500" : "bg-amber-400"
              )} />

              {/* Rank & Deck */}
              <div className="flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-start sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-slate-200">#{index + 1}</span>
                </div>
                <div className="mt-2 text-right sm:text-left">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {card.deck}
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-4 leading-relaxed">
                  {card.question}
                </h3>
                
                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm",
                      card.avg_rating < 2.0 ? "bg-red-100 text-red-700" : 
                      card.avg_rating < 3.0 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {card.avg_rating}
                    </div>
                    <span className="text-sm font-medium text-slate-500">Average Rating</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                      <Users size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-700">{card.total_attempts}</span>
                      <span className="text-sm font-medium text-slate-500 ml-1">Attempts</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default StruggleMatrix;