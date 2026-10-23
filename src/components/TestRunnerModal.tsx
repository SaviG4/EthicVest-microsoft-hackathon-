import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Play, Clock, Terminal, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { TestSuiteReport } from '../types';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = () => {
    setRunning(true);
    setError(null);
    api.runUnitTests()
      .then(res => setReport(res))
      .catch(err => setError(err.message))
      .finally(() => setRunning(false));
  };

  useEffect(() => {
    if (isOpen && !report) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Automated Python Test Suite</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  unittest / pytest-ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifies deterministic policy rules, decimal calculations, exclusion enforcement, and warnings.
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

        {/* Action & Summary Bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-mono">
            {report && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Pass Rate:</span>
                  <span className={`font-bold ${report.failed_count === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {report.passed_count}/{report.total_tests} ({Math.round((report.passed_count / report.total_tests) * 100)}%)
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-800" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Duration: {report.total_duration_sec}s</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={runTests}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Executing Tests...' : 'Re-run Test Suite'}</span>
          </button>
        </div>

        {/* Tests List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {running && !report && (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Running Python unit test cases in temporary sandbox...</span>
            </div>
          )}

          {report && (
            <div className="space-y-2.5">
              {report.tests.map((t, idx) => (
                <div
                  key={t.test_id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    t.passed
                      ? 'bg-slate-950/50 border-slate-800/80 hover:border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                          <span>{t.title}</span>
                          <span className="font-mono text-[10px] text-slate-500">{t.duration_ms}ms</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                          {t.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        t.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>

                  {t.error && (
                    <div className="mt-2.5 p-2 bg-slate-950 rounded border border-rose-900/50 text-rose-300 font-mono text-[10px] whitespace-pre-wrap">
                      {t.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Source: `backend/test_ethicalvest.py`</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
