import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Wind,
  Network,
  Droplets,
  Layers,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { Candidate, ScreeningStatus } from '../types';
import { CandidateModal } from '../components/CandidateModal';

interface ResearchViewProps {
  candidates: Candidate[];
  onNavigateToScreening?: () => void;
  onNavigateToPortfolio?: () => void;
}

export const ResearchView: React.FC<ResearchViewProps> = ({
  candidates,
  onNavigateToScreening,
  onNavigateToPortfolio,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const isPass = (status?: string) =>
    status === 'Passes required checks' || status === 'ELIGIBLE FOR FURTHER COMPARISON';
  const isExcl = (status?: string) =>
    status === 'Excluded' || status === 'EXCLUDED';
  const isInvest = (status?: string) =>
    status === 'Needs ethical investigation' || status === 'NEEDS INVESTIGATION';

  // Categories list
  const categories = [
    'ALL',
    'Renewable Energy (Offshore Wind)',
    'Electricity Transmission Grid',
    'Energy Storage & Smart Grid',
    'Water & Circular Infrastructure',
  ];

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.identifier.toLowerCase().includes(search.toLowerCase()) ||
      c.fund_manager.toLowerCase().includes(search.toLowerCase()) ||
      (c.infrastructure_category || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.european_exposure_basis || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter !== 'ALL') {
      return (c.infrastructure_category || '').includes(categoryFilter.split(' ')[0]);
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = [
      'Candidate Name',
      'Identifier',
      'European Exposure Basis',
      'Infrastructure Category',
      'Candidate Type',
      'Research Score',
      'Financial Risk Status',
      'Recommendation Category',
      'Price History',
      'Screening Verdict',
    ];
    const rows = filtered.map((c) => [
      `"${c.name}"`,
      c.identifier,
      `"${c.european_exposure_basis || c.domicile}"`,
      `"${c.infrastructure_category || c.asset_class}"`,
      `"${c.candidate_type || 'Infrastructure Equity'}"`,
      c.research_score || 'N/A',
      `"${c.financial_risk_status || 'Standard'}"`,
      `"${c.recommendation_category || 'Neutral'}"`,
      c.price_history_years ? `${c.price_history_years} yrs` : 'N/A',
      isPass(c.primary_status)
        ? 'Passes required checks'
        : isExcl(c.primary_status)
        ? 'Excluded'
        : 'Needs ethical investigation',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ethicvest-infrastructure-research.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <section
        aria-label="Investment Research Header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#051a0d] border border-[#093017] shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#093017] border border-[#2CA757]/30 text-[#74D885]">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Investment Research</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                12 Candidates
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Comprehensive European infrastructure universe: offshore wind, high-voltage transmission networks, utility battery storage, and circular infrastructure.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/40 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Universe CSV</span>
          </button>
        </div>
      </section>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#051a0d] border border-[#093017] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-300 font-semibold mr-1">Sector:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757] ${
                categoryFilter === cat
                  ? 'bg-[#2CA757] text-[#093017] font-bold'
                  : 'bg-[#04140a] text-slate-300 hover:text-white border border-[#093017]'
              }`}
            >
              {cat === 'ALL' ? 'All European Sectors' : cat.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter candidates, tickers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#04140a] border border-[#093017] focus:border-[#2CA757] rounded-lg text-xs text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
          />
        </div>
      </div>

      {/* Streamlined Research Table (Clutter columns: Holdings Disclosed, Fee, Data Status REMOVED) */}
      <section
        aria-label="European Infrastructure Research Candidates"
        className="border border-[#093017] rounded-2xl overflow-hidden bg-[#051a0d] shadow-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#04140a] text-slate-300 border-b border-[#093017] text-[11px] font-semibold">
                <th className="py-3.5 px-4">Candidate / Asset</th>
                <th className="py-3.5 px-3">European Exposure Basis</th>
                <th className="py-3.5 px-3">Infrastructure Category</th>
                <th className="py-3.5 px-3">Candidate Type</th>
                <th className="py-3.5 px-3 text-center">Research Score</th>
                <th className="py-3.5 px-3">Financial Risk Status</th>
                <th className="py-3.5 px-3">Recommendation</th>
                <th className="py-3.5 px-3 text-center">Price History</th>
                <th className="py-3.5 px-3">Screening Verdict</th>
                <th className="py-3.5 px-3 text-center">Deep Dive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#093017]/70 font-sans">
              {filtered.map((c) => {
                const passes = isPass(c.primary_status);
                const excluded = isExcl(c.primary_status);
                const investigate = isInvest(c.primary_status);

                return (
                  <tr key={c.id} className="hover:bg-[#072411]/60 transition-colors">
                    {/* 1. Candidate Name & Ticker */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[11px] font-mono text-[#74D885] mt-0.5">
                        {c.identifier}
                      </div>
                    </td>

                    {/* 2. European Exposure Basis */}
                    <td className="py-3.5 px-3 text-slate-300 max-w-[200px]">
                      <div className="truncate font-medium text-slate-200">
                        {c.european_exposure_basis || `${c.domicile} Assets`}
                      </div>
                      <div className="text-[10px] text-slate-400">Headquarters: {c.domicile}</div>
                    </td>

                    {/* 3. Infrastructure Category */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#072411] text-[#D3FCDA] border border-[#2CA757]/30">
                        {c.infrastructure_category || c.asset_class}
                      </span>
                    </td>

                    {/* 4. Candidate Type */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <div className="font-medium text-slate-200">
                        {c.candidate_type || (c.fund_type === 'Listed Infrastructure Company' ? 'Listed Infrastructure Company' : 'Investment Fund')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.fund_type}</div>
                    </td>

                    {/* 5. Research Score */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
                          (c.research_score || 0) >= 90
                            ? 'bg-[#093017] text-[#74D885] border border-[#2CA757]/40'
                            : (c.research_score || 0) >= 75
                            ? 'bg-sky-950/40 text-sky-300 border border-sky-800/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {c.research_score !== undefined ? `${c.research_score}` : '—'}
                      </span>
                    </td>

                    {/* 6. Financial Risk Status */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="text-[11px] font-medium text-slate-200">
                        {c.financial_risk_status || (c.volatility_3yr_pct && c.volatility_3yr_pct < 12 ? 'Regulated Utility Low Vol' : 'Moderate Volatility')}
                      </span>
                    </td>

                    {/* 7. Recommendation Category */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          passes
                            ? 'bg-[#093017] text-[#74D885] border border-[#2CA757]/40'
                            : excluded
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {c.recommendation_category || (passes ? 'Eligible Core' : excluded ? 'Strict Exclusion' : 'Investigation Flag')}
                      </span>
                    </td>

                    {/* 8. Price History / Track Record */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      <div className="font-semibold text-white">
                        {c.price_history_years ? `${c.price_history_years} yrs` : '5 yrs'}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        {c.has_sufficient_price_history !== 0 ? 'Verified history' : 'Insufficient'}
                      </div>
                    </td>

                    {/* 9. Screening Verdict */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${
                          passes
                            ? 'bg-[#093017] text-[#74D885] border-[#2CA757]/40'
                            : excluded
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                        }`}
                      >
                        {passes ? (
                          <CheckCircle2 className="w-3 h-3 text-[#2CA757] shrink-0" />
                        ) : excluded ? (
                          <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        ) : (
                          <HelpCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                        <span>
                          {passes
                            ? 'Passes required checks'
                            : excluded
                            ? 'Excluded'
                            : 'Needs ethical investigation'}
                        </span>
                      </span>
                    </td>

                    {/* 10. Actions / Deep Dive */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedCandidateId(c.id)}
                        className="p-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
                        title="View Full Infrastructure Evidence & Filings"
                        aria-label={`View full details for ${c.name}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Candidate Deep Dive Modal */}
      {selectedCandidateId && (
        <CandidateModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}
    </div>
  );
};
