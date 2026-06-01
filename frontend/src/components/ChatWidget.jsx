import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MicOff, Loader2, Bot, Radio, VolumeX, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from "../config";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 🌟 Voice Filter: Strips markdown symbols so the AI sounds human
const cleanForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/(\*\*|__)(.*?)\1/g, '$2') 
    .replace(/([*_~`#=])/g, '')         
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
    .replace(/\n+/g, '. ')              
    .trim();
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    { role: 'assistant', content: "Hi! I'm Buddy. You can say **'Hey Buddy'** anytime to wake me up, and **'Stop'** to interrupt me." }
  ]);
  
  const [status, setStatus] = useState('idle'); // idle | listening | thinking | speaking
  const [continuousMode, setContinuousMode] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  
  // Refs for event listeners to avoid stale state
  const isSpeakingRef = useRef(false);
  const continuousModeRef = useRef(false);
  const ambientModeRef = useRef(false); 
  const accumulatedTranscriptRef = useRef('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen, status, message]);

  // ==========================================
  // 1. CLEAR HISTORY FUNCTION
  // ==========================================
  const clearChat = () => {
    setHistory([{ role: 'assistant', content: "Memory cleared! What would you like to learn next?" }]);
    setMessage('');
    accumulatedTranscriptRef.current = '';
    window.speechSynthesis.cancel();
    if (continuousModeRef.current) {
      setStatus('listening');
    }
  };

  // ==========================================
  // 2. ULTRA-RESPONSIVE RECOGNITION ENGINE
  // ==========================================
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true; 
    recognitionRef.current.interimResults = true; // Crucial for ultra-fast response
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentLiveText = (finalTranscript + ' ' + interimTranscript).toLowerCase().trim();

      // --- ⚡ INSTANT KILL-SWITCH (Barge-in Support) ---
      // Evaluates EVERY millisecond. If it hears stop, it kills TTS instantly.
      if (/\b(stop|stop buddy|wait|pause|shh|shut up|cancel)\b/i.test(currentLiveText)) {
        window.speechSynthesis.cancel(); // Kill audio
        window.speechSynthesis.cancel(); // Double call ensures Chrome flushes buffer
        clearTimeout(silenceTimerRef.current); 
        isSpeakingRef.current = false;
        setStatus('listening');
        accumulatedTranscriptRef.current = ''; 
        setMessage(''); 
        recognitionRef.current.abort(); // Flush mic buffer instantly
        return; 
      }

      // --- ⚡ INSTANT WAKE WORD ---
      if (!continuousModeRef.current) {
        if (/\b(hey buddy|hi buddy|wake up buddy)\b/i.test(currentLiveText)) {
          setIsOpen(true);
          startContinuousConversation();
          speakText("Yes?"); // Ultra-short acknowledgement
          recognitionRef.current.abort(); // Flush "hey buddy" out of the mic buffer
          return;
        }
        return; 
      }

      // Ignore normal talking if AI is speaking (Prevents AI from hearing itself)
      // Note: Because this is below the Kill-Switch, you CAN still interrupt it!
      if (isSpeakingRef.current) return; 

      // --- NORMAL LISTENING LOGIC ---
      if (finalTranscript) {
        accumulatedTranscriptRef.current += ' ' + finalTranscript.trim();
      }
      
      // Update UI instantly with live typing effect
      const displayMessage = (accumulatedTranscriptRef.current + ' ' + interimTranscript).trim();
      setMessage(displayMessage);

      // --- ⚡ ULTRA-FAST SILENCE DETECTION ---
      clearTimeout(silenceTimerRef.current);
      
      // If user paused speaking (interim is empty but we have accumulated text)
      if (!interimTranscript && displayMessage) {
        silenceTimerRef.current = setTimeout(() => {
          if (accumulatedTranscriptRef.current.trim()) {
            triggerSend(accumulatedTranscriptRef.current);
          }
        }, 800); // Trigger after just 800ms of silence for instant back-and-forth
      }
    };

    recognitionRef.current.onerror = (event) => {
      if (event.error === 'no-speech') return; 
    };

    // Auto-restart loop to keep the mic alive forever
    recognitionRef.current.onend = () => {
      if (continuousModeRef.current || ambientModeRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    const enableAmbientListening = () => {
      if (!ambientModeRef.current) {
        ambientModeRef.current = true;
        try { recognitionRef.current.start(); } catch(e) {}
      }
    };
    document.addEventListener('click', enableAmbientListening, { once: true });

    return () => {
      ambientModeRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
      clearTimeout(silenceTimerRef.current);
      document.removeEventListener('click', enableAmbientListening);
    };
  }, []);

  // ==========================================
  // 3. CONVERSATION ORCHESTRATION
  // ==========================================

  const startContinuousConversation = () => {
    setContinuousMode(true);
    continuousModeRef.current = true;
    setStatus('listening');
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    accumulatedTranscriptRef.current = '';
    setMessage('');
    try { recognitionRef.current?.start(); } catch (e) {}
  };

  const stopConversation = () => {
    setContinuousMode(false);
    continuousModeRef.current = false;
    setStatus('idle');
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    clearTimeout(silenceTimerRef.current);
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const speechText = cleanForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(speechText);
    
    utterance.rate = 1.1; // Slightly faster for responsiveness
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
      setStatus('speaking');
      isSpeakingRef.current = true;
    };
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (continuousModeRef.current) {
        setStatus('listening');
        accumulatedTranscriptRef.current = '';
        setMessage('');
        // Fast mic reboot to catch immediate replies
        try { recognitionRef.current?.stop(); setTimeout(() => recognitionRef.current?.start(), 50); } catch(e){}
      } else {
        setStatus('idle');
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const triggerSend = async (textToSend) => {
    const cleanedText = textToSend.trim();
    
    if (!cleanedText || status === 'thinking' || /^(stop|wait|pause|shh|shut up|cancel)$/i.test(cleanedText)) {
      accumulatedTranscriptRef.current = '';
      setMessage('');
      return;
    }

    clearTimeout(silenceTimerRef.current);
    accumulatedTranscriptRef.current = '';
    setMessage('');
    setStatus('thinking');
    
    const newHistory = [...history, { role: 'user', content: cleanedText }];
    setHistory(newHistory);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanedText,
          history: history.filter(h => h.role !== 'error')
        }),
        credentials: 'include'
      });

      const data = await response.json();

      // If user interrupted while fetching, abort speaking the new response
      if (!continuousModeRef.current && status === 'idle') return;

      if (response.ok) {
        setHistory([...newHistory, { role: 'assistant', content: data.reply }]);
        speakText(data.reply); 
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setHistory([...newHistory, { role: 'error', content: "Connection lost." }]);
      setStatus('listening');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSend(message);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#111827] text-white rounded-full shadow-lg shadow-slate-900/20 flex items-center justify-center border border-slate-700"
      >
        <Bot size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* HEADER */}
            <div className="bg-[#111827] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 relative">
                  <Bot size={18} />
                  {status !== 'idle' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Hey Buddy</h3>
                  <p className="text-slate-400 text-xs capitalize flex items-center gap-1">
                    {status}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={clearChat} 
                  title="Clear Memory"
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => { setIsOpen(false); stopConversation(); }} 
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              {history.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col max-w-[90%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden",
                    msg.role === 'user' 
                      ? "bg-[#111827] text-white rounded-br-sm" 
                      : msg.role === 'error'
                        ? "bg-red-50 text-red-600 border border-red-100 rounded-bl-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                  )}>
                    {msg.role === 'user' || msg.role === 'error' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown 
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4 text-slate-900" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-md font-bold mb-2 mt-3 text-slate-900" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-2 text-slate-800" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                          code: ({node, inline, ...props}) => 
                            inline 
                              ? <code className="bg-slate-100 text-pink-600 rounded px-1.5 py-0.5 font-mono text-xs" {...props} />
                              : <div className="bg-[#1e1e2e] text-slate-200 p-3 rounded-lg overflow-x-auto my-3"><code className="font-mono text-xs" {...props} /></div>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              
              {status === 'thinking' && (
                <div className="mr-auto max-w-[85%] bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-medium">Buddy is thinking...</span>
                </div>
              )}
              
              {status === 'listening' && message && (
                <div className="ml-auto max-w-[85%] bg-slate-200/50 text-slate-600 px-4 py-2.5 rounded-2xl rounded-br-sm text-sm italic">
                  {message}...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* CONTROLS AREA */}
            <div className="bg-slate-50 border-t border-slate-200 p-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                {!continuousMode ? (
                  <button
                    onClick={startContinuousConversation}
                    className="flex flex-1 items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-semibold hover:bg-emerald-100 transition-colors shadow-sm"
                  >
                    <Radio size={18} className="animate-pulse" />
                    Start Hands-Free Chat
                  </button>
                ) : (
                  <button
                    onClick={stopConversation}
                    className="flex flex-1 items-center justify-center gap-2 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors shadow-sm"
                  >
                    <VolumeX size={18} />
                    Stop Conversation
                  </button>
                )}
              </div>

              <div className={cn("flex items-end gap-2 bg-white border rounded-xl p-2 transition-all", continuousMode ? "opacity-50 pointer-events-none border-slate-200" : "border-slate-300 focus-within:border-[#111827]")}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Or type a message..."
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none py-2 px-2"
                  rows={1}
                />
                <button
                  onClick={() => triggerSend(message)}
                  disabled={!message.trim() || status === 'thinking'}
                  className="p-2 bg-[#111827] text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} className="translate-x-0.5 -translate-y-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;