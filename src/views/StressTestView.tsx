import React, { useState } from 'react';
import { Activity, Play, AlertTriangle, ShieldCheck, TrendingDown, Scale, DollarSign } from 'lucide-react';
import { api } from '../api';

export const StressTestView: React.FC = () => {
  const [shockType, setShockType] = useState<'market_crash' | 'carbon_transition' | 'interest_rate_spike'>('market_crash');
  const [marketDropPct, setMarketDropPct] = useState(15.0);
  const [interestDelta, setInterestDelta] = useState(1.5);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunStress = async () => {
    setLoading(true);
    try {
      const res = await api.runStressTest({
        shock_type: shockType,
        market_drop_pct: marketDropPct,
        interest_rate_delta: interestDelta,
      });
      setResults(res);
    } catch (err: any) {
      alert('Error running stress test: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Stress Testing & Scenario Analysis</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate hypothetical macro shocks, climate regulatory transitions, and rate fluctuations against portfolio positions.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunStress}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-rose-950/40 transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Simulating Shocks...' : 'Execute Stress Simulation'}</span>
        </button>
      </div>

      {/* Shock Parameters Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white">Stress Scenario Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Scenario Type</label>
            <select
              value={shockType}
              onChange={e => setShockType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium"
            >
              <option value="market_crash">Equity Market Drawdown (-15% Global Sell-off)</option>
              <option value="carbon_transition">Accelerated Carbon Tax & Clean Energy Transition</option>
              <option value="interest_rate_spike">Global Interest Rate Spike (+1.50% Hike)</option>
            </select>
          </div>

          {shockType === 'market_crash' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Market Drawdown Severity: <span className="font-mono text-rose-400 font-bold">-{marketDropPct}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={marketDropPct}
                onChange={e => setMarketDropPct(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500 mt-2"
              />
            </div>
          )}

          {shockType === 'interest_rate_spike' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Rate Spike (Basis Points): <span className="font-mono text-cyan-400 font-bold">+{interestDelta * 100} bps</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.25"
                value={interestDelta}
                onChange={e => setInterestDelta(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results View */}
      {results && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-200">Scenario Assumptions & Methodology:</div>
              <p className="text-slate-400 mt-0.5 leading-relaxed">{results.assumptions}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-xs">Pre-Shock Allocated Capital</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                £{results.total_original_allocated.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20">
              <span className="text-rose-400 text-xs">Post-Shock Portfolio Value</span>
              <div className="text-xl font-bold font-mono text-rose-300 mt-1">
                £{results.total_shocked_allocated.toLocaleString()}
              </div>
              <div className="text-[11px] text-rose-400 font-mono mt-0.5">
                Impact: {results.overall_impact_pct}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-emerald-400 text-xs">Preserved Cash Buffer</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                £{results.cash_reserve_preserved.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">
                Zero market volatility exposure
              </div>
            </div>
          </div>

          {/* Position Breakdown Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <th className="py-3 px-4">Fund Position</th>
                  <th className="py-3 px-3 text-right">Pre-Shock Amount</th>
                  <th className="py-3 px-3 text-right">Post-Shock Value</th>
                  <th className="py-3 px-3 text-right">Simulated Return</th>
                  <th className="py-3 px-4 text-right">Nominal Impact (£)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {results.positions_impact.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">{p.candidate_name}</td>
                    <td className="py-3 px-3 text-right text-slate-300">£{p.original_amount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right text-slate-200 font-bold">£{p.shocked_amount.toLocaleString()}</td>
                    <td className={`py-3 px-3 text-right font-bold ${p.impact_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.impact_pct > 0 ? '+' : ''}{p.impact_pct}%
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${p.dollar_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.dollar_impact > 0 ? '+' : ''}£{p.dollar_impact.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
