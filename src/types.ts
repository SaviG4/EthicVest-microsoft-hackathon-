export interface ClientProfile {
  id: string;
  name: string;
  org_type: string;
  mission: string;
  investment_objective: string;
  currency: string;
  starting_budget: number;
  description: string;
  policy_source_url: string;
  policy_version: string;
  is_hypothetical: number;
  timeframe_years: number;
  risk_tolerance: 'conservative' | 'moderate' | 'growth-oriented';
  liquidity_needs: 'low' | 'medium' | 'high';
  min_cash_reserve_pct: number;
  max_concentration_pct: number;
  max_annual_fee_pct: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyRule {
  id: string;
  policy_version_id: string;
  rule_code: string;
  name: string;
  sector_or_activity: string;
  rule_type: 'mandatory_exclusion' | 'conditional_restriction' | 'positive_preference' | 'disclosure_requirement' | 'monitoring_requirement';
  severity: 'high' | 'medium' | 'low';
  description: string;
  threshold_pct: number;
  include_indirect: number;
  evidence_required: string;
  source_document: string;
  status: 'active' | 'inactive';
  action_on_unknown: 'investigate' | 'exclude' | 'pass';
  review_notes?: string;
  created_at: string;
}

export interface PolicyVersion {
  id: string;
  profile_id: string;
  version_number: number;
  title: string;
  effective_date: string;
  source_reference: string;
  notes: string;
  created_at: string;
}

export interface Holding {
  id: string;
  candidate_id: string;
  company_name: string;
  issuer_identifier: string;
  sector: string;
  sub_sector?: string;
  weight_pct: number;
  holding_date: string;
  is_prohibited_direct: number;
  controversial_activities: string;
  verification_status: string;
  source_url?: string;
}

export type ScreeningStatus =
  | 'Passes required checks'
  | 'Excluded'
  | 'Needs ethical investigation'
  | 'ELIGIBLE FOR FURTHER COMPARISON'
  | 'EXCLUDED'
  | 'NEEDS INVESTIGATION';

export interface Candidate {
  id: string;
  name: string;
  legal_name: string;
  identifier: string;
  identifier_type: string;
  fund_manager: string;
  domicile: string;
  asset_class: string;
  currency: string;
  fund_type: string;
  official_url: string;
  factsheet_url: string;
  source_pub_date: string;
  data_retrieval_date: string;
  data_status: 'verified_factsheet' | 'imported' | 'synthetic_demo';
  holdings_disclosure_level: 'full' | 'partial' | 'none';
  european_exposure_basis?: string;
  infrastructure_category?: string;
  candidate_type?: string;
  research_score?: number;
  financial_risk_status?: string;
  recommendation_category?: string;
  price_history_years?: number;
  has_sufficient_price_history?: number;
  created_at: string;
  holdings_count?: number;
  ocf_fee_pct?: number;
  yield_pct?: number;
  volatility_3yr_pct?: number;
  perf_1yr_pct?: number;
  perf_3yr_pct?: number;
  perf_5yr_pct?: number;
  max_drawdown_pct?: number;
  metric_completeness?: string;
  primary_status?: ScreeningStatus;
  evidence_completeness?: 'complete' | 'partial' | 'missing';
  confirmed_breaches_count?: number;
  unresolved_checks_count?: number;
  holdings_coverage_pct?: number;
  data_freshness_status?: 'current' | 'stale' | 'unknown_date' | 'missing_date';
  summary_rationale?: string;
}

export interface ScreeningFinding {
  id: string;
  candidate_id: string;
  candidate_name?: string;
  identifier?: string;
  asset_class?: string;
  fund_manager?: string;
  primary_status: ScreeningStatus;
  evidence_completeness: 'complete' | 'partial' | 'missing';
  confirmed_breaches_count: number;
  unresolved_checks_count: number;
  holdings_coverage_pct: number;
  data_freshness_status: string;
  summary_rationale: string;
  details?: {
    confirmed_breaches: Array<{
      rule_code: string;
      rule_name: string;
      exposure_pct: number;
      threshold_pct: number;
      breached_holdings: Array<{
        company_name: string;
        weight_pct: number;
        sector: string;
        ticker?: string;
        source_url?: string;
      }>;
      rationale: string;
    }>;
    unresolved_checks: Array<{
      rule_code: string;
      rule_name: string;
      issue: string;
      details: string;
    }>;
    passed_checks: Array<{
      rule_code: string;
      rule_name: string;
      status: string;
      exposure_pct?: number;
      details?: string;
    }>;
    positive_alignments?: Array<{
      rule_code: string;
      rule_name: string;
      aligned_weight_pct: number;
      top_holdings: Array<{ company_name: string; weight_pct: number }>;
    }>;
    is_stale: boolean;
    holdings_count: number;
  };
}

export interface ScreeningRun {
  id: string;
  policy_version_id: string;
  run_timestamp: string;
  total_candidates: number;
  eligible_count: number;
  excluded_count: number;
  investigate_count: number;
  triggered_by: string;
  screening_engine_version: string;
}

export interface PortfolioPosition {
  candidate_id: string;
  name: string;
  identifier: string;
  asset_class: string;
  fund_manager: string;
  allocated_amount: number;
  weight_pct: number;
  ocf_fee_pct: number;
  annual_fee_gbp: number;
  yield_pct: number;
  volatility_3yr_pct: number;
  data_completeness: string;
  rationale: string;
}

export interface PortfolioScenario {
  id: string;
  name: string;
  screening_run_id: string;
  policy_version_id: string;
  total_budget: number;
  allocated_amount: number;
  unallocated_cash: number;
  weighted_fee_pct: number;
  weighted_yield_pct: number;
  weighted_volatility_pct: number;
  allocation_method: string;
  is_feasible: number | boolean;
  infeasibility_reason?: string;
  created_at: string;
  positions?: PortfolioPosition[];
}

export interface AIExplanation {
  summary: string;
  proposed_scenario_id: string;
  included_candidates: Array<{
    name: string;
    allocation_gbp: number;
    weight_pct: number;
    why_passed: string;
    source_id: string;
  }>;
  excluded_candidates: Array<{
    name: string;
    rule_code: string;
    breached_holdings: string;
    source_id: string;
  }>;
  unresolved_candidates: Array<{
    name: string;
    investigation_reason: string;
    source_id: string;
  }>;
  financial_tradeoffs: string;
  ethical_tradeoffs: string;
  risks: string[];
  uncertainties: string[];
  required_human_reviews: string[];
  citations: Array<{
    source_id: string;
    claim: string;
    document_title: string;
    url?: string;
  }>;
  limitations: string;
}

export interface SourceDocument {
  id: string;
  title: string;
  publisher: string;
  url: string;
  source_type: string;
  publication_date: string;
  retrieval_date: string;
  is_verified: number;
  verification_notes: string;
  file_hash: string;
  raw_excerpt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action_type: string;
  affected_record: string;
  details_json: string;
  policy_version_id?: string;
  screening_run_id?: string;
  scenario_id?: string;
  outcome: string;
}

export interface UnitTestResult {
  test_id: string;
  title: string;
  description: string;
  passed: boolean;
  duration_ms: number;
  error?: string;
}

export interface TestSuiteReport {
  timestamp: string;
  total_tests: number;
  passed_count: number;
  failed_count: number;
  total_duration_sec: number;
  tests: UnitTestResult[];
}
