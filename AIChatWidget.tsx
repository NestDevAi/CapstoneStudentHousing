import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, X, Loader2, MinusCircle, Maximize2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { db } from '../lib/db';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Housing Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const suggestedQuestions = [
    "How do I verify my account?",
    "Are there rooms near SLU?",
    "What is the average rent in Baguio?",
    "How does the booking work?"
  ];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data } = await db.from('listings').select('*').eq('status', 'Active');
        setListings(data || []);
      } catch (error) {
        console.error('Error fetching listings for AI:', error);
      }
    };
    fetchListings();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    setInput('');

    try {
      // Simple response logic
      let responseText = "Thank you for your message! ";

      if (userMessage.toLowerCase().includes('rent') || userMessage.toLowerCase().includes('price')) {
        responseText += "Typical student rooms in Baguio range from ₱3,000 to ₱15,000 depending on location and amenities.";
      } else if (userMessage.toLowerCase().includes('verify') || userMessage.toLowerCase().includes('verification')) {
        responseText += "To verify your account, please upload a valid ID and proof of enrollment.";
      } else if (userMessage.toLowerCase().includes('booking')) {
        responseText += "You can book a property by contacting the landlord through our secure messaging system.";
      } else if (listings.length > 0) {
        responseText += `We have ${listings.length} active listings available. Check them out in the browse section!`;
      } else {
        responseText += "How can I assist you with finding student housing?";
      }

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Housing Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50"
            >
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-none'
                  }`}>
                    <div className="markdown-body">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm rounded-tl-none">
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Questions */}
            {messages.length === 1 && !isLoading && (
              <div className="px-6 pb-4 bg-slate-50/50 flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-orange-500 hover:text-orange-500 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-4 bg-white border-t border-slate-100 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable Button */}
      <motion.div
        drag
        dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
        onDoubleClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className="cursor-move"
      >
        <button 
          className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-105 transition-all border border-white/10 group"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <span className="text-sm font-bold tracking-wide">Talk with Us</span>
          {isMinimized && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
              !
            </div>
          )}
        </button>
      </motion.div>
    </div>
  );
};
