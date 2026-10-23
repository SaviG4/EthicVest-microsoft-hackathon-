import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { AuditEvent } from '../types';
import { api } from '../api';

export const AuditView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    api.getAuditTrail()
      .then(res => setEvents(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.action_type.toLowerCase().includes(search.toLowerCase()) ||
      e.affected_record.toLowerCase().includes(search.toLowerCase()) ||
      e.details_json.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType !== 'ALL' && e.action_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <History className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Immutable Decision Audit Trail</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically timestamped ledger of policy modifications, candidate imports, screening runs, and portfolio calculations.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
          {events.length} Logged Events
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by action, record ID, or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Filter Action:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="ALL">All Actions</option>
            <option value="policy_updated">Policy Updated</option>
            <option value="screening_executed">Screening Executed</option>
            <option value="portfolio_constructed">Portfolio Constructed</option>
            <option value="ai_explanation_generated">AI Explanation</option>
            <option value="candidate_imported">Candidate Imported</option>
            <option value="demo_reset">Demo Reset</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Affected Record</th>
                <th className="py-3 px-4">Event Details & Parameters</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredEvents.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-cyan-300">
                      {e.action_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-semibold truncate max-w-[140px]">
                    {e.affected_record}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300 text-[11px] leading-snug">
                    <div className="line-clamp-2 max-w-lg font-mono text-[10px] bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                      {e.details_json}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-emerald-400 font-bold uppercase text-[10px] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{e.outcome}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
