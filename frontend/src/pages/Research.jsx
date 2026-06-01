import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, BrainCircuit, Activity, Clock, Layers, 
  Award, ChevronRight, Zap, Target, Lightbulb, ShieldAlert , Trophy
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from "../config";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Reusable Metric Comparison Bar
const ComparisonBar = ({ label, fsrsValue, sm2Value, suffix = "", lowerIsBetter = false }) => {
  const fVal = Number(fsrsValue) || 0;
  const sVal = Number(sm2Value) || 0;
  
  // Calculate winner
  let fsrsWins = false;
  let sm2Wins = false;
  if (fVal !== sVal) {
    if (lowerIsBetter) {
      fsrsWins = fVal < sVal && fVal > 0;
      sm2Wins = sVal < fVal && sVal > 0;
    } else {
      fsrsWins = fVal > sVal;
      sm2Wins = sVal > fVal;
    }
  }

  const max = Math.max(fVal, sVal, 1);
  const fWidth = `${(fVal / max) * 100}%`;
  const sWidth = `${(sVal / max) * 100}%`;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-medium mb-2">
        <span className="text-slate-700">{label}</span>
      </div>
      
      {/* FSRS Bar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-14 text-xs font-semibold text-emerald-600">FSRS</div>
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: fWidth }} transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-full rounded-full", fsrsWins ? "bg-emerald-500" : "bg-slate-300")}
          />
        </div>
        <div className="w-12 text-right text-xs font-medium text-slate-700">{fVal}{suffix}</div>
      </div>

      {/* SM-2 Bar */}
      <div className="flex items-center gap-3">
        <div className="w-14 text-xs font-semibold text-blue-600">SM-2</div>
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: sWidth }} transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-full rounded-full", sm2Wins ? "bg-blue-500" : "bg-slate-300")}
          />
        </div>
        <div className="w-12 text-right text-xs font-medium text-slate-700">{sVal}{suffix}</div>
      </div>
    </div>
  );
};

const Research = () => {
  const [data, setData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch User Stats
        const res = await fetch(`${API_BASE_URL}/research_data`, { credentials: 'include' });
        if (!res.ok) throw new Error("Failed to load research data");
        const json = await res.json();
        setData(json);

        // Attempt to fetch Admin Stats (Will silently fail for normal users)
        const adminRes = await fetch(`${API_BASE_URL}/research_statistics`, { credentials: 'include' });
        if (adminRes.ok) {
          const adminJson = await adminRes.json();
          setAdminData(adminJson);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Compiling research data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Data Unavailable</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/" className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">Return to Dashboard</Link>
      </div>
    );
  }

  const { stats, comparison, overall_winner, recommendations, achievements } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-[#B1DDF1] selection:text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            Algorithm Research Lab
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl">
            A deep dive into your learning efficiency. Compare the modern FSRS engine against the classic SM-2 algorithm.
          </p>
        </div>

        {/* Top Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <Layers className="text-blue-500 mb-2" size={20} />
            <p className="text-2xl font-bold text-slate-900">{stats.total_cards}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cards</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <Target className="text-emerald-500 mb-2" size={20} />
            <p className="text-2xl font-bold text-slate-900">{stats.total_mastered}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mastered</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <BrainCircuit className="text-emerald-600 mb-2" size={20} />
            <p className="text-2xl font-bold text-emerald-900">{stats.fsrs_count}</p>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">FSRS Cards</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
            <Activity className="text-blue-600 mb-2" size={20} />
            <p className="text-2xl font-bold text-blue-900">{stats.sm2_count}</p>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">SM-2 Cards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          
          {/* Algorithm Showdown Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">The Showdown</h2>
                  <p className="text-sm text-slate-500 mt-1">Direct performance comparison based on your study history.</p>
                </div>
                {overall_winner !== "No data yet" && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Winner</p>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold",
                      overall_winner === "FSRS" ? "bg-emerald-100 text-emerald-700" : 
                      overall_winner === "SM-2" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      <Trophy size={14} /> {overall_winner}
                    </div>
                  </div>
                )}
              </div>

              <ComparisonBar 
                label="Retention Rate (Higher is better)" 
                fsrsValue={comparison.fsrs.retention} sm2Value={comparison.sm2.retention} suffix="%" 
              />
              <ComparisonBar 
                label="Average Response Time (Lower is better)" 
                fsrsValue={comparison.fsrs.avg_time} sm2Value={comparison.sm2.avg_time} suffix="s" lowerIsBetter={true} 
              />
              <ComparisonBar 
                label="Average Reviews per Card (Lower is better)" 
                fsrsValue={comparison.fsrs.reviews_avg} sm2Value={comparison.sm2.reviews_avg} lowerIsBetter={true} 
              />
              <ComparisonBar 
                label="Algorithm Confidence Score (Higher is better)" 
                fsrsValue={comparison.fsrs.confidence} sm2Value={comparison.sm2.confidence} suffix="/5" 
              />
            </div>
          </div>

          {/* Right Column: Insights & Achievements */}
          <div className="space-y-6">
            
            {/* Insights */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <Lightbulb size={20} className="text-amber-500" /> Insights
              </h3>
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <ChevronRight size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Achievements */}
            <div className="bg-[#111827] rounded-2xl border border-slate-800 p-6 shadow-sm text-white">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <Award size={20} className="text-amber-400" /> Achievements
              </h3>
              {achievements.length === 0 ? (
                <p className="text-slate-400 text-sm italic">Keep studying to unlock milestones.</p>
              ) : (
                <div className="space-y-3">
                  {achievements.map((ach, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <span className="text-2xl">{ach.icon}</span>
                      <span className="font-medium text-sm">{ach.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ADMIN SECTION: T-Tests (Only renders if adminData exists) */}
        {adminData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Zap size={20} /></div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Admin Statistical Analysis</h2>
                <p className="text-sm text-slate-500">T-Test results across {adminData.total_students} active students.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(adminData.ttests).map(([key, test]) => {
                if (!test) return null;
                return (
                  <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-semibold text-slate-900 capitalize mb-3">{key.replace('_', ' ')} T-Test</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">P-Value:</span> <span className="font-mono font-medium">{test.p_value_formatted}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Significance:</span> <span className={test.significant ? "text-emerald-600 font-bold" : "text-slate-600 font-medium"}>{test.stars}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Effect Size:</span> <span className="font-medium text-slate-900">{test.effect_size} (d={test.cohens_d})</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Research;