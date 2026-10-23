import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';

interface SettingsViewProps {
  onOpenTestRunner: () => void;
  onRestoreDemo: () => void;
  isRestoringDemo: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenTestRunner,
  onRestoreDemo,
  isRestoringDemo,
}) => {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    api
      .getConnectors()
      .then((res) => setConnectors(res.connectors))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTestConnector = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testConnector(id);
      setTestResults((prev) => ({ ...prev, [id]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, message: err.message } }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        aria-label="Settings Header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#051a0d] border border-[#093017] shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#093017] border border-[#2CA757]/30 text-[#74D885]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Settings & Data</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage data ingestion connectors, verify API health, run automated tests, and control demonstration environment state.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenTestRunner}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#072411] hover:bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/40 text-xs font-semibold cursor-pointer transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA757]"
        >
          <Terminal className="w-3.5 h-3.5 text-[#74D885]" />
          <span>Execute Automated Tests (10/10)</span>
        </button>
      </section>

      {/* Connectors Grid */}
      <section aria-label="Data Connectors" className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-[#74D885]" />
          <span>External & Regulatory Data Connectors</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors.map((c) => {
            const testRes = testResults[c.id];
            return (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-[#051a0d] border border-[#093017] space-y-3 flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white">{c.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{c.type}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        c.status === 'active'
                          ? 'bg-[#093017] text-[#74D885] border border-[#2CA757]/30'
                          : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-2.5 p-2 bg-[#04140a] rounded-lg border border-[#093017] text-[11px] font-mono text-slate-300 truncate">
                    Endpoint: {c.endpoint}
                  </div>

                  {c.notes && <p className="text-[11px] text-slate-400 mt-1.5">{c.notes}</p>}

                  {testRes && (
                    <div
                      className={`mt-2 p-2 rounded text-[11px] font-mono ${
                        testRes.success
                          ? 'bg-[#093017] border border-[#2CA757]/40 text-[#D3FCDA]'
                          : 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
                      }`}
                    >
                      {testRes.message} {testRes.latency_ms && `(${testRes.latency_ms}ms)`}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#093017] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {c.is_live ? 'Live Data Feed' : 'Authentic Demo Mode'}
                  </span>
                  <button
                    onClick={() => handleTestConnector(c.id)}
                    disabled={testingId === c.id}
                    className="px-2.5 py-1 rounded bg-[#072411] hover:bg-[#093017] text-[#74D885] border border-[#2CA757]/30 text-[11px] font-medium cursor-pointer transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
                  >
                    {testingId === c.id ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* System Specifications */}
      <section aria-label="System Architecture" className="p-5 rounded-2xl bg-[#051a0d] border border-[#093017] space-y-3 text-xs">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#74D885]" />
          <span>System & Engine Architecture</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
          <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017] space-y-1">
            <span className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Compliance & Arithmetic</span>
            <div className="text-white font-bold">Python 3.10 Engine</div>
            <div className="text-slate-400 text-[10px]">Deterministic SQLite + Decimal-safe arithmetic</div>
          </div>

          <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017] space-y-1">
            <span className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Generative AI Reasoning</span>
            <div className="text-white font-bold">Gemini 3.8 Flash</div>
            <div className="text-slate-400 text-[10px]">Strict grounding, JSON schema, and source citations</div>
          </div>

          <div className="p-3 bg-[#04140a] rounded-xl border border-[#093017] space-y-1">
            <span className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Database & Storage</span>
            <div className="text-white font-bold">SQLite Persistence</div>
            <div className="text-slate-400 text-[10px]">15 relational tables with transaction safety</div>
          </div>
        </div>
      </section>

      {/* Demo Environment Management & Working Reset Button */}
      <section aria-label="Reset Demo Environment" className="p-5 rounded-2xl bg-[#051a0d] border border-[#2CA757]/30 space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <RotateCcw className="w-4 h-4 text-[#74D885]" />
            <span>Reset Demo Environment</span>
          </div>
          <button
            onClick={() => setShowConfirmReset(true)}
            disabled={isRestoringDemo}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#2CA757] hover:bg-[#258c49] text-[#093017] text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74D885]"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRestoringDemo ? 'animate-spin' : ''}`} />
            <span>{isRestoringDemo ? 'Restoring Universe...' : 'Reset Demo'}</span>
          </button>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Restoring the demo database cleanly wipes test records, re-seeds the European infrastructure universe (12 candidates across offshore wind, transmission networks, and circular assets), runs a fresh deterministic ethical screening, and calculates the baseline portfolio.
        </p>
      </section>

      {/* Working Confirmation Modal */}
      {showConfirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#051a0d] border border-[#2CA757]/40 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              <div className="p-2 rounded-lg bg-[#093017] text-[#74D885]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <span id="reset-modal-title">Reset Demo Database?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Are you sure you wish to restore the demonstration dataset? This will restore the EthicVest European infrastructure universe, re-run ethical screening, and recalculate the initial portfolio scenario.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 rounded-xl bg-[#072411] hover:bg-[#093017] text-slate-300 font-medium cursor-pointer transition-colors border border-[#093017] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmReset(false);
                  onRestoreDemo();
                }}
                className="px-4 py-2 rounded-xl bg-[#2CA757] hover:bg-[#258c49] text-[#093017] font-bold cursor-pointer transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74D885]"
              >
                Confirm Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
