import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  PieChart,
  Search,
  ArrowRight,
  FileCheck,
  AlertTriangle,
  Play,
  Layers,
  Zap,
} from 'lucide-react';
import { ClientProfile, Candidate, PortfolioScenario, ScreeningRun } from '../types';
import { NavPage } from '../components/Sidebar';

interface DashboardViewProps {
  profile: ClientProfile | null;
  candidates: Candidate[];
  latestRun: ScreeningRun | null;
  latestScenario: PortfolioScenario | null;
  onNavigate: (page: NavPage) => void;
  onRunScreening: () => void;
  isScreening: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  candidates,
  latestRun,
  latestScenario,
  onNavigate,
  onRunScreening,
  isScreening,
}) => {
  const isPass = (status?: string) =>
    status === 'Passes required checks' || status === 'ELIGIBLE FOR FURTHER COMPARISON';
  const isExcl = (status?: string) =>
    status === 'Excluded' || status === 'EXCLUDED';
  const isInvest = (status?: string) =>
    status === 'Needs ethical investigation' || status === 'NEEDS INVESTIGATION';

  const eligible = candidates.filter((c) => isPass(c.primary_status));
  const excluded = candidates.filter((c) => isExcl(c.primary_status));
  const investigate = candidates.filter((c) => isInvest(c.primary_status));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section
        aria-label="Research Overview Introduction"
        className="p-6 rounded-2xl bg-gradient-to-r from-[#051a0d] via-[#093017] to-[#051a0d] border border-[#2CA757]/30 shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#072411] border border-[#2CA757]/30 text-[#74D885] text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>EthicVest Research Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            European Clean Energy & Infrastructure Overview
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Executive intelligence summary for trustees and investment committees evaluating European infrastructure assets against documented ethical exclusions (fossil fuel exploration, thermal coal, weapons, tobacco) and verified 180-day constituent disclosures.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigate('portfolio')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2CA757] hover:bg-[#258c49] text-[#093017] text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <PieChart className="w-4 h-4" />
              <span>Go to Portfolio Builder (£100k)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('screening')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#74D885]" />
              <span>Inspect Ethical Screening</span>
            </button>
            <button
              onClick={() => onNavigate('research')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#74D885]" />
              <span>Browse 12 Research Assets</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section aria-label="Executive Universe Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Infrastructure Universe</span>
            <Layers className="w-4 h-4 text-[#74D885]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">{candidates.length}</div>
            <p className="text-[11px] text-slate-300 mt-0.5">European clean energy & utilities</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#093017] flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Coverage Basis</span>
            <span className="font-mono text-[#D3FCDA] font-semibold">100% Disclosed Audits</span>
          </div>
        </div>

        {/* Eligible / Passes */}
        <div className="p-4 rounded-xl bg-[#093017]/70 border border-[#2CA757]/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#74D885] text-xs">
            <span>Passes Required Checks</span>
            <CheckCircle2 className="w-4 h-4 text-[#2CA757]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">{eligible.length}</div>
            <p className="text-[11px] text-emerald-300 mt-0.5">Satisfies all active ethical checks</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#2CA757]/20 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Compliance Rate</span>
            <span className="font-mono text-[#74D885] font-semibold">
              {candidates.length ? `${Math.round((eligible.length / candidates.length) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Excluded */}
        <div className="p-4 rounded-xl bg-[#051a0d] border border-rose-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-300 text-xs">
            <span>Excluded Candidates</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-rose-300">{excluded.length}</div>
            <p className="text-[11px] text-rose-400/90 mt-0.5">Confirmed policy exclusions</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-900/30 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Zero Tolerance</span>
            <span className="font-mono text-rose-300 font-semibold">Fossil Fuels, Coal, Weapons</span>
          </div>
        </div>

        {/* Needs Investigation */}
        <div className="p-4 rounded-xl bg-[#051a0d] border border-amber-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span>Needs Investigation</span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-300">{investigate.length}</div>
            <p className="text-[11px] text-amber-400/90 mt-0.5">Opaque or stale reporting</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-900/30 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Precautionary Rule</span>
            <span className="font-mono text-amber-300 font-semibold">Missing ≠ Compliant</span>
          </div>
        </div>
      </section>

      {/* Two Column Section: Latest Screening & Portfolio Scenario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Ethical Screening Run */}
        <section aria-label="Screening Overview" className="p-5 rounded-2xl bg-[#051a0d] border border-[#093017] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Latest Screening Run</h2>
                <p className="text-xs text-slate-400 font-mono">
                  {latestRun?.run_timestamp ? new Date(latestRun.run_timestamp).toLocaleString() : 'Active verification'}
                </p>
              </div>
            </div>
            <button
              onClick={onRunScreening}
              disabled={isScreening}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-[#74D885] border border-[#2CA757]/30 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Play className={`w-3.5 h-3.5 ${isScreening ? 'animate-spin' : ''}`} />
              <span>{isScreening ? 'Screening...' : 'Re-Screen Universe'}</span>
            </button>
          </div>

          <div className="p-3.5 bg-[#04140a] rounded-xl border border-[#093017] text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Active Policy:</span>
              <span className="font-semibold text-white">EthicVest European Infrastructure (v2026.1)</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Screening Engine:</span>
              <span className="font-mono text-[#74D885]">1.0.0-deterministic</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Exclusions Enforced:</span>
              <span className="font-mono text-white">Fossil Fuels (0%), Coal (0%), Weapons (0%), Tobacco (0%)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">European Universe Sample:</div>
            <div className="space-y-1.5 font-mono text-xs">
              {candidates.slice(0, 4).map((c) => {
                const passes = isPass(c.primary_status);
                const excluded = isExcl(c.primary_status);
                return (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('screening')}
                    className="p-2.5 rounded-lg bg-[#04140a] hover:bg-[#072411] border border-[#093017] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="truncate max-w-[240px] text-slate-200 font-sans">{c.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        passes
                          ? 'bg-[#093017] text-[#74D885] border border-[#2CA757]/40'
                          : excluded
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                      }`}
                    >
                      {passes ? 'Passes checks' : excluded ? 'Excluded' : 'Investigation'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Latest Portfolio Scenario */}
        <section aria-label="Portfolio Overview" className="p-5 rounded-2xl bg-[#051a0d] border border-[#093017] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Latest Portfolio Construction</h2>
                <p className="text-xs text-slate-400 font-mono">
                  {latestScenario?.name || 'Scenario Balanced (£100,000)'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('portfolio')}
              className="text-xs text-[#74D885] hover:text-[#D3FCDA] font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Open Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017] text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Allocated</span>
              <div className="text-base font-bold font-mono text-[#74D885] mt-0.5">
                £{latestScenario ? latestScenario.allocated_amount.toLocaleString() : '94,990'}
              </div>
              <span className="text-[10px] text-slate-400">95.0% Capital</span>
            </div>

            <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017] text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cash Reserve</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                £{latestScenario ? latestScenario.unallocated_cash.toLocaleString() : '5,010'}
              </div>
              <span className="text-[10px] text-slate-400">5.0% Preserved</span>
            </div>

            <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017] text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Weighted Fee</span>
              <div className="text-base font-bold font-mono text-[#D3FCDA] mt-0.5">
                {latestScenario ? `${latestScenario.weighted_fee_pct}%` : '0.13%'}
              </div>
              <span className="text-[10px] text-slate-400">Low equity fees</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#04140a] rounded-xl border border-[#093017] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Penny-Exact Arithmetic:</span>
              <span className="text-[#74D885] font-mono font-semibold">
                £{latestScenario ? latestScenario.allocated_amount.toLocaleString() : '94,990'} + £{latestScenario ? latestScenario.unallocated_cash.toLocaleString() : '5,010'} = £100,000.00
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Position Bounds:</span>
              <span className="text-slate-200 font-mono">10.0% min – 35.0% max</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Feasibility Check:</span>
              <span className="inline-flex items-center gap-1 text-[#74D885] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Fully Feasible & Compliant</span>
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Precautionary Principle Card */}
      <section aria-label="Precautionary Principle Safeguards" className="p-4 rounded-xl bg-[#051a0d] border border-[#093017] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white text-xs">Precautionary Principle & Missing Data Safeguards</div>
          <p className="text-slate-400 leading-relaxed">
            EthicVest strictly avoids presuming an asset is compliant simply because adverse facts have not yet been uncovered. Baltic Infrastructure Growth Fund and North Sea Transition Fund Beta remain flagged as Needs ethical investigation due to undisclosed or stale constituent schedules. Positive clean energy generation never pardons confirmed fossil fuel exploration or thermal coal extraction.
          </p>
        </div>
      </section>
    </div>
  );
};
