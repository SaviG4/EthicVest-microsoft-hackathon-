import unittest
import os
import json
import tempfile
import shutil
from decimal import Decimal

from database import init_db, get_connection
from seed_data import seed
from screening_engine import run_ethical_screening
from portfolio_calculator import calculate_portfolio

class TestEthicalVestAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create a fresh test database
        cls.test_dir = tempfile.mkdtemp()
        cls.test_db_path = os.path.join(cls.test_dir, "test_ethicalvest.db")
        os.environ["ETHICALVEST_DB_PATH"] = cls.test_db_path
        seed(cls.test_db_path)
        run_ethical_screening(db_path=cls.test_db_path)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.test_dir)

    def test_01_confirmed_mandatory_exclusion_produces_excluded(self):
        """A candidate with verified prohibited holding (e.g. oil or thermal coal) is strictly Excluded."""
        res = run_ethical_screening(db_path=self.test_db_path)
        findings = {f["candidate_id"]: f for f in res["findings"]}

        # Vanguard All-World holds Shell, Exxon, Lockheed Martin
        van = findings.get("cand_vanguard")
        self.assertIsNotNone(van)
        self.assertEqual(van["primary_status"], "Excluded")
        self.assertGreaterEqual(van["confirmed_breaches_count"], 1)

        # RWE AG operates opencast lignite coal mines and power stations
        rwe = findings.get("cand_rwe")
        self.assertIsNotNone(rwe)
        self.assertEqual(rwe["primary_status"], "Excluded")

    def test_02_missing_holdings_produces_needs_investigation(self):
        """A candidate with missing or 0 holdings disclosures requires ethical investigation."""
        res = run_ethical_screening(db_path=self.test_db_path)
        findings = {f["candidate_id"]: f for f in res["findings"]}

        northsea = findings.get("cand_northsea")
        self.assertIsNotNone(northsea)
        self.assertEqual(northsea["primary_status"], "Needs ethical investigation")
        self.assertEqual(northsea["evidence_completeness"], "missing")
        self.assertEqual(northsea["holdings_coverage_pct"], 0.0)

    def test_03_eligible_candidate_can_proceed(self):
        """Ørsted, National Grid, Terna satisfy active rules and receive Passes required checks."""
        res = run_ethical_screening(db_path=self.test_db_path)
        findings = {f["candidate_id"]: f for f in res["findings"]}

        orsted = findings.get("cand_orsted")
        self.assertIsNotNone(orsted)
        self.assertEqual(orsted["primary_status"], "Passes required checks")
        self.assertEqual(orsted["confirmed_breaches_count"], 0)
        self.assertEqual(orsted["evidence_completeness"], "complete")

    def test_04_positive_preference_cannot_override_exclusion(self):
        """Positive environmental score must never pardon a confirmed weapons or fossil fuel exclusion."""
        conn = get_connection(self.test_db_path)
        cursor = conn.cursor()
        # Add a synthetic candidate that has high positive theme but also 1% weapons
        cursor.execute("""
        INSERT INTO investment_candidates (
            id, name, legal_name, identifier, identifier_type, fund_manager,
            domicile, asset_class, currency, fund_type, official_url, factsheet_url,
            source_pub_date, data_retrieval_date, data_status, holdings_disclosure_level, created_at
        ) VALUES (
            'cand_conflict_test', 'Conflict Test ESG Fund', 'Conflict Test ESG Fund', 'ISINCONFLICT01',
            'ISIN', 'Test Manager', 'UK', 'European Infrastructure', 'GBP', 'OEIC', '', '',
            '2026-09-30', '2026-10-21', 'synthetic_demo', 'full', '2026-10-21T00:00:00Z'
        )
        """)
        # Positive holding
        cursor.execute("""
        INSERT INTO holdings (
            id, candidate_id, company_name, issuer_identifier, sector, sub_sector,
            weight_pct, holding_date, is_prohibited_direct, controversial_activities, verification_status
        ) VALUES (
            'h_conf_pos', 'cand_conflict_test', 'Vestas Wind Systems', 'VWS', 'Wind Turbines', 'Renewable',
            8.0, '2026-09-30', 0, 'renewable_energy', 'verified'
        )
        """)
        # Prohibited weapons holding
        cursor.execute("""
        INSERT INTO holdings (
            id, candidate_id, company_name, issuer_identifier, sector, sub_sector,
            weight_pct, holding_date, is_prohibited_direct, controversial_activities, verification_status
        ) VALUES (
            'h_conf_neg', 'cand_conflict_test', 'Raytheon Defense', 'RTX', 'Missile Systems', 'Defense',
            1.2, '2026-09-30', 1, 'armaments', 'verified'
        )
        """)
        conn.commit()
        conn.close()

        res = run_ethical_screening(db_path=self.test_db_path)
        findings = {f["candidate_id"]: f for f in res["findings"]}
        conflict_fund = findings.get("cand_conflict_test")

        self.assertIsNotNone(conflict_fund)
        # MUST BE EXCLUDED! Positive energy holding cannot override weapon exclusion
        self.assertEqual(conflict_fund["primary_status"], "Excluded")
        self.assertIn("POL-ARM-01", conflict_fund["summary_rationale"])

    def test_05_stale_evidence_triggers_warning_and_investigation(self):
        """Disclosures older than 180 days receive warning and are marked Needs ethical investigation."""
        res = run_ethical_screening(db_path=self.test_db_path)
        findings = {f["candidate_id"]: f for f in res["findings"]}

        # Baltic Infrastructure Growth Fund has publication date in 2025 (>180 days)
        baltic = findings.get("cand_baltic")
        self.assertIsNotNone(baltic)
        self.assertEqual(baltic["primary_status"], "Needs ethical investigation")
        self.assertEqual(baltic["data_freshness_status"], "stale")

    def test_06_partial_holdings_never_presented_as_full(self):
        """Partial holdings (Baltic Fund 26% top 5) is explicitly marked partial, never complete."""
        res = run_ethical_screening(db_path=self.test_db_path)
        findings = {f["candidate_id"]: f for f in res["findings"]}

        baltic = findings.get("cand_baltic")
        self.assertEqual(baltic["evidence_completeness"], "partial")
        self.assertLess(baltic["holdings_coverage_pct"], 50.0)

    def test_07_portfolio_decimal_safe_and_budget_exactness(self):
        """Allocations are non-negative and sum exactly to budget (allocated + cash == £100,000.00)."""
        port = calculate_portfolio(
            total_budget_gbp=100000.0,
            min_cash_reserve_pct=5.0,
            min_allocation_pct=10.0,
            max_allocation_pct=35.0,
            allocation_strategy="cautious",
            db_path=self.test_db_path
        )
        self.assertTrue(port["is_feasible"])
        self.assertEqual(port["total_budget"], 100000.0)

        total_allocated = Decimal(str(port["allocated_amount"]))
        cash = Decimal(str(port["unallocated_cash"]))
        total_budget = Decimal(str(port["total_budget"]))

        # Exact penny reconciliation
        self.assertEqual(total_allocated + cash, total_budget)

        # Every position non-negative and bounded
        for pos in port["positions"]:
            self.assertGreater(pos["allocated_amount"], 0)
            self.assertGreaterEqual(pos["weight_pct"], 10.0)
            self.assertLessEqual(pos["weight_pct"], 35.0)

    def test_08_excluded_candidates_never_enter_portfolio(self):
        """Excluded candidates (Total, RWE, Vanguard) must never appear in generated positions."""
        port = calculate_portfolio(db_path=self.test_db_path)
        pos_candidate_ids = [p["candidate_id"] for p in port["positions"]]

        self.assertNotIn("cand_vanguard", pos_candidate_ids)
        self.assertNotIn("cand_total", pos_candidate_ids)
        self.assertNotIn("cand_rwe", pos_candidate_ids)
        self.assertNotIn("cand_conflict_test", pos_candidate_ids)

    def test_09_infeasible_constraints_produce_clear_error(self):
        """Setting impossible constraints (e.g. min 50% allocation with 4 funds) returns infeasible."""
        port = calculate_portfolio(
            total_budget_gbp=100000.0,
            min_cash_reserve_pct=60.0, # 60% cash leaves 40%
            min_allocation_pct=50.0,   # but min position is 50%!
            db_path=self.test_db_path
        )
        self.assertFalse(port["is_feasible"])
        self.assertIsNotNone(port["infeasibility_reason"])
        self.assertIn("Infeasible", port["infeasibility_reason"])

    def test_10_missing_financial_metrics_unfabricated(self):
        """Funds with missing metrics show 'unavailable' or None, never fabricated figures."""
        conn = get_connection(self.test_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT ocf_fee_pct, perf_1yr_pct, data_completeness FROM financial_metrics WHERE candidate_id = 'cand_northsea'")
        row = cursor.fetchone()
        conn.close()

        self.assertEqual(row["data_completeness"], "unavailable")
        self.assertIsNone(row["perf_1yr_pct"])

if __name__ == "__main__":
    unittest.main()
