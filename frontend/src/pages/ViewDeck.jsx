import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Search, Trash2, CheckCircle2, 
  Circle, BookOpen, AlertCircle, X, BrainCircuit,
  RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from "../config";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ViewDeck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Deck & Cards
  const fetchDeckData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/deck_data/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load deck data');
      
      const data = await response.json();
      setDeck(data.deck);
      setCards(data.cards);
    } catch (err) {
      setError("Unable to load the learning material. It may have been deleted.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeckData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle Add Card
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    setIsSubmitting(true);
    try {
      const formData = new URLSearchParams();
      formData.append('question', newQuestion);
      formData.append('answer', newAnswer);

      const response = await fetch(`${API_BASE_URL}/add_card/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        credentials: 'include'
      });

      if (response.ok) {
        setNewQuestion('');
        setNewAnswer('');
        setIsAddModalOpen(false);
        fetchDeckData(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Card
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/delete_card/${cardId}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (response.ok) {
        setCards(cards.filter(c => c.id !== cardId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Toggle Mastery (Single)
  const handleToggleMastery = async (cardId) => {
    // Optimistic UI update
    setCards(cards.map(c => c.id === cardId ? { ...c, is_mastered: !c.is_mastered } : c));
    
    try {
      await fetch(`${API_BASE_URL}/toggle_mastered/${cardId}`, { 
        method: 'POST', 
        credentials: 'include' 
      });
    } catch (err) {
      // Revert on failure
      fetchDeckData();
    }
  };

  // Handle Mark All as Mastered
  const handleMarkAllMastered = async () => {
    const unmasteredCards = cards.filter(c => !c.is_mastered);
    if (unmasteredCards.length === 0) return;

    // Optimistic UI update
    setCards(cards.map(c => ({ ...c, is_mastered: true })));

    try {
      await Promise.all(
        unmasteredCards.map(card => 
          fetch(`${API_BASE_URL}/toggle_mastered/${card.id}`, { 
            method: 'POST', 
            credentials: 'include' 
          })
        )
      );
    } catch (err) {
      fetchDeckData();
    }
  };

  // Handle Reset Progress (Redo / Unmark All)
  const handleResetProgress = async () => {
    if (!window.confirm("Are you sure you want to reset your mastery progress for this deck?")) return;

    const masteredCards = cards.filter(c => c.is_mastered);
    if (masteredCards.length === 0) return;

    // Optimistic UI update
    setCards(cards.map(c => ({ ...c, is_mastered: false })));

    try {
      await Promise.all(
        masteredCards.map(card => 
          fetch(`${API_BASE_URL}/toggle_mastered/${card.id}`, { 
            method: 'POST', 
            credentials: 'include' 
          })
        )
      );
    } catch (err) {
      fetchDeckData();
    }
  };

  const filteredCards = cards.filter(c => 
    c.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasUnmasteredCards = cards.some(c => !c.is_mastered);
  const hasMasteredCards = cards.some(c => c.is_mastered);

  if (isLoading && !deck) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-[#111827] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Material Unavailable</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/" className="px-6 py-2 bg-[#111827] text-white rounded-lg text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full p-12">
      
      {/* Header Area */}
      <div className="mb-8">
        <Link 
          to="/materials" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Materials
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold mb-3">
              <BookOpen size={14} /> {deck.subject}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              {deck.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} total • {cards.filter(c => c.is_mastered).length} mastered
            </p>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111827] text-white rounded-lg text-sm font-medium hover:bg-slate-800 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus size={16} /> Add Flashcard
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search questions or answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#111827] focus:bg-white transition-colors"
          />
        </div>
        
        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasUnmasteredCards && filteredCards.length > 0 && (
            <button
              onClick={handleMarkAllMastered}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <CheckCircle2 size={16} className="text-emerald-500" />
              Mark All Mastered
            </button>
          )}

          {hasMasteredCards && filteredCards.length > 0 && (
            <button
              onClick={handleResetProgress}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RotateCcw size={16} className="text-slate-500" />
              Reset Progress
            </button>
          )}
        </div>
      </div>

      {/* Cards List */}
      <div className="bg-white border border-slate-200 rounded-b-2xl overflow-hidden shadow-sm">
        {filteredCards.length === 0 ? (
          <div className="p-12 text-center">
            <BrainCircuit size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No cards found</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchTerm ? "Try adjusting your search term." : "Start building your knowledge base by adding a card."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCards.map((card) => (
              <div key={card.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-slate-50 transition-colors group">
                
                {/* Mastery Toggle */}
                <button 
                  onClick={() => handleToggleMastery(card.id)}
                  className="flex-shrink-0 focus:outline-none"
                  title={card.is_mastered ? "Unmark as mastered" : "Mark as mastered"}
                >
                  {card.is_mastered ? (
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  ) : (
                    <Circle size={24} className="text-slate-300 group-hover:text-slate-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
                    Q: {card.question}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    A: {card.answer}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Card"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Card Modal */}
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
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden pointer-events-auto"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Add New Card</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 rounded-md">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleAddCard} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Question / Prompt</label>
                    <textarea
                      required
                      rows={3}
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="e.g., The powerhouse of the cell is the _____"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Answer</label>
                    <textarea
                      required
                      rows={2}
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="e.g., Mitochondria"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#111827] focus:ring-1 focus:ring-[#111827] outline-none resize-none"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-70">
                      {isSubmitting ? 'Saving...' : 'Save Card'}
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

export default ViewDeck;