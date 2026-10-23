import {
  ClientProfile,
  PolicyRule,
  PolicyVersion,
  Candidate,
  ScreeningRun,
  ScreeningFinding,
  PortfolioScenario,
  AIExplanation,
  SourceDocument,
  AuditEvent,
  TestSuiteReport,
} from './types';

export const api = {
  // Profile
  getProfile: async (): Promise<ClientProfile> => {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },
  updateProfile: async (profile: Partial<ClientProfile>): Promise<{ success: boolean }> => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Policies & Rules
  getPolicies: async (): Promise<{ active_version: PolicyVersion; versions: PolicyVersion[]; rules: PolicyRule[] }> => {
    const res = await fetch('/api/policies');
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },
  updateRule: async (ruleId: string, updates: Partial<PolicyRule>): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/policies/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update rule');
    return res.json();
  },
  createRule: async (rule: Partial<PolicyRule>): Promise<{ success: boolean; rule_id: string }> => {
    const res = await fetch('/api/policies/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error('Failed to create rule');
    return res.json();
  },

  // Candidates
  getCandidates: async (): Promise<Candidate[]> => {
    const res = await fetch('/api/candidates');
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },
  getCandidateDetail: async (id: string): Promise<any> => {
    const res = await fetch(`/api/candidates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch candidate details');
    return res.json();
  },
  addCandidate: async (candData: any): Promise<{ success: boolean; candidate_id: string }> => {
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candData),
    });
    if (!res.ok) throw new Error('Failed to add candidate');
    return res.json();
  },

  // Screening
  runScreening: async (policyVersionId?: string): Promise<any> => {
    const res = await fetch('/api/screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_version_id: policyVersionId }),
    });
    if (!res.ok) throw new Error('Failed to execute ethical screening');
    return res.json();
  },
  getLatestScreening: async (): Promise<{ latest_run: ScreeningRun | null; findings: ScreeningFinding[] }> => {
    const res = await fetch('/api/screening/latest');
    if (!res.ok) throw new Error('Failed to fetch screening findings');
    return res.json();
  },

  // Portfolio
  calculatePortfolio: async (params: {
    total_budget_gbp?: number;
    min_cash_reserve_pct?: number;
    min_allocation_pct?: number;
    max_allocation_pct?: number;
    max_annual_fee_pct?: number;
    allocation_strategy?: string;
  }): Promise<PortfolioScenario> => {
    const res = await fetch('/api/portfolio/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to calculate portfolio');
    return res.json();
  },
  getScenarios: async (): Promise<PortfolioScenario[]> => {
    const res = await fetch('/api/portfolio/scenarios');
    if (!res.ok) throw new Error('Failed to fetch portfolio scenarios');
    return res.json();
  },
  getScenarioDetail: async (id: string): Promise<{ scenario: PortfolioScenario; positions: any[] }> => {
    const res = await fetch(`/api/portfolio/scenarios/${id}`);
    if (!res.ok) throw new Error('Failed to fetch scenario detail');
    return res.json();
  },

  // AI Explanation & Chat
  getAIExplanation: async (scenarioId?: string): Promise<AIExplanation> => {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    if (!res.ok) throw new Error('Failed to generate AI explanation');
    return res.json();
  },
  sendChatMessage: async (message: string): Promise<{ reply: string }> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to get chat response');
    return res.json();
  },
  askAnalyst: async (message: string, history?: any[]): Promise<{ reply: string }> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Failed to get assistant response');
    return res.json();
  },

  // Evidence
  getEvidence: async (): Promise<{ documents: SourceDocument[]; claims: any[] }> => {
    const res = await fetch('/api/evidence');
    if (!res.ok) throw new Error('Failed to fetch evidence');
    return res.json();
  },
  uploadEvidence: async (data: any): Promise<{ success: boolean; document_id: string }> => {
    const res = await fetch('/api/evidence/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to upload evidence');
    return res.json();
  },

  // Audit
  getAuditTrail: async (): Promise<AuditEvent[]> => {
    const res = await fetch('/api/audit');
    if (!res.ok) throw new Error('Failed to fetch audit events');
    return res.json();
  },

  // Data Quality
  getDataQuality: async (): Promise<any> => {
    const res = await fetch('/api/data-quality');
    if (!res.ok) throw new Error('Failed to fetch data quality metrics');
    return res.json();
  },

  // Stress Test
  runStressTest: async (params: any): Promise<any> => {
    const res = await fetch('/api/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run stress test');
    return res.json();
  },

  // Tests
  runUnitTests: async (): Promise<TestSuiteReport> => {
    const res = await fetch('/api/test', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run unit tests');
    return res.json();
  },

  // Demo Restore
  restoreDemoData: async (): Promise<{ success: boolean; message: string }> => {
    const res = await fetch('/api/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to restore demo data');
    return res.json();
  },

  // Connectors
  getConnectors: async (): Promise<any> => {
    const res = await fetch('/api/connectors');
    if (!res.ok) throw new Error('Failed to fetch connectors');
    return res.json();
  },
  testConnector: async (id: string): Promise<any> => {
    const res = await fetch('/api/connectors/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connector_id: id }),
    });
    if (!res.ok) throw new Error('Failed to test connector');
    return res.json();
  },
};
