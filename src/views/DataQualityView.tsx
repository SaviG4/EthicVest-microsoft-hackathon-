import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, Clock, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export const DataQualityView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.getDataQuality()
      .then(res => setMetrics(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        aria-label="Data Quality Header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#051a0d] border border-[#093017] shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#093017] border border-[#2CA757]/30 text-[#74D885]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Data Quality & Freshness Audit</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Tracks constituent disclosure transparency, point-in-time freshness limits (180 days), and connector synchronization health.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/30 text-xs font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#74D885]" />
          <span>Refresh Quality Metrics</span>
        </button>
      </section>

      {/* Metrics Cards */}
      {metrics && (
        <section aria-label="Quality Statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
            <span className="text-slate-400">Holdings Transparency Rate</span>
            <div className="text-2xl font-bold font-mono text-[#74D885] mt-1">
              {metrics.holdings_coverage_pct}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">European assets with 100% full schedules</p>
          </div>

          <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
            <span className="text-slate-400">Fee Metric Completeness</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics.fee_coverage_pct}%
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Disclosed ongoing charges & costs</p>
          </div>

          <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
            <span className="text-slate-400">Stale Filings (&gt;180 Days)</span>
            <div className={`text-2xl font-bold font-mono mt-1 ${
              metrics.stale_records_count > 0 ? 'text-amber-400' : 'text-slate-200'
            }`}>
              {metrics.stale_records_count}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Triggers Needs ethical investigation</p>
          </div>

          <div className="p-4 rounded-xl bg-[#051a0d] border border-[#093017]">
            <span className="text-slate-400">Unresolved Policy Checks</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {metrics.unresolved_checks_count}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Opaque constituent checks pending</p>
          </div>
        </section>
      )}

      {/* Governance & Freshness Rules Card */}
      <section aria-label="Configured Freshness Rules" className="p-5 rounded-2xl bg-[#051a0d] border border-[#093017] space-y-3 text-xs">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#74D885]" />
          <span>Configured Freshness & Quality Safeguards</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017]">
            <div className="font-semibold text-white">180-Day Disclosure Expiry</div>
            <p className="text-slate-300 text-[11px] mt-1 leading-snug">
              Factsheets or schedules published more than 180 days ago are classified as stale. They cannot proceed to Passes required checks status.
            </p>
          </div>

          <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017]">
            <div className="font-semibold text-white">Anti-Presumption Safeguard</div>
            <p className="text-slate-300 text-[11px] mt-1 leading-snug">
              An unverified holding is never assumed zero. Missing values immediately trigger a "Needs ethical investigation" finding.
            </p>
          </div>

          <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017]">
            <div className="font-semibold text-white">Audited Primary Sources</div>
            <p className="text-slate-300 text-[11px] mt-1 leading-snug">
              Only primary corporate annual reports, regulatory filings, and audited factsheets are accepted into the EthicVest provenance repository.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
