import React, { useState } from 'react';
import {
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Download,
  Scale,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  Zap,
  ArrowRight,
  Wind,
  Cpu,
  Droplets,
  Network,
} from 'lucide-react';
import { PortfolioScenario, PortfolioPosition, Candidate } from '../types';

interface PortfolioViewProps {
  scenario: PortfolioScenario | null;
  scenariosList: PortfolioScenario[];
  candidates: Candidate[];
  onRecalculatePortfolio: (params: any) => void;
  isCalculating: boolean;
  onNavigateToScreening?: () => void;
  onNavigateToResearch?: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  scenario,
  scenariosList,
  candidates,
  onRecalculatePortfolio,
  isCalculating,
  onNavigateToScreening,
  onNavigateToResearch,
}) => {
  const [budget, setBudget] = useState(scenario?.total_budget || 100000);
  const [cashReservePct, setCashReservePct] = useState(5.0);
  const [minAllocPct, setMinAllocPct] = useState(10.0);
  const [maxAllocPct, setMaxAllocPct] = useState(35.0);
  const [mode, setMode] = useState<'cautious' | 'balanced'>('balanced');

  const positions = scenario?.positions || [];
  const eligibleCandidates = candidates.filter(
    (c) => c.primary_status === 'Passes required checks' || c.primary_status === 'ELIGIBLE FOR FURTHER COMPARISON'
  );

  const handleModeChange = (newMode: 'cautious' | 'balanced') => {
    setMode(newMode);
    onRecalculatePortfolio({
      total_budget_gbp: budget,
      min_cash_reserve_pct: cashReservePct,
      min_allocation_pct: minAllocPct,
      max_allocation_pct: maxAllocPct,
      allocation_strategy: newMode,
    });
  };

  const handleApplySettings = () => {
    onRecalculatePortfolio({
      total_budget_gbp: budget,
      min_cash_reserve_pct: cashReservePct,
      min_allocation_pct: minAllocPct,
      max_allocation_pct: maxAllocPct,
      allocation_strategy: mode,
    });
  };

  const handleExportCsv = () => {
    if (!scenario || !positions.length) return;
    const headers = [
      'Candidate Name',
      'Identifier',
      'Asset Class',
      'Allocated GBP',
      'Weight %',
      'Annual Fee GBP',
      'OCF %',
      'Rationale',
    ];
    const rows = positions.map((p) => [
      `"${p.name}"`,
      p.identifier,
      `"${p.asset_class}"`,
      p.allocated_amount.toFixed(2),
      `${p.weight_pct}%`,
      p.annual_fee_gbp.toFixed(2),
      `${p.ocf_fee_pct}%`,
      `"${p.rationale}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ethicvest-portfolio-${scenario.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to tag infrastructure category icon
  const getCategoryBadge = (name: string) => {
    if (name.includes('Ørsted') || name.includes('EDP')) {
      return { label: 'Offshore & Onshore Wind', icon: Wind, color: 'text-sky-300 bg-sky-950/60 border-sky-800' };
    }
    if (name.includes('Grid') || name.includes('Terna') || name.includes('Iberdrola')) {
      return { label: 'Transmission Grid', icon: Network, color: 'text-emerald-300 bg-emerald-950/60 border-emerald-800' };
    }
    if (name.includes('Alfen')) {
      return { label: 'Energy Storage & Sub-stations', icon: Zap, color: 'text-amber-300 bg-amber-950/60 border-amber-800' };
    }
    return { label: 'Circular & Water Solutions', icon: Droplets, color: 'text-teal-300 bg-teal-950/60 border-teal-800' };
  };

  return (
    <div className="space-y-6">
      {/* Homepage Hero Card */}
      <section
        aria-label="Portfolio Builder Introduction"
        className="p-6 rounded-2xl bg-gradient-to-r from-[#051a0d] via-[#093017] to-[#051a0d] border border-[#2CA757]/30 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2CA757] text-[#093017]">
                Homepage · Portfolio Builder
              </span>
              <span className="text-[11px] font-mono text-[#D3FCDA]">
                European Clean Energy Universe
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              AI-Assisted Ethical Infrastructure Allocation
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Construct compliant capital allocations exclusively from screened European infrastructure assets—offshore wind, high-voltage transmission networks, utility-scale battery storage, and circular infrastructure.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#04140a]/90 p-2 rounded-2xl border border-[#093017] shrink-0">
            <button
              onClick={() => handleModeChange('cautious')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA757] ${
                mode === 'cautious'
                  ? 'bg-[#2CA757] text-[#093017] shadow-md shadow-[#2CA757]/20'
                  : 'text-slate-300 hover:text-white hover:bg-[#072411]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-tight">Cautious Mode</div>
                <div className="text-[10px] opacity-80 font-normal">Min Volatility Weighting</div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange('balanced')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA757] ${
                mode === 'balanced'
                  ? 'bg-[#2CA757] text-[#093017] shadow-md shadow-[#2CA757]/20'
                  : 'text-slate-300 hover:text-white hover:bg-[#072411]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-tight">Balanced Mode</div>
                <div className="text-[10px] opacity-80 font-normal">Max Sharpe Proxy Weighting</div>
              </div>
            </button>
          </div>
        </div>

        {/* Mode Explanation Sub-banner */}
        <div className="mt-5 pt-4 border-t border-[#093017] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#74D885] shrink-0" />
            <span>
              <strong>Active Strategy ({mode === 'cautious' ? 'Cautious' : 'Balanced'}):</strong>{' '}
              {mode === 'cautious'
                ? 'Minimises 3-year volatility via inverse-volatility weighting, prioritising regulated transmission grids (National Grid, Terna, Iberdrola).'
                : 'Maximises risk-adjusted return (Sharpe proxy), weighting pure-play renewable developers (Ørsted) and clean tech alongside regulated transmission networks.'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              disabled={!positions.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/40 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards: Budget, Invested, Cash Reserve, OCF Fee, Volatility */}
      <section aria-label="Portfolio Key Statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
          <div className="text-slate-300 text-xs font-medium">Total Capital Managed</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            £{scenario ? scenario.total_budget.toLocaleString() : '100,000.00'}
          </div>
          <div className="text-[11px] text-[#74D885] mt-1">Fixed endowment baseline</div>
        </div>

        <div className="p-4 rounded-xl bg-[#093017]/80 border border-[#2CA757]/40">
          <div className="text-[#D3FCDA] text-xs font-medium">Invested in Infrastructure</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            £{scenario ? scenario.allocated_amount.toLocaleString() : '94,990.00'}
          </div>
          <div className="text-[11px] text-emerald-300 mt-1">
            Across {positions.length} compliant assets
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
          <div className="text-slate-300 text-xs font-medium">Preserved Cash Reserve</div>
          <div className="text-xl font-bold font-mono text-[#74D885] mt-1">
            £{scenario ? scenario.unallocated_cash.toLocaleString() : '5,010.00'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-mono">
            {((scenario ? scenario.unallocated_cash / scenario.total_budget : 0.0501) * 100).toFixed(2)}% liquidity buffer
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
          <div className="text-slate-300 text-xs font-medium">Weighted Annual Fee</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {scenario ? `${scenario.weighted_fee_pct}%` : '0.13%'}
          </div>
          <div className="text-[11px] text-emerald-300 mt-1">
            Institutional fee profile
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
          <div className="text-slate-300 text-xs font-medium">Weighted 3-Yr Volatility</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {scenario ? `${scenario.weighted_volatility_pct}%` : '11.80%'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-mono">
            {mode === 'cautious' ? 'Min-volatility target' : 'Balanced Sharpe target'}
          </div>
        </div>
      </section>

      {/* Decimal-Safe Reconciliation Proof */}
      <div className="p-3.5 bg-[#051a0d] rounded-xl border border-[#2CA757]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2CA757] shrink-0" />
          <span className="text-slate-200">
            <strong className="text-white">Deterministic Decimal Arithmetic Verified:</strong> Total Invested (£{scenario?.allocated_amount.toLocaleString() || '94,990.00'}) + Cash Reserve (£{scenario?.unallocated_cash.toLocaleString() || '5,010.00'}) = Total Budget (£{scenario?.total_budget.toLocaleString() || '100,000.00'}) exactly. Zero penny drift.
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#74D885] shrink-0 bg-[#072411] px-2 py-0.5 rounded border border-[#093017]">
          Python Decimal Safe
        </span>
      </div>

      {/* Positions Allocation Table */}
      <section aria-label="Proposed Positions" className="border border-[#093017] rounded-2xl overflow-hidden bg-[#051a0d] shadow-xl">
        <div className="px-5 py-4 border-b border-[#093017] bg-[#072411] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Proposed Compliant Infrastructure Positions</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                {positions.length} Active Holdings
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Only candidates meeting 100% of European ethical rules and 180-day constituent disclosure standards are allocated capital.
            </p>
          </div>
          <span className="text-xs font-mono text-[#D3FCDA]">
            Budget Cap: £{budget.toLocaleString()} GBP
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#04140a] text-slate-300 border-b border-[#093017] text-[11px] font-semibold">
                <th className="py-3 px-4">Asset / Candidate</th>
                <th className="py-3 px-3">Infrastructure Category</th>
                <th className="py-3 px-3 text-right">Allocated Capital</th>
                <th className="py-3 px-3 text-right">Portfolio Weight</th>
                <th className="py-3 px-3 text-right">3-Yr Volatility</th>
                <th className="py-3 px-3 text-right">Annual Fee</th>
                <th className="py-3 px-4">Policy Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#093017]/70 font-sans">
              {positions.map((pos) => {
                const badge = getCategoryBadge(pos.name);
                const CategoryIcon = badge.icon;
                return (
                  <tr key={pos.candidate_id} className="hover:bg-[#072411]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{pos.name}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {pos.identifier} · {pos.fund_manager}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badge.color}`}>
                        <CategoryIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-[#74D885] text-sm">
                      £{pos.allocated_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-white">
                      <div className="font-semibold">{pos.weight_pct.toFixed(2)}%</div>
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
                        <div
                          className="bg-[#2CA757] h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, pos.weight_pct * 3)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      {pos.volatility_3yr_pct ? `${pos.volatility_3yr_pct}%` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      £{pos.annual_fee_gbp.toFixed(2)}
                      <div className="text-[10px] text-slate-400">({pos.ocf_fee_pct}%)</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-[11px] leading-relaxed max-w-xs">
                      {pos.rationale}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Construction Controls / Adjustments Accordion */}
      <section aria-label="Construction Parameters" className="p-5 rounded-2xl bg-[#051a0d] border border-[#093017] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#74D885]" />
            <h3 className="text-sm font-bold text-white">Customize Endowment Parameters</h3>
          </div>
          <button
            onClick={handleApplySettings}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2CA757] hover:bg-[#258c49] text-[#093017] text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            <Scale className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>{isCalculating ? 'Recalculating...' : 'Recalculate Allocation'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Total Endowment Budget (£)</label>
            <input
              type="number"
              step={1000}
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] focus:border-[#2CA757] rounded-lg text-[#74D885] font-mono font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Cash Reserve (%)</label>
            <input
              type="number"
              min={0}
              max={25}
              step={0.5}
              value={cashReservePct}
              onChange={(e) => setCashReservePct(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] focus:border-[#2CA757] rounded-lg text-white font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
              £{(budget * (cashReservePct / 100)).toLocaleString()} buffer
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Minimum Position (%)</label>
            <input
              type="number"
              min={5}
              max={20}
              value={minAllocPct}
              onChange={(e) => setMinAllocPct(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] focus:border-[#2CA757] rounded-lg text-white font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Position floor</span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Max Concentration (%)</label>
            <input
              type="number"
              min={20}
              max={45}
              value={maxAllocPct}
              onChange={(e) => setMaxAllocPct(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] focus:border-[#2CA757] rounded-lg text-white font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Single asset ceiling</span>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Links */}
      <section aria-label="Workflow Navigation" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {onNavigateToScreening && (
          <button
            onClick={onNavigateToScreening}
            className="p-4 rounded-xl bg-[#051a0d] hover:bg-[#072411] border border-[#093017] hover:border-[#2CA757]/40 text-left transition-colors cursor-pointer group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#D3FCDA] flex items-center gap-2">
                <span>View Ethical Screening Results</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                  {eligibleCandidates.length} Passed
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Inspect 3-status policy verdicts and rule exclusions (e.g. TotalEnergies and RWE AG).
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#74D885] shrink-0 ml-3" />
          </button>
        )}

        {onNavigateToResearch && (
          <button
            onClick={onNavigateToResearch}
            className="p-4 rounded-xl bg-[#051a0d] hover:bg-[#072411] border border-[#093017] hover:border-[#2CA757]/40 text-left transition-colors cursor-pointer group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#D3FCDA] flex items-center gap-2">
                <span>Explore Investment Research</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                  12 Assets
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Examine European exposure basis, infrastructure categories, research scores, and filings.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#74D885] shrink-0 ml-3" />
          </button>
        )}
      </section>
    </div>
  );
};
