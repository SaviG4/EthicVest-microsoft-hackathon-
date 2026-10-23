import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  FileText,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  Scale
} from 'lucide-react';
import { AIExplanation, PortfolioScenario } from '../types';
import { api } from '../api';

interface AnalystViewProps {
  scenario: PortfolioScenario | null;
  explanation: AIExplanation | null;
  onGenerateExplanation: () => void;
  isGenerating: boolean;
}

export const AnalystView: React.FC<AnalystViewProps> = ({
  scenario,
  explanation,
  onGenerateExplanation,
  isGenerating,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; citations?: string[] }>>([
    {
      sender: 'ai',
      text: `Welcome to the **EthicalVest AI Investment Analyst**. I am grounded in your active Joseph Rowntree Charitable Trust policy rules, verified fund factsheets, and Python's decimal-safe portfolio calculation. Ask me why specific funds were excluded, how the £5,000 cash reserve was determined, or what trustees should verify.`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'included' | 'excluded' | 'tradeoffs' | 'risks' | 'reviews' | 'citations' | null>(null);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || isSending) return;

    const userMsg = { sender: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputMessage('');
    setIsSending(true);

    try {
      const res = await api.sendChatMessage(textToSend);
      setMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error generating response: ${err.message}` }]);
    } finally {
      setIsSending(false);
    }
  };

  const sampleQuestions = [
    'Why was Vanguard FTSE All-World excluded?',
    'What evidence is missing for Baillie Gifford?',
    'How was the decimal cash reserve calculated?',
    'What should trustees verify before review?',
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-indigo-950/20 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Screen 4: AI Investment Analyst</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Step 4 of 4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generative AI reasoning strictly grounded in verified factsheets, deterministic screening, and reproducible calculations.
            </p>
          </div>
        </div>

        <button
          onClick={onGenerateExplanation}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating Traceable Explanation...' : 'Explain My Recommendation'}</span>
        </button>
      </div>

      {/* Structured Explanation Grid */}
      {explanation ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Executive Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>Executive Analyst Briefing</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed font-sans">
              {explanation.summary}
            </p>
          </div>

          {/* Core Findings Accordions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Why Included Candidates Passed */}
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Why Included Positions Passed ({explanation.included_candidates.length})</span>
                </div>
              </div>
              <div className="space-y-2">
                {explanation.included_candidates.map((inc, i) => (
                  <div key={i} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-slate-200 font-semibold">
                      <span>{inc.name}</span>
                      <span className="font-mono text-emerald-400">£{inc.allocation_gbp.toLocaleString()} ({inc.weight_pct}%)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{inc.why_passed}</p>
                    <div className="text-[10px] font-mono text-slate-500">Citing Source: {inc.source_id}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Excluded Candidates Were Disqualified */}
            <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/20 space-y-3">
              <div className="flex items-center justify-between text-rose-400 font-bold">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Confirmed Exclusions & Breaches ({explanation.excluded_candidates.length})</span>
                </div>
              </div>
              <div className="space-y-2">
                {explanation.excluded_candidates.map((exc, i) => (
                  <div key={i} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-slate-200 font-semibold">
                      <span>{exc.name}</span>
                      <span className="font-mono text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/40">
                        {exc.rule_code}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-300 leading-snug">Breached Holdings: {exc.breached_holdings}</p>
                    <div className="text-[10px] font-mono text-slate-500">Evidence Record: {exc.source_id}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trade-offs & Governance Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Financial Trade-offs */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Financial Trade-Offs & Cost Impact
              </span>
              <p className="text-slate-300 leading-relaxed">{explanation.financial_tradeoffs}</p>
            </div>

            {/* Ethical Impact */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Ethical Integrity & Impact Analysis
              </span>
              <p className="text-slate-300 leading-relaxed">{explanation.ethical_tradeoffs}</p>
            </div>
          </div>

          {/* Risks & Trustee Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Concentration & Financial Risks */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Portfolio Concentration & Market Risks
              </span>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {explanation.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Required Trustee Reviews */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Required Human Reviews for Trustees
              </span>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {explanation.required_human_reviews.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Verified Citations List */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Verified Citations & Registered Disclosures ({explanation.citations?.length || 0})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {explanation.citations?.map((c, i) => (
                <div key={i} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-200 truncate">{c.document_title}</div>
                  <div className="text-slate-400 leading-snug line-clamp-2">{c.claim}</div>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="font-mono text-cyan-400">{c.source_id}</span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white flex items-center gap-0.5">
                        Link <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-cyan-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Generate Structured Evidence Explanation</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Click the button above to generate a fully grounded briefing synthesizing your active JRCT policy exclusions, £100,000 decimal allocation, and verified fund factsheets.
          </p>
        </div>
      )}

      {/* Grounded Decision-Support Chat Interface */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Grounded Decision-Support Assistant</h3>
              <p className="text-[11px] text-slate-400">Ask questions about exclusions, arithmetic, or missing data.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            Source-Grounded Model
          </span>
        </div>

        {/* Suggested Questions */}
        <div className="flex flex-wrap gap-2 text-xs">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] cursor-pointer transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 max-h-80 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`p-3 rounded-xl max-w-xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white font-medium ml-12'
                    : 'bg-slate-900 text-slate-200 border border-slate-800/80'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
              {m.sender === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
              <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Consulting evidence documents and policy rules...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask a question about fund exclusions, cash reserve, or governance..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isSending || !inputMessage.trim()}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
