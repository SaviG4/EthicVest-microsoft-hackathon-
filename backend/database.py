import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.environ.get("ETHICALVEST_DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "ethicalvest.db"))

def get_connection(db_path=None):
    path = db_path or os.environ.get("ETHICALVEST_DB_PATH") or DB_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path=None):
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.executescript("""
    -- Client Profiles
    CREATE TABLE IF NOT EXISTS client_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        org_type TEXT NOT NULL,
        mission TEXT NOT NULL,
        investment_objective TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'GBP',
        starting_budget REAL NOT NULL DEFAULT 100000.0,
        description TEXT,
        policy_source_url TEXT,
        policy_version TEXT,
        is_hypothetical INTEGER NOT NULL DEFAULT 1,
        timeframe_years INTEGER NOT NULL DEFAULT 7,
        risk_tolerance TEXT NOT NULL DEFAULT 'moderate',
        liquidity_needs TEXT NOT NULL DEFAULT 'medium',
        min_cash_reserve_pct REAL NOT NULL DEFAULT 5.0,
        max_concentration_pct REAL NOT NULL DEFAULT 35.0,
        max_annual_fee_pct REAL NOT NULL DEFAULT 0.85,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    -- Policy Versions
    CREATE TABLE IF NOT EXISTS policy_versions (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        effective_date TEXT NOT NULL,
        source_reference TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES client_profiles(id)
    );

    -- Policy Rules
    CREATE TABLE IF NOT EXISTS policy_rules (
        id TEXT PRIMARY KEY,
        policy_version_id TEXT NOT NULL,
        rule_code TEXT NOT NULL,
        name TEXT NOT NULL,
        sector_or_activity TEXT NOT NULL,
        rule_type TEXT NOT NULL, -- 'mandatory_exclusion', 'conditional_restriction', 'positive_preference', 'disclosure_requirement', 'monitoring_requirement'
        severity TEXT NOT NULL DEFAULT 'high', -- 'high', 'medium', 'low'
        description TEXT NOT NULL,
        threshold_pct REAL DEFAULT 0.0,
        include_indirect INTEGER NOT NULL DEFAULT 1,
        evidence_required TEXT,
        source_document TEXT,
        status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
        action_on_unknown TEXT NOT NULL DEFAULT 'investigate', -- 'investigate', 'exclude', 'pass'
        review_notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (policy_version_id) REFERENCES policy_versions(id)
    );

    -- Source Documents & Evidence
    CREATE TABLE IF NOT EXISTS source_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        publisher TEXT NOT NULL,
        url TEXT,
        source_type TEXT NOT NULL, -- 'factsheet', 'prospectus', 'policy', 'sustainability_report', 'sec_filing', 'synthetic_test'
        publication_date TEXT NOT NULL,
        retrieval_date TEXT NOT NULL,
        is_verified INTEGER NOT NULL DEFAULT 1,
        verification_notes TEXT,
        file_hash TEXT,
        raw_excerpt TEXT
    );

    -- Source Claims
    CREATE TABLE IF NOT EXISTS source_claims (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_entity_id TEXT NOT NULL, -- fund_id or rule_id
        claim_type TEXT NOT NULL,
        claim_text TEXT NOT NULL,
        page_or_section TEXT,
        confidence TEXT NOT NULL DEFAULT 'high',
        FOREIGN KEY (source_id) REFERENCES source_documents(id)
    );

    -- Investment Candidates (European Infrastructure Focus)
    CREATE TABLE IF NOT EXISTS investment_candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        legal_name TEXT,
        identifier TEXT NOT NULL, -- ISIN / Ticker
        identifier_type TEXT NOT NULL DEFAULT 'ISIN',
        fund_manager TEXT NOT NULL,
        domicile TEXT NOT NULL,
        asset_class TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'GBP',
        fund_type TEXT NOT NULL, -- 'Listed Infrastructure Company', 'Infrastructure Fund', 'ETF'
        official_url TEXT,
        factsheet_url TEXT,
        source_pub_date TEXT,
        data_retrieval_date TEXT,
        data_status TEXT NOT NULL DEFAULT 'verified_factsheet', -- 'verified_factsheet', 'imported', 'synthetic_demo'
        holdings_disclosure_level TEXT NOT NULL DEFAULT 'full', -- 'full', 'partial', 'none'
        european_exposure_basis TEXT DEFAULT 'Operating primarily in Europe',
        infrastructure_category TEXT DEFAULT 'Renewable Energy',
        candidate_type TEXT DEFAULT 'Listed Infrastructure Company',
        research_score REAL DEFAULT 85.0,
        financial_risk_status TEXT DEFAULT 'Low to Moderate Volatility',
        recommendation_category TEXT DEFAULT 'Eligible for further comparison',
        price_history_years REAL DEFAULT 5.0,
        has_sufficient_price_history INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    );

    -- Holdings
    CREATE TABLE IF NOT EXISTS holdings (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        issuer_identifier TEXT,
        sector TEXT NOT NULL,
        sub_sector TEXT,
        weight_pct REAL NOT NULL,
        holding_date TEXT NOT NULL,
        source_document_id TEXT,
        source_url TEXT,
        is_prohibited_direct INTEGER NOT NULL DEFAULT 0,
        controversial_activities TEXT, -- comma-separated e.g. "fossil_fuel,weapons"
        verification_status TEXT NOT NULL DEFAULT 'verified',
        FOREIGN KEY (candidate_id) REFERENCES investment_candidates(id),
        FOREIGN KEY (source_document_id) REFERENCES source_documents(id)
    );

    -- Financial Metrics
    CREATE TABLE IF NOT EXISTS financial_metrics (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        ocf_fee_pct REAL, -- Ongoing Charges Figure
        other_fees_pct REAL DEFAULT 0.0,
        yield_pct REAL,
        perf_1yr_pct REAL,
        perf_3yr_pct REAL,
        perf_5yr_pct REAL,
        volatility_3yr_pct REAL,
        max_drawdown_pct REAL,
        nav_gbp REAL,
        liquidity_score TEXT DEFAULT 'high',
        as_of_date TEXT NOT NULL,
        source_doc_id TEXT,
        data_completeness TEXT NOT NULL DEFAULT 'complete', -- 'complete', 'partial', 'unavailable'
        FOREIGN KEY (candidate_id) REFERENCES investment_candidates(id),
        FOREIGN KEY (source_doc_id) REFERENCES source_documents(id)
    );

    -- Screening Runs
    CREATE TABLE IF NOT EXISTS screening_runs (
        id TEXT PRIMARY KEY,
        policy_version_id TEXT NOT NULL,
        run_timestamp TEXT NOT NULL,
        total_candidates INTEGER NOT NULL,
        eligible_count INTEGER NOT NULL,
        excluded_count INTEGER NOT NULL,
        investigate_count INTEGER NOT NULL,
        triggered_by TEXT NOT NULL DEFAULT 'manual',
        screening_engine_version TEXT NOT NULL DEFAULT '1.0.0',
        FOREIGN KEY (policy_version_id) REFERENCES policy_versions(id)
    );

    -- Screening Findings
    CREATE TABLE IF NOT EXISTS screening_findings (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        candidate_id TEXT NOT NULL,
        primary_status TEXT NOT NULL, -- 'ELIGIBLE FOR FURTHER COMPARISON', 'EXCLUDED', 'NEEDS INVESTIGATION'
        evidence_completeness TEXT NOT NULL, -- 'complete', 'partial', 'missing'
        confirmed_breaches_count INTEGER NOT NULL DEFAULT 0,
        unresolved_checks_count INTEGER NOT NULL DEFAULT 0,
        holdings_coverage_pct REAL NOT NULL DEFAULT 100.0,
        data_freshness_status TEXT NOT NULL DEFAULT 'current', -- 'current', 'stale', 'expired'
        summary_rationale TEXT NOT NULL,
        details_json TEXT NOT NULL, -- detailed breakdown of each check
        FOREIGN KEY (run_id) REFERENCES screening_runs(id),
        FOREIGN KEY (candidate_id) REFERENCES investment_candidates(id)
    );

    -- Portfolio Scenarios
    CREATE TABLE IF NOT EXISTS portfolio_scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        screening_run_id TEXT NOT NULL,
        policy_version_id TEXT NOT NULL,
        total_budget REAL NOT NULL DEFAULT 100000.0,
        allocated_amount REAL NOT NULL,
        unallocated_cash REAL NOT NULL,
        weighted_fee_pct REAL NOT NULL,
        weighted_yield_pct REAL NOT NULL,
        weighted_volatility_pct REAL,
        allocation_method TEXT NOT NULL DEFAULT 'constrained_risk_balanced',
        is_feasible INTEGER NOT NULL DEFAULT 1,
        infeasibility_reason TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (screening_run_id) REFERENCES screening_runs(id),
        FOREIGN KEY (policy_version_id) REFERENCES policy_versions(id)
    );

    -- Portfolio Positions
    CREATE TABLE IF NOT EXISTS portfolio_positions (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        candidate_id TEXT NOT NULL,
        allocated_amount REAL NOT NULL,
        weight_pct REAL NOT NULL,
        annual_fee_gbp REAL NOT NULL,
        data_completeness TEXT NOT NULL,
        rationale TEXT,
        FOREIGN KEY (scenario_id) REFERENCES portfolio_scenarios(id),
        FOREIGN KEY (candidate_id) REFERENCES investment_candidates(id)
    );

    -- AI Explanations
    CREATE TABLE IF NOT EXISTS ai_explanations (
        id TEXT PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        screening_run_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        prompt_version TEXT NOT NULL,
        structured_json TEXT NOT NULL,
        summary_text TEXT NOT NULL,
        citations_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (scenario_id) REFERENCES portfolio_scenarios(id),
        FOREIGN KEY (screening_run_id) REFERENCES screening_runs(id)
    );

    -- Audit Events
    CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        action_type TEXT NOT NULL, -- 'policy_updated', 'screening_executed', 'portfolio_constructed', 'ai_explanation_generated', 'demo_reset', 'candidate_imported'
        affected_record TEXT NOT NULL,
        details_json TEXT NOT NULL,
        policy_version_id TEXT,
        screening_run_id TEXT,
        scenario_id TEXT,
        outcome TEXT NOT NULL DEFAULT 'success'
    );

    -- Data Refresh Runs
    CREATE TABLE IF NOT EXISTS data_refresh_runs (
        id TEXT PRIMARY KEY,
        source_name TEXT NOT NULL,
        status TEXT NOT NULL, -- 'success', 'warning', 'failed'
        records_checked INTEGER NOT NULL DEFAULT 0,
        records_updated INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_holdings_cand ON holdings(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_find_run ON screening_findings(run_id);
    CREATE INDEX IF NOT EXISTS idx_pos_scen ON portfolio_positions(scenario_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_events(timestamp);
    """)

    conn.commit()

    # Migration check for new European infrastructure columns
    cursor.execute("PRAGMA table_info(investment_candidates);")
    existing_cols = [col[1] for col in cursor.fetchall()]
    new_cols = [
        ("european_exposure_basis", "TEXT DEFAULT 'Operating primarily in Europe'"),
        ("infrastructure_category", "TEXT DEFAULT 'Renewable Energy'"),
        ("candidate_type", "TEXT DEFAULT 'Listed Infrastructure Company'"),
        ("research_score", "REAL DEFAULT 85.0"),
        ("financial_risk_status", "TEXT DEFAULT 'Low to Moderate Volatility'"),
        ("recommendation_category", "TEXT DEFAULT 'Eligible for further comparison'"),
        ("price_history_years", "REAL DEFAULT 5.0"),
        ("has_sufficient_price_history", "INTEGER DEFAULT 1")
    ]
    for col_name, col_def in new_cols:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE investment_candidates ADD COLUMN {col_name} {col_def};")
            except Exception as e:
                pass

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database schema successfully created at:", DB_PATH)
