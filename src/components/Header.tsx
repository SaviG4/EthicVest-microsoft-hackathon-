import React from 'react';
import { ShieldCheck, PlayCircle, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';
import { ClientProfile } from '../types';

interface HeaderProps {
  profile: ClientProfile | null;
  onOpenTestRunner: () => void;
  onRestoreDemo: () => void;
  isRestoringDemo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenTestRunner,
  onRestoreDemo,
  isRestoringDemo,
}) => {
  return (
    <header className="bg-[#051a0d]/95 backdrop-blur border-b border-[#093017] sticky top-0 z-40 px-6 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Branding & Research Context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2CA757] to-[#093017] flex items-center justify-center shadow-md border border-[#74D885]/30">
            <ShieldCheck className="w-6 h-6 text-[#D3FCDA]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">EthicVest</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                Decision Support
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#072411] text-emerald-300 border border-[#2CA757]/20">
                v2026.1
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <span>Domain:</span>
              <span className="text-[#D3FCDA] font-medium">European Clean Energy & Infrastructure</span>
              <span className="text-slate-500">•</span>
              <a
                href="https://www.jrct.org.uk/finance-and-investment"
                target="_blank"
                rel="noreferrer"
                className="text-[#74D885] hover:text-[#D3FCDA] underline underline-offset-2 flex items-center gap-0.5 transition-colors font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
              >
                JRCT Framework
                <ExternalLink className="w-2.5 h-2.5 ml-0.5 inline" />
              </a>
            </p>
          </div>
        </div>

        {/* Center: Profile Status Pill */}
        <div className="hidden lg:flex items-center gap-4 bg-[#072411]/80 px-4 py-1.5 rounded-xl border border-[#093017] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2CA757]" aria-hidden="true" />
            <span className="text-slate-300">Portfolio Profile:</span>
            <span className="font-semibold text-white">{profile?.name || 'EthicVest European Infrastructure Endowment'}</span>
          </div>
          <div className="h-4 w-px bg-[#093017]" />
          <div>
            <span className="text-slate-300">Capital: </span>
            <span className="font-mono font-bold text-[#74D885]">
              £{profile ? profile.starting_budget.toLocaleString() : '100,000'} {profile?.currency || 'GBP'}
            </span>
          </div>
          <div className="h-4 w-px bg-[#093017]" />
          <div className="text-slate-300">
            Cash Reserve: <span className="text-[#D3FCDA] font-mono font-semibold">{profile?.min_cash_reserve_pct || 5}% (£5,000)</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTestRunner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#093017] hover:bg-[#0d4420] text-[#D3FCDA] border border-[#2CA757]/40 text-xs font-medium transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA757]"
            title="Execute 10 automated Python unit tests covering rules, decimal safety, and exclusions"
          >
            <PlayCircle className="w-3.5 h-3.5 text-[#74D885]" />
            <span>Automated Tests</span>
          </button>

          <button
            onClick={onRestoreDemo}
            disabled={isRestoringDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-slate-200 border border-[#2CA757]/30 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA757]"
            title="Safely reset database to baseline European infrastructure demo records"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-300 ${isRestoringDemo ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Prototype Governance Notice Bar */}
      <div className="mt-2.5 pt-2 border-t border-[#093017] flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-white">Decision-Support Prototype:</strong> Rules determine compliance. Python calculates numbers. Evidence supports claims. Humans retain decision-making authority.
          </span>
        </div>
        <span className="hidden sm:inline font-mono text-[10px] text-[#74D885]">
          SQLite + Python 3.10 Engine
        </span>
      </div>
    </header>
  );
};
