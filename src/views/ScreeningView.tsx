import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Play,
  Download,
  Eye,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { Candidate, ScreeningRun, ScreeningStatus } from '../types';
import { CandidateModal } from '../components/CandidateModal';

interface ScreeningViewProps {
  candidates: Candidate[];
  latestRun: ScreeningRun | null;
  onRunScreening: () => void;
  isScreening: boolean;
  onNavigateToPortfolio: () => void;
  onCandidateAdded?: () => void;
}

export const ScreeningView: React.FC<ScreeningViewProps> = ({
  candidates,
  latestRun,
  onRunScreening,
  isScreening,
  onNavigateToPortfolio,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSES' | 'EXCLUDED' | 'INVESTIGATION'>('ALL');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const isPass = (status?: string) =>
    status === 'Passes required checks' || status === 'ELIGIBLE FOR FURTHER COMPARISON';
  const isExcl = (status?: string) =>
    status === 'Excluded' || status === 'EXCLUDED';
  const isInvest = (status?: string) =>
    status === 'Needs ethical investigation' || status === 'NEEDS INVESTIGATION';

  const passesCount = candidates.filter((c) => isPass(c.primary_status)).length;
  const excludedCount = candidates.filter((c) => isExcl(c.primary_status)).length;
  const investigationCount = candidates.filter((c) => isInvest(c.primary_status)).length;

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.identifier.toLowerCase().includes(search.toLowerCase()) ||
      c.fund_manager.toLowerCase().includes(search.toLowerCase()) ||
      (c.infrastructure_category || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'PASSES') return isPass(c.primary_status);
    if (statusFilter === 'EXCLUDED') return isExcl(c.primary_status);
    if (statusFilter === 'INVESTIGATION') return isInvest(c.primary_status);
    return true;
  });

  const handleExportCsv = () => {
    const headers = [
      'Candidate Name',
      'Identifier',
      'Category',
      'Status',
      'Breaches',
      'Disclosed %',
      'Rationale',
    ];
    const rows = filteredCandidates.map((c) => [
      `"${c.name}"`,
      c.identifier,
      `"${c.infrastructure_category || c.asset_class}"`,
      isPass(c.primary_status)
        ? 'Passes required checks'
        : isExcl(c.primary_status)
        ? 'Excluded'
        : 'Needs ethical investigation',
      c.confirmed_breaches_count || 0,
      `${c.holdings_coverage_pct || 0}%`,
      `"${c.summary_rationale || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ethicvest-screening-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#051a0d] border border-[#093017] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#093017] border border-[#2CA757]/30 text-[#74D885]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Ethical Screening Engine</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#093017] text-[#74D885] border border-[#2CA757]/30">
                Deterministic
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Audited Python verification against European infrastructure policy exclusions (fossil fuel exploration, thermal coal, weapons, tobacco) and 180-day constituent disclosure standards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-slate-200 border border-[#093017] text-xs font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onRunScreening}
            disabled={isScreening}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2CA757] hover:bg-[#258c49] text-[#093017] text-xs font-bold cursor-pointer shadow-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74D885]"
          >
            <Play className={`w-3.5 h-3.5 ${isScreening ? 'animate-spin' : ''}`} />
            <span>{isScreening ? 'Screening Universe...' : 'Run Screening Engine'}</span>
          </button>
        </div>
      </div>

      {/* 3 Status Filter Chips & Proceed CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#051a0d] border border-[#093017] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-300 font-semibold mr-1">Screening Verdict:</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757] ${
              statusFilter === 'ALL'
                ? 'bg-[#093017] text-[#D3FCDA] font-bold border border-[#2CA757]/40'
                : 'bg-[#04140a] text-slate-300 hover:text-white border border-[#093017]'
            }`}
          >
            All Candidates ({candidates.length})
          </button>
          <button
            onClick={() => setStatusFilter('PASSES')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757] ${
              statusFilter === 'PASSES'
                ? 'bg-[#2CA757] text-[#093017] font-bold'
                : 'bg-[#072411] text-[#74D885] hover:bg-[#093017] border border-[#2CA757]/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passes required checks ({passesCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('EXCLUDED')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500 ${
              statusFilter === 'EXCLUDED'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-950/60 border border-rose-800/40'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Excluded ({excludedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('INVESTIGATION')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
              statusFilter === 'INVESTIGATION'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-950/60 border border-amber-800/40'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Needs ethical investigation ({investigationCount})</span>
          </button>
        </div>

        <button
          onClick={onNavigateToPortfolio}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#093017] hover:bg-[#0c401f] text-[#D3FCDA] border border-[#2CA757]/40 text-xs font-semibold cursor-pointer transition-colors"
        >
          <span>Return to Portfolio Builder</span>
          <ArrowRight className="w-4 h-4 text-[#74D885]" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by candidate name, ISIN, manager, or infrastructure category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#051a0d] border border-[#093017] focus:border-[#2CA757] rounded-xl text-xs text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
        />
      </div>

      {/* Main Candidates Table */}
      <section aria-label="Screening Findings Table" className="border border-[#093017] rounded-2xl overflow-hidden bg-[#051a0d] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#04140a] text-slate-300 border-b border-[#093017] text-[11px] font-semibold">
                <th className="py-3 px-4">Candidate / Asset</th>
                <th className="py-3 px-3">Infrastructure Focus</th>
                <th className="py-3 px-3">Screening Verdict</th>
                <th className="py-3 px-3 text-center">Confirmed Breaches</th>
                <th className="py-3 px-3 text-center">Holdings Coverage</th>
                <th className="py-3 px-4">Policy Rationale & Evidence</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#093017]/70 font-sans">
              {filteredCandidates.map((c) => {
                const passes = isPass(c.primary_status);
                const excluded = isExcl(c.primary_status);
                const investigate = isInvest(c.primary_status);

                return (
                  <tr key={c.id} className="hover:bg-[#072411]/60 transition-colors">
                    {/* Candidate Name & ISIN */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.data_status === 'synthetic_demo' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                            TEST ASSET
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {c.identifier} · {c.domicile}
                      </div>
                    </td>

                    {/* Infrastructure Focus */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-200 font-medium">{c.infrastructure_category || c.asset_class}</div>
                      <div className="text-[11px] text-[#74D885] mt-0.5">
                        {c.candidate_type || 'Infrastructure Equity'}
                      </div>
                    </td>

                    {/* Screening Verdict */}
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2CA757] shrink-0" />
                        ) : excluded ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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

                    {/* Confirmed Breaches */}
                    <td className="py-3.5 px-3 text-center">
                      {(c.confirmed_breaches_count || 0) > 0 ? (
                        <span className="font-mono text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/50">
                          {c.confirmed_breaches_count} Breach{c.confirmed_breaches_count === 1 ? '' : 'es'}
                        </span>
                      ) : (
                        <span className="font-mono text-[#74D885] font-medium">0 Breaches</span>
                      )}
                    </td>

                    {/* Holdings Coverage */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span
                        className={`font-semibold ${
                          c.holdings_disclosure_level === 'full'
                            ? 'text-[#74D885]'
                            : c.holdings_disclosure_level === 'partial'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {c.holdings_disclosure_level === 'full' ? '100%' : c.holdings_disclosure_level === 'partial' ? '26%' : '0%'}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {c.holdings_disclosure_level === 'full' ? 'Full schedule' : c.holdings_disclosure_level === 'partial' ? 'Top holdings only' : 'Zero disclosures'}
                      </div>
                    </td>

                    {/* Policy Rationale & Evidence */}
                    <td className="py-3.5 px-4 text-slate-300 text-[11px] leading-relaxed max-w-sm">
                      {c.summary_rationale || 'Awaiting deterministic screening run.'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedCandidateId(c.id)}
                        className="p-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
                        title="View Detailed Evidence & Constituent Holdings"
                        aria-label={`View evidence for ${c.name}`}
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
