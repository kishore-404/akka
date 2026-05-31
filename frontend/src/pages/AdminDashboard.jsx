import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Layers, FileText, BrainCircuit, Download, 
  ShieldAlert, Trophy, TrendingUp, Clock, Activity, Flame
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch('https://kishoredev.pythonanywhere.com/admin_dashboard', { credentials: 'include' });
        
        if (!response.ok) {
          if (response.status === 403) throw new Error("Access Denied. Administrator privileges required.");
          throw new Error("Failed to load admin data.");
        }
        
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleExport = () => {
    // Hits the Flask backend endpoint that generates and returns the ZIP file
    window.location.href = 'https://kishoredev.pythonanywhere.com/admin_export_all';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading command center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Security Override</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/" className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-[#B1DDF1] selection:text-slate-900">
      
      {/* Admin Header Area */}
      <div className="bg-[#111827] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/20">
              <ShieldAlert size={14} /> Command Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Student Activity Tracker</h1>
            <p className="text-slate-400 max-w-2xl">Monitor all student activities, spaced-repetition progress, and algorithm research data in real-time.</p>
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors shadow-sm active:scale-95"
          >
            <Download size={18} /> Export Data (ZIP)
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 space-y-6 lg:space-y-8">
        
        {/* Top Stats Grid */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Users size={24} /></div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{data.total_students}</p>
              <p className="text-sm font-medium text-slate-500">Enrolled Students</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Layers size={24} /></div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{data.total_cards_studied}</p>
              <p className="text-sm font-medium text-slate-500">Total Cards Studied</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><FileText size={24} /></div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{data.total_quizzes}</p>
              <p className="text-sm font-medium text-slate-500">Quizzes Completed</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><BrainCircuit size={24} /></div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{data.avg_retention}%</p>
              <p className="text-sm font-medium text-slate-500">Global FSRS Retention</p>
            </div>
          </div>
        </motion.div>

        {/* Algorithm Summary Banner */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><TrendingUp className="text-blue-500" /> Algorithm Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-3xl font-bold text-emerald-700 mb-1">{data.fsrs_wins}</p>
              <p className="text-sm font-medium text-emerald-600">Students FSRS Performed Better</p>
            </div>
            <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-3xl font-bold text-blue-700 mb-1">{data.sm2_wins}</p>
              <p className="text-sm font-medium text-blue-600">Students SM-2 Performed Better</p>
            </div>
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 text-center">
              <p className="text-3xl font-bold text-amber-700 mb-1">+{data.avg_retention_improvement}%</p>
              <p className="text-sm font-medium text-amber-600">Avg Retention Improvement (FSRS)</p>
            </div>
          </div>
        </motion.div>

        {/* Master Students Table */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Users className="text-indigo-500" /> Student Performance Roster</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Cards Studied</th>
                  <th className="px-6 py-4">Quizzes</th>
                  <th className="px-6 py-4">Points & Streak</th>
                  <th className="px-6 py-4 text-center border-l border-slate-200">FSRS Retention</th>
                  <th className="px-6 py-4 text-center">SM-2 Retention</th>
                  <th className="px-6 py-4 text-center border-l border-slate-200">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.students.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">No student data available yet.</td>
                  </tr>
                ) : (
                  data.students.map((student, idx) => {
                    const fsrsBetter = student.fsrs_retention > student.sm2_retention;
                    const sm2Better = student.sm2_retention > student.fsrs_retention;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{student.username}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{student.total_studied}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{student.quiz_count}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600"><Trophy size={14}/> {student.total_points}</span>
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600"><Flame size={14}/> {student.streak}</span>
                          </div>
                        </td>
                        
                        {/* FSRS Col */}
                        <td className={cn("px-6 py-4 text-center border-l border-slate-200", fsrsBetter && "bg-emerald-50/50")}>
                          <p className={cn("font-bold text-lg", fsrsBetter ? "text-emerald-600" : "text-slate-700")}>{student.fsrs_retention}%</p>
                          <p className="text-xs text-slate-400">{student.fsrs_reviews} reviews</p>
                        </td>
                        
                        {/* SM-2 Col */}
                        <td className={cn("px-6 py-4 text-center", sm2Better && "bg-emerald-50/50")}>
                          <p className={cn("font-bold text-lg", sm2Better ? "text-emerald-600" : "text-slate-700")}>{student.sm2_retention}%</p>
                          <p className="text-xs text-slate-400">{student.sm2_reviews} reviews</p>
                        </td>
                        
                        {/* Winner Col */}
                        <td className="px-6 py-4 text-center border-l border-slate-200">
                          {student.winner === 'FSRS' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold"><Trophy size={12}/> FSRS</span>
                          ) : student.winner === 'SM-2' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold"><Trophy size={12}/> SM-2</span>
                          ) : student.winner === 'Tie' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-bold">Tie</span>
                          ) : (
                            <span className="text-slate-400 text-sm">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Activity Log */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-12">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Activity className="text-purple-500" /> Recent Student Activity</h2>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#f8fafc] sticky top-0 border-b border-slate-200">
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Activity</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_activities.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No recent activity logged.</td>
                  </tr>
                ) : (
                  data.recent_activities.map((activity, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-500 flex items-center gap-1.5"><Clock size={14}/> {activity.time}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900">{activity.student}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">{activity.type}</td>
                      <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-xs">{activity.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>
    </div>
  );
};

export default AdminDashboard;