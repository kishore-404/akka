import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Trash2, Search, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const LearningMaterial = () => {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckSubject, setNewDeckSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all decks
  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://kishoredev.pythonanywhere.com/materials_data', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load materials');
      
      const data = await response.json();
      setDecks(data.decks || []);
    } catch (err) {
      setError("Unable to load your learning materials.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Create new deck
  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const formData = new URLSearchParams();
      formData.append('name', newDeckName);
      formData.append('subject', newDeckSubject || 'General');

      const response = await fetch('https://kishoredev.pythonanywhere.com/create_deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        credentials: 'include'
      });

      if (response.ok) {
        setNewDeckName('');
        setNewDeckSubject('');
        setIsAddModalOpen(false);
        fetchMaterials(); // Refresh the list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete deck
  const handleDeleteDeck = async (e, deckId) => {
    e.preventDefault(); // Prevent navigating to the deck
    if (!window.confirm("Delete this deck? All cards inside will be lost forever.")) return;
    
    try {
      const response = await fetch(`https://kishoredev.pythonanywhere.com/delete_deck/${deckId}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (response.ok) {
        setDecks(decks.filter(d => d.id !== deckId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDecks = decks.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Error</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:p-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            Learning Materials
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Organize your knowledge base into decks and flashcards.
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111827] text-white rounded-lg text-sm font-medium hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Plus size={16} /> Create Deck
        </button>
      </div>

      {/* Toolbar */}
      <div className="relative max-w-md mb-8">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          placeholder="Search your decks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111827] transition-colors"
        />
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No decks found</h3>
          <p className="text-slate-500 text-sm">Create your first deck to start adding study materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredDecks.map((deck) => (
            <Link 
              key={deck.id}
              to={`/decks/${deck.id}`}
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 active:scale-[0.98] transition-all flex flex-col h-full relative overflow-hidden"
            >
              {/* Delete Button (Appears on hover) */}
              <button
                onClick={(e) => handleDeleteDeck(e, deck.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete Deck"
              >
                <Trash2 size={16} />
              </button>

              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                <FolderOpen size={24} />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-1 pr-8">{deck.name}</h3>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
                {deck.subject}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">
                  {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
                </span>
                <span className="text-blue-600 font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Deck Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden pointer-events-auto"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Create New Deck</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 rounded-md">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleCreateDeck} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Deck Name</label>
                    <input
                      type="text"
                      required
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      placeholder="e.g., Python Fundamentals"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject (Optional)</label>
                    <input
                      type="text"
                      value={newDeckSubject}
                      onChange={(e) => setNewDeckSubject(e.target.value)}
                      placeholder="e.g., Computer Science"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-70">
                      {isSubmitting ? 'Creating...' : 'Create Deck'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LearningMaterial;