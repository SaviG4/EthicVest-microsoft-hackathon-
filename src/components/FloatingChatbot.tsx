import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Minimize2,
  Maximize2,
  HelpCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: "Hello! I am your **EthicVest Research Assistant**.\n\nI can help you review our European infrastructure assets (offshore wind, high-voltage transmission grids, energy storage, circular solutions), explain why companies like **TotalEnergies** or **RWE AG** were excluded, or clarify how the **Cautious** vs. **Balanced** portfolios are constructed.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.askAnalyst(query, messages.map((m) => ({ role: m.sender, content: m.text })));
      const replyText = res.reply || 'No response generated.';

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Apologies, I encountered an issue retrieving that information. Please try asking about TotalEnergies, RWE, Ørsted, or Cautious vs. Balanced portfolio modes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Why was TotalEnergies excluded?',
    'Explain Cautious vs. Balanced mode',
    'What European wind assets are included?',
    'Why does Baltic Fund need investigation?',
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#093017] hover:bg-[#0c401f] text-[#D3FCDA] shadow-xl shadow-black/40 border border-[#2CA757]/40 transition-transform duration-200 hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74D885]"
          aria-label="Open EthicVest Research Assistant"
        >
          <div className="w-8 h-8 rounded-full bg-[#2CA757] flex items-center justify-center text-[#093017]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-bold leading-tight text-white flex items-center gap-1.5">
              <span>Research Assistant</span>
              <span className="w-2 h-2 rounded-full bg-[#74D885]" aria-hidden="true" />
            </div>
            <div className="text-[10px] text-emerald-300">Grounded Infrastructure Q&A</div>
          </div>
        </button>
      )}

      {isOpen && (
        <section
          aria-label="EthicVest Research Assistant Chat"
          className={`flex flex-col bg-[#051a0d] border border-[#093017] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[90vw] sm:w-[600px] h-[80vh] max-h-[750px]'
              : 'w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#072411] border-b border-[#093017] flex items-center justify-between text-[#D3FCDA]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2CA757] flex items-center justify-center text-[#093017] shrink-0 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                  EthicVest Research Assistant
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                    Live Context
                  </span>
                </h2>
                <p className="text-[10px] text-emerald-300">European Infrastructure Decision Support</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-[#093017] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
                aria-label={isExpanded ? 'Collapse chat window' : 'Expand chat window'}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#093017] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
                aria-label="Close assistant"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick suggestions if few messages */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-[#04140a] border-b border-[#093017] text-[11px]">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-[#74D885]" />
                Suggested inquiries:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="text-[10px] px-2 py-1 rounded-md bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/30 transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#2CA757] text-[#093017] font-medium rounded-br-none shadow-sm'
                      : 'bg-[#072411] text-slate-200 border border-[#093017] rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
                <span className="text-[9px] text-slate-300 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-300 text-xs px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-[#74D885] animate-pulse" />
                <span>Analysing verified European filings...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#072411] border-t border-[#093017] flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about candidates, exclusions, or portfolio modes..."
              disabled={isLoading}
              className="flex-1 bg-[#051a0d] border border-[#093017] focus:border-[#2CA757] text-white text-xs rounded-xl px-3.5 py-2.5 placeholder-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#2CA757] hover:bg-[#258c49] text-[#093017] disabled:opacity-40 transition-colors font-bold cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74D885]"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
