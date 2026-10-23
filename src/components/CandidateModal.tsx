import React, { useEffect, useState } from 'react';
import { X, ExternalLink, AlertOctagon, CheckCircle2, HelpCircle, FileText, Calendar, Building, Percent } from 'lucide-react';
import { api } from '../api';

interface CandidateModalProps {
  candidateId: string | null;
  onClose: () => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({ candidateId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    api.getCandidateDetail(candidateId)
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (!candidateId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Building className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{data?.candidate?.name || 'Loading candidate...'}</h3>
                {data?.latest_finding && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    data.latest_finding.primary_status === 'Passes required checks' || data.latest_finding.primary_status === 'ELIGIBLE FOR FURTHER COMPARISON'
                      ? 'bg-[#093017] text-[#74D885] border border-[#2CA757]/40'
                      : data.latest_finding.primary_status === 'Excluded' || data.latest_finding.primary_status === 'EXCLUDED'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  }`}>
                    {data.latest_finding.primary_status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ISIN: <span className="font-mono text-white">{data?.candidate?.identifier}</span> · {data?.candidate?.infrastructure_category || data?.candidate?.asset_class} · {data?.candidate?.domicile}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading && (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Retrieving fund holdings, rules audit, and source factsheets...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Screening Rationale Banner */}
              {data.latest_finding && (
                <div className={`p-4 rounded-xl border ${
                  data.latest_finding.primary_status === 'Passes required checks' || data.latest_finding.primary_status === 'ELIGIBLE FOR FURTHER COMPARISON'
                    ? 'bg-[#093017] border-[#2CA757]/40 text-[#D3FCDA]'
                    : data.latest_finding.primary_status === 'Excluded' || data.latest_finding.primary_status === 'EXCLUDED'
                    ? 'bg-rose-950/60 border-rose-800/40 text-rose-300'
                    : 'bg-amber-950/60 border-amber-800/40 text-amber-300'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {data.latest_finding.primary_status === 'Passes required checks' || data.latest_finding.primary_status === 'ELIGIBLE FOR FURTHER COMPARISON' ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2CA757] mt-0.5" />
                    ) : data.latest_finding.primary_status === 'Excluded' || data.latest_finding.primary_status === 'EXCLUDED' ? (
                      <AlertOctagon className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    ) : (
                      <HelpCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-sm">Ethical Screening Engine Verdict</div>
                      <p className="mt-1 leading-relaxed opacity-90">{data.latest_finding.summary_rationale}</p>
                      <div className="mt-2 flex items-center gap-4 text-[11px] opacity-80 font-mono">
                        <span>Holdings Disclosed: {data.latest_finding.holdings_coverage_pct}%</span>
                        <span>Evidence: {data.latest_finding.evidence_completeness}</span>
                        <span>Freshness: {data.latest_finding.data_freshness_status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verified Financial Metrics Card */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Verified Financial & Cost Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400">Ongoing Fee (OCF)</span>
                    <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                      {data.metrics?.ocf_fee_pct !== null ? `${data.metrics.ocf_fee_pct}%` : 'Unavailable'}
                    </div>
                    <span className="text-[10px] text-slate-500">Annual charge</span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400">3Y Volatility</span>
                    <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                      {data.metrics?.volatility_3yr_pct ? `${data.metrics.volatility_3yr_pct}%` : 'Unavailable'}
                    </div>
                    <span className="text-[10px] text-slate-500">Standard deviation</span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400">3Y Cumulative Return</span>
                    <div className={`text-base font-mono font-bold mt-0.5 ${
                      (data.metrics?.perf_3yr_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {data.metrics?.perf_3yr_pct !== null ? `${data.metrics.perf_3yr_pct > 0 ? '+' : ''}${data.metrics.perf_3yr_pct}%` : 'Unavailable'}
                    </div>
                    <span className="text-[10px] text-slate-500">Historical performance</span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400">Yield</span>
                    <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                      {data.metrics?.yield_pct !== null ? `${data.metrics.yield_pct}%` : 'Unavailable'}
                    </div>
                    <span className="text-[10px] text-slate-500">Trailing 12-month income</span>
                  </div>
                </div>
              </div>

              {/* Holdings Level Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Disclosed Portfolio Constituents ({data.holdings.length} positions)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Disclosure: <span className="font-semibold text-slate-200 capitalize">{data.candidate.holdings_disclosure_level}</span>
                  </span>
                </div>

                {data.holdings.length === 0 ? (
                  <div className="p-6 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-slate-400">
                    <AlertOctagon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    No holdings disclosures published by this fund manager. Cannot establish ethical compliance.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                          <th className="py-2.5 px-3">Company / Issuer</th>
                          <th className="py-2.5 px-3">Sector</th>
                          <th className="py-2.5 px-3 text-right">Weight</th>
                          <th className="py-2.5 px-3 text-center">Controversial Tag</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {data.holdings.map((h: any) => {
                          const isBreach = h.is_prohibited_direct === 1;
                          return (
                            <tr key={h.id} className={isBreach ? 'bg-rose-950/20' : 'hover:bg-slate-800/30'}>
                              <td className="py-2 px-3 font-sans font-medium text-slate-200">
                                {h.company_name}
                                {h.issuer_identifier && (
                                  <span className="text-[10px] text-slate-400 ml-1.5">({h.issuer_identifier})</span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-400">{h.sector}</td>
                              <td className="py-2 px-3 text-right text-slate-200">{h.weight_pct}%</td>
                              <td className="py-2 px-3 text-center">
                                {h.controversial_activities ? (
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                                    isBreach
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  }`}>
                                    {h.controversial_activities}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {isBreach ? (
                                  <span className="text-rose-400 font-bold">BREACH</span>
                                ) : (
                                  <span className="text-emerald-400">VERIFIED</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Source Documents & Provenance */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Traceable Source Disclosures & Filings
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-200">Official Factsheet & Schedule</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Pub Date: {data.candidate.source_pub_date}</span>
                          <span>·</span>
                          <span>Retrieval: {data.candidate.data_retrieval_date}</span>
                        </div>
                      </div>
                    </div>
                    {data.candidate.factsheet_url && (
                      <a
                        href={data.candidate.factsheet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-[11px]"
                      >
                        Factsheet URL <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            Record ID: {candidateId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
