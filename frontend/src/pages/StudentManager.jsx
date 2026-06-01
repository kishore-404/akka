import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Edit2, Trash2, X, Save, 
  ShieldAlert, AlertCircle, Trophy, Star
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from "../config";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const StudentManager = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal States
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ total_points: 0, stars: 0 });

  const fetchStudents = async () => {
    try {
      // Re-using the admin dashboard endpoint to get the list of users
      const response = await fetch(`${API_BASE_URL}/admin_dashboard`, { credentials: 'include' });
      if (!response.ok) throw new Error("Access Denied");
      const data = await response.json();
      setStudents(data.students);
    } catch (err) {
      setError("Failed to load students. Ensure you are logged in as Admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ==========================================
  // CRUD: UPDATE USER
  // ==========================================
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // NOTE: Your backend needs the user's ID. If the dashboard API doesn't return ID, 
      // make sure to add 'id': student.id to your api_admin_dashboard python dict!
      const response = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setStatusMessage({ type: 'success', text: `Updated ${editingUser.username} successfully.` });
        setEditingUser(null);
        fetchStudents(); // Refresh table
      } else {
        const data = await response.json();
        setStatusMessage({ type: 'error', text: data.error || 'Update failed.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error during update.' });
    }
  };

  // ==========================================
  // CRUD: DELETE USER
  // ==========================================
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ DANGER ZONE ⚠️\nAre you sure you want to completely delete ${username} and all their progress? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStatusMessage({ type: 'success', text: `Deleted user ${username}.` });
        fetchStudents(); // Refresh table
      } else {
        const data = await response.json();
        setStatusMessage({ type: 'error', text: data.error || 'Delete failed.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error during deletion.' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/" className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 selection:bg-[#B1DDF1]">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link to="/admin_dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Command Center
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
            <Users className="text-blue-600" /> Student Manager
          </h1>
          <p className="text-slate-500">Add, edit, or remove student accounts and manage their gamification points.</p>
        </div>
      </div>

      {/* Status Banner */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn(
              "p-4 rounded-xl mb-6 flex items-center justify-between",
              statusMessage.type === 'success' ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {statusMessage.text}
            </div>
            <button onClick={() => setStatusMessage(null)}><X size={18} className="opacity-50 hover:opacity-100" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Total Points</th>
                <th className="px-6 py-4">Gold Stars</th>
                <th className="px-6 py-4">Performance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((student, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{student.username}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-1.5 mt-2">
                    <Trophy size={16} className="text-amber-500" /> {student.total_points || 0}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {/* Assuming you add 'stars' to your api_admin_dashboard payload */}
                    <span className="flex items-center gap-1.5"><Star size={16} className="text-yellow-400 fill-yellow-400" /> {student.stars || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{student.fsrs_retention}% Retention</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => {
                          setEditingUser(student);
                          setEditForm({ total_points: student.total_points || 0, stars: student.stars || 0 });
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Points/Stars"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(student.id, student.username)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL OVERLAY */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 size={18} className="text-blue-600" /> Edit {editingUser.username}
                </h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Trophy size={16} className="text-amber-500" /> Total Points
                  </label>
                  <input
                    type="number"
                    value={editForm.total_points}
                    onChange={(e) => setEditForm({...editForm, total_points: parseInt(e.target.value) || 0})}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-[#111827] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" /> Gold Stars
                  </label>
                  <input
                    type="number"
                    value={editForm.stars}
                    onChange={(e) => setEditForm({...editForm, stars: parseInt(e.target.value) || 0})}
                    className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-[#111827] focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#111827] text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentManager;