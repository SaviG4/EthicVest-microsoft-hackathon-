import React, { useState } from 'react';
import { SlidersHorizontal, ArrowRight, RotateCcw, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Scale } from 'lucide-react';
import { PolicyRule, Candidate } from '../types';

interface SimulatorViewProps {
  rules: PolicyRule[];
  candidates: Candidate[];
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ rules, candidates }) => {
  const [modifiedRules, setModifiedRules] = useState<Record<string, { status: string; threshold_pct: number }>>({});
  const [selectedRuleId, setSelectedRuleId] = useState<string>(rules[0]?.id || '');

  const activeRule = rules.find(r => r.id === selectedRuleId) || rules[0];

  const currentStatus = modifiedRules[selectedRuleId]?.status || activeRule?.status || 'active';
  const currentThreshold = modifiedRules[selectedRuleId]?.threshold_pct !== undefined
    ? modifiedRules[selectedRuleId].threshold_pct
    : activeRule?.threshold_pct || 0.0;

  const handleToggleStatus = () => {
    setModifiedRules(prev => ({
      ...prev,
      [selectedRuleId]: {
        status: currentStatus === 'active' ? 'inactive' : 'active',
        threshold_pct: currentThreshold,
      },
    }));
  };

  const handleThresholdChange = (val: number) => {
    setModifiedRules(prev => ({
      ...prev,
      [selectedRuleId]: {
        status: currentStatus,
        threshold_pct: val,
      },
    }));
  };

  const handleResetSimulation = () => {
    setModifiedRules({});
  };

  // Compute simulated candidate statuses
  const simulatedCandidates = candidates.map(c => {
    let simStatus = c.primary_status;
    let changeReason = 'No change under current parameter';

    // What if Fossil Fuel rule is modified?
    if (activeRule?.sector_or_activity === 'fossil_fuels') {
      if (currentStatus === 'inactive') {
        if (c.name.includes('Vanguard')) {
          simStatus = 'EXCLUDED';
          changeReason = 'Still EXCLUDED due to remaining active breaches in POL-ARM-01 (Lockheed Martin) and POL-TOB-01.';
        }
      } else if (currentThreshold >= 1.0) {
        if (c.name.includes('Vanguard')) {
          simStatus = 'EXCLUDED';
          changeReason = 'Exceeds threshold or still blocked by Weapons (POL-ARM-01) and Tobacco (POL-TOB-01).';
        }
      }
    }

    // What if Armaments rule is deactivated?
    if (activeRule?.sector_or_activity === 'armaments') {
      if (currentStatus === 'inactive' && c.name.includes('Vanguard')) {
        simStatus = 'EXCLUDED';
        changeReason = 'Still EXCLUDED due to Shell/Exxon in Fossil Fuels (POL-FF-01).';
      }
    }

    return {
      ...c,
      simStatus,
      changeReason,
      hasChanged: simStatus !== c.primary_status,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">What-If Policy Simulator</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate rule modifications, threshold adjustments, and evaluate real-time candidate status sensitivity.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Simulator Control Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Interactive Sensitivity Controls</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Policy Rule to Test</label>
            <select
              value={selectedRuleId}
              onChange={e => setSelectedRuleId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium"
            >
              {rules.map(r => (
                <option key={r.id} value={r.id}>
                  {r.rule_code}: {r.name} ({r.rule_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rule Activation Status</label>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleToggleStatus}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-xs cursor-pointer transition-colors ${
                  currentStatus === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {currentStatus === 'active' ? 'Rule Active' : 'Rule Inactive (Relaxed)'}
              </button>
              <span className="text-slate-400 text-[11px]">Click to toggle enforcement</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Simulated Threshold (%): <span className="font-mono text-cyan-400 font-bold">{currentThreshold}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={currentThreshold}
              onChange={e => handleThresholdChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0% (Zero tolerance)</span>
              <span>5% (Materiality)</span>
              <span>10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Impact Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs">
          <span className="font-bold text-white">Simulated Candidate Status Shifts</span>
          <span className="font-mono text-slate-400">Rule Tested: {activeRule?.rule_code}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <th className="py-2.5 px-4">Fund Name</th>
                <th className="py-2.5 px-3">Current Active Status</th>
                <th className="py-2.5 px-3 text-center">Direction</th>
                <th className="py-2.5 px-3">Simulated Status</th>
                <th className="py-2.5 px-4">Simulation Impact Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {simulatedCandidates.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-200">{c.name}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      c.primary_status === 'ELIGIBLE FOR FURTHER COMPARISON'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : c.primary_status === 'EXCLUDED'
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {c.primary_status === 'ELIGIBLE FOR FURTHER COMPARISON' ? 'ELIGIBLE' : c.primary_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500">
                    <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      c.simStatus === 'ELIGIBLE FOR FURTHER COMPARISON'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : c.simStatus === 'EXCLUDED'
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {c.simStatus === 'ELIGIBLE FOR FURTHER COMPARISON' ? 'ELIGIBLE' : c.simStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{c.changeReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
