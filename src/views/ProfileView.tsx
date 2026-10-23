import React, { useState } from 'react';
import {
  Building2,
  Save,
  RotateCcw,
  Plus,
  ExternalLink,
  ShieldAlert,
  Sliders,
  FileCheck2,
  Download,
  Info,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ClientProfile, PolicyRule } from '../types';
import { api } from '../api';

interface ProfileViewProps {
  profile: ClientProfile | null;
  rules: PolicyRule[];
  onProfileUpdated: () => void;
  onRulesUpdated: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  rules,
  onProfileUpdated,
  onRulesUpdated,
}) => {
  const [formData, setFormData] = useState<Partial<ClientProfile>>(profile || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'financial' | 'ethical'>('identity');
  const [editingRule, setEditingRule] = useState<PolicyRule | null>(null);
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);

  // New rule form state
  const [newRule, setNewRule] = useState({
    rule_code: 'POL-CUSTOM-01',
    name: 'New Custom Ethical Restriction',
    sector_or_activity: 'fossil_fuels',
    rule_type: 'mandatory_exclusion' as const,
    severity: 'high' as const,
    threshold_pct: 0.0,
    description: 'Custom exclusion criteria defined by charity investment committee.',
    action_on_unknown: 'investigate' as const,
    status: 'active' as const,
  });

  const handleInputChange = (field: keyof ClientProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onProfileUpdated();
    } catch (err: any) {
      alert('Error saving profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRuleStatus = async (rule: PolicyRule) => {
    const newStatus = rule.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateRule(rule.id, { status: newStatus });
      onRulesUpdated();
    } catch (err: any) {
      alert('Error updating rule: ' + err.message);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await api.createRule({
        ...newRule,
        policy_version_id: 'pol_ver_01',
      });
      setShowNewRuleModal(false);
      onRulesUpdated();
    } catch (err: any) {
      alert('Error creating rule: ' + err.message);
    }
  };

  const handleExportJson = () => {
    const payload = {
      profile: formData,
      rules,
      exported_at: new Date().toISOString(),
      governance_reference: 'Joseph Rowntree Charitable Trust Case Study',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ethicalvest-profile-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header and Step Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Screen 1: Charity Profile & Policy Builder</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Step 1 of 4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Establish investment parameters, starting endowment capital, and configurable ethical rules prior to candidate screening.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'identity'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          A. Client Identity & Mission
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'financial'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          B. Financial Requirements & Budget
        </button>
        <button
          onClick={() => setActiveTab('ethical')}
          className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ethical'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>C. Ethical Policy Rules</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">{rules.length}</span>
        </button>
      </div>

      {/* TAB A: Client Identity */}
      {activeTab === 'identity' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 text-xs">
          <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl flex items-start gap-2.5 text-cyan-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <p className="leading-relaxed">
              <strong>Hypothetical Client Disclosure:</strong> This profile illustrates how a charitable endowment evaluates investments against published ethical standards using the Joseph Rowntree Charitable Trust (JRCT) research case study. JRCT has not endorsed or approved any proposed portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Charity / Client Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Organisation Type</label>
              <input
                type="text"
                value={formData.org_type || ''}
                onChange={e => handleInputChange('org_type', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Charity Mission Statement</label>
              <textarea
                rows={2}
                value={formData.mission || ''}
                onChange={e => handleInputChange('mission', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Investment Objective</label>
              <textarea
                rows={2}
                value={formData.investment_objective || ''}
                onChange={e => handleInputChange('investment_objective', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Policy Document Source URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.policy_source_url || ''}
                  onChange={e => handleInputChange('policy_source_url', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-[11px] focus:border-emerald-500 focus:outline-none"
                />
                <a
                  href={formData.policy_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                  title="Open official policy document in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Policy Version / Release Tag</label>
              <input
                type="text"
                value={formData.policy_version || '2026.1'}
                onChange={e => handleInputChange('policy_version', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB B: Financial Requirements */}
      {activeTab === 'financial' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Investment Budget (£ GBP)</label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={formData.starting_budget || 100000}
                onChange={e => handleInputChange('starting_budget', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Default benchmark: £100,000</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Investment Timeframe (Years)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.timeframe_years || 7}
                onChange={e => handleInputChange('timeframe_years', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Endowment horizon</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Risk Tolerance</label>
              <select
                value={formData.risk_tolerance || 'moderate'}
                onChange={e => handleInputChange('risk_tolerance', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="conservative">Conservative (Capital preservation priority)</option>
                <option value="moderate">Moderate (Balanced growth and volatility)</option>
                <option value="growth-oriented">Growth-Oriented (Higher equity volatility tolerance)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Liquidity Needs</label>
              <select
                value={formData.liquidity_needs || 'medium'}
                onChange={e => handleInputChange('liquidity_needs', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="low">Low (Funds can be locked up for long grant cycles)</option>
                <option value="medium">Medium (Regular quarterly grant distributions)</option>
                <option value="high">High (Frequent cash withdrawals required)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Minimum Cash Reserve (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={formData.min_cash_reserve_pct || 5.0}
                onChange={e => handleInputChange('min_cash_reserve_pct', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Preserves cash buffer for operational expenses</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Max Concentration per Fund (%)</label>
              <input
                type="number"
                min={10}
                max={100}
                value={formData.max_concentration_pct || 35.0}
                onChange={e => handleInputChange('max_concentration_pct', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Diversification limit (default 35%)</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maximum Annual Fee Budget (%)</label>
              <input
                type="number"
                min={0.1}
                max={3.0}
                step={0.05}
                value={formData.max_annual_fee_pct || 0.85}
                onChange={e => handleInputChange('max_annual_fee_pct', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ongoing Charges Figure (OCF) ceiling</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: Ethical Policy Builder */}
      {activeTab === 'ethical' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Configured Policy Rules</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rules govern deterministic candidate filtering. Positive priorities never override mandatory exclusions.
              </p>
            </div>
            <button
              onClick={() => setShowNewRuleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Rule</span>
            </button>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <th className="py-3 px-4">Code / Rule Name</th>
                  <th className="py-3 px-3">Sector / Activity</th>
                  <th className="py-3 px-3">Rule Type</th>
                  <th className="py-3 px-3 text-center">Max Threshold</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-4 text-center">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {rules.map((rule) => {
                  const isActive = rule.status === 'active';
                  const isMandatory = rule.rule_type === 'mandatory_exclusion';
                  return (
                    <tr key={rule.id} className={!isActive ? 'opacity-50 bg-slate-950/40' : 'hover:bg-slate-800/30'}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{rule.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rule.rule_code}</div>
                        <div className="text-[11px] text-slate-400 mt-1 max-w-md line-clamp-1">{rule.description}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {rule.sector_or_activity}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isMandatory
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : rule.rule_type === 'positive_preference'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}>
                          {rule.rule_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {rule.threshold_pct !== null ? `${rule.threshold_pct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-400">
                        {rule.severity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleRuleStatus(rule)}
                          className="cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                        >
                          {isActive ? (
                            <ToggleRight className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-600" />
                          )}
                          <span className={`text-[10px] font-mono font-bold uppercase ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {rule.status}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Rule */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Add Ethical Policy Restriction</h3>
              <button
                onClick={() => setShowNewRuleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Code Identifier</label>
                <input
                  type="text"
                  required
                  value={newRule.rule_code}
                  onChange={e => setNewRule({ ...newRule, rule_code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rule Type</label>
                  <select
                    value={newRule.rule_type}
                    onChange={e => setNewRule({ ...newRule, rule_type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="mandatory_exclusion">Mandatory Exclusion</option>
                    <option value="conditional_restriction">Conditional Restriction</option>
                    <option value="positive_preference">Positive Preference</option>
                    <option value="disclosure_requirement">Disclosure Requirement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Threshold (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={newRule.threshold_pct}
                    onChange={e => setNewRule({ ...newRule, threshold_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description & Evidence Requirement</label>
                <textarea
                  rows={2}
                  required
                  value={newRule.description}
                  onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRuleModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Save Policy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
