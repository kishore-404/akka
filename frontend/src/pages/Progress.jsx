import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, BrainCircuit, Activity, BarChart3, TrendingUp, AlertCircle 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler
);

// ----------------------------------------------------------------------
// Chart Shared Options (Enterprise styling)
// ----------------------------------------------------------------------
const sharedOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        boxWidth: 6,
        padding: 20,
        font: { family: 'Inter, sans-serif', size: 12, weight: '500' },
        color: '#64748b' // slate-500
      }
    },
    tooltip: {
      backgroundColor: '#111827', // slate-900
      titleFont: { family: 'Inter, sans-serif', size: 13 },
      bodyFont: { family: 'Inter, sans-serif', size: 13 },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
    }
  },
  scales: {
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { font: { family: 'Inter, sans-serif' }, color: '#94a3b8' }
    },
    y: {
      grid: { color: '#f1f5f9', drawBorder: false }, // slate-100
      ticks: { font: { family: 'Inter, sans-serif' }, color: '#94a3b8', padding: 10 }
    }
  }
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
const Progress = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setIsLoading(true);
        // Calls your Vite proxy -> routes to Flask API
        const response = await fetch('/api/progress_data', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include' 
        });

        if (!response.ok) throw new Error('Failed to fetch progress data');

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("API Error:", err);
        setError("Unable to load analytics. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Compiling analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Data Unavailable</h2>
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

  // Safely fallback data if API returns empty arrays
  const safeData = data || {};

  // --- Chart Configurations ---
  
  const weeklyData = {
    labels: safeData.weekly_labels || [],
    datasets: [{
      label: 'Cards Mastered',
      data: safeData.weekly_data || [],
      borderColor: '#3b82f6', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4, // Smooth curves
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const algoComparisonData = {
    labels: ['FSRS', 'SM-2'],
    datasets: [{
      label: 'Total Mastered',
      data: [safeData.fsrs_mastered || 0, safeData.sm2_mastered || 0],
      backgroundColor: ['#10b981', '#6366f1'], // emerald-500, indigo-500
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 40,
    }]
  };

  const dailyActivityData = {
    labels: safeData.daily_labels || [],
    datasets: [{
      label: 'Cards Studied',
      data: safeData.daily_data || [],
      backgroundColor: '#f59e0b', // amber-500
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const retentionData = {
    labels: safeData.retention_labels || [],
    datasets: [
      {
        label: 'FSRS Retention (%)',
        data: safeData.fsrs_retention_data || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0, // Cleaner line without dots unless hovered
        pointHoverRadius: 6
      },
      {
        label: 'SM-2 Retention (%)',
        data: safeData.sm2_retention_data || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6
      }
    ]
  };

  return (
    <div className="w-full p-7 sm:p-8 md:p-10 mx-auto lg:p-18">
      
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
          Progress Tracking
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl">
          Monitor your learning velocity and compare the efficiency of different spaced repetition algorithms over time.
        </p>
      </div>

      {/* Summary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3 mb-2 text-emerald-600">
            <BrainCircuit size={18} />
            <h3 className="text-xs sm:text-sm font-medium text-slate-600">FSRS Mastered</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{safeData.fsrs_mastered || 0}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3 mb-2 text-indigo-600">
            <BrainCircuit size={18} />
            <h3 className="text-xs sm:text-sm font-medium text-slate-600">SM-2 Mastered</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{safeData.sm2_mastered || 0}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3 mb-2 text-amber-500">
            <Activity size={18} />
            <h3 className="text-xs sm:text-sm font-medium text-slate-600">Studied This Week</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{safeData.total_studied_week || 0}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <TrendingUp size={18} />
            <h3 className="text-xs sm:text-sm font-medium text-slate-600">Avg Retention</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{safeData.avg_retention || 0}%</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Weekly Progress */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Weekly Mastery Progress</h2>
            <p className="text-sm text-slate-500">Volume of cards completely mastered per week.</p>
          </div>
          <div className="relative w-full h-[300px] flex-grow">
            <Line data={weeklyData} options={sharedOptions} />
          </div>
        </motion.div>

        {/* Algorithm Comparison */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Algorithm Efficiency</h2>
            <p className="text-sm text-slate-500">Total mastered cards categorized by algorithm.</p>
          </div>
          <div className="relative w-full h-[300px] flex-grow">
            <Bar data={algoComparisonData} options={{...sharedOptions, plugins: {...sharedOptions.plugins, legend: { display: false }}}} />
          </div>
        </motion.div>

        {/* Daily Activity */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Daily Study Volume</h2>
            <p className="text-sm text-slate-500">Number of cards reviewed over the last 7 days.</p>
          </div>
          <div className="relative w-full h-[300px] flex-grow">
            <Bar data={dailyActivityData} options={{...sharedOptions, plugins: {...sharedOptions.plugins, legend: { display: false }}}} />
          </div>
        </motion.div>

        {/* Retention Trend */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Retention Rate Trend</h2>
            <p className="text-sm text-slate-500">Comparative memory retention over time.</p>
          </div>
          <div className="relative w-full h-[300px] flex-grow">
            <Line 
              data={retentionData} 
              options={{
                ...sharedOptions, 
                scales: { 
                  ...sharedOptions.scales, 
                  y: { ...sharedOptions.scales.y, max: 100 } // Force Y-axis to 100%
                }
              }} 
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Progress;