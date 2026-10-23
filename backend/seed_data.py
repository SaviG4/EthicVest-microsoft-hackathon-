import os
import json
import uuid
from datetime import datetime, timezone
from database import get_connection, init_db

def seed(db_path=None):
    init_db(db_path)
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # Clear existing demo data cleanly
    cursor.execute("PRAGMA foreign_keys = OFF;")
    cursor.execute("DELETE FROM portfolio_positions;")
    cursor.execute("DELETE FROM audit_events;")
    cursor.execute("DELETE FROM portfolio_scenarios;")
    cursor.execute("DELETE FROM screening_findings;")
    cursor.execute("DELETE FROM screening_runs;")
    cursor.execute("DELETE FROM holdings;")
    cursor.execute("DELETE FROM financial_metrics;")
    cursor.execute("DELETE FROM source_claims;")
    cursor.execute("DELETE FROM source_documents;")
    cursor.execute("DELETE FROM investment_candidates;")
    cursor.execute("DELETE FROM policy_rules;")
    cursor.execute("DELETE FROM policy_versions;")
    cursor.execute("DELETE FROM client_profiles;")
    cursor.execute("DELETE FROM ai_explanations;")
    cursor.execute("DELETE FROM data_refresh_runs;")
    cursor.execute("PRAGMA foreign_keys = ON;")

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Client Profile
    profile_id = "prof_demo_01"
    cursor.execute("""
    INSERT INTO client_profiles (
        id, name, org_type, mission, investment_objective, currency,
        starting_budget, description, policy_source_url, policy_version,
        is_hypothetical, timeframe_years, risk_tolerance, liquidity_needs,
        min_cash_reserve_pct, max_concentration_pct, max_annual_fee_pct,
        created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        profile_id,
        "EthicVest European Infrastructure Endowment",
        "Charitable Endowment Foundation",
        "To support the European transition to renewable energy, grid modernisation, and sustainable infrastructure while upholding strict ethical exclusions.",
        "Long-term capital growth and stable income from European infrastructure, with zero tolerance for fossil fuel exploration, thermal coal, armaments, tobacco, and gambling.",
        "GBP",
        100000.0,
        "Hypothetical European infrastructure endowment profile. Focuses on clean wind, solar, electricity transmission, and storage assets with strict ethical screening.",
        "https://www.jrct.org.uk/finance-and-investment",
        "2026.1",
        1,
        7,
        "moderate",
        "medium",
        5.0,
        30.0,
        0.85,
        now_iso,
        now_iso
    ))

    # 2. Policy Version
    policy_ver_id = "pol_ver_01"
    cursor.execute("""
    INSERT INTO policy_versions (
        id, profile_id, version_number, title, effective_date, source_reference, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        policy_ver_id,
        profile_id,
        1,
        "EthicVest European Infrastructure Policy (v2026.1)",
        "2026-01-01",
        "JRCT Responsible Investment Framework & European Sustainable Finance Disclosure Regulation (SFDR Article 9)",
        "Active policy governing European infrastructure investments: mandatory exclusions on fossil fuel exploration, thermal coal, weapons, and tobacco, alongside positive preferences for clean energy and grid storage.",
        now_iso
    ))

    # 3. Policy Rules
    rules = [
        (
            "rule_ff_01", policy_ver_id, "POL-FF-01",
            "Fossil Fuel Exploration & Refining", "fossil_fuels",
            "mandatory_exclusion", "high",
            "Zero tolerance for companies involved in oil, gas, or thermal coal exploration, extraction, or refining.",
            0.0, 1, "Audited annual accounts and segmental business activity disclosures.",
            "EthicVest Infrastructure Policy - Section 3.1", "active", "investigate",
            "Any verified revenue from upstream oil and gas triggers mandatory exclusion.", now_iso
        ),
        (
            "rule_coal_01", policy_ver_id, "POL-COAL-01",
            "Thermal Coal Mining & Coal Power Generation", "thermal_coal",
            "mandatory_exclusion", "high",
            "Strict exclusion of thermal coal mining and coal-fired electric power generation.",
            0.0, 1, "Audited company segmental revenue and power generation mix.",
            "EthicVest Infrastructure Policy - Section 3.2", "active", "investigate",
            "Zero threshold applies to direct coal mining and coal power assets.", now_iso
        ),
        (
            "rule_arm_01", policy_ver_id, "POL-ARM-01",
            "Armaments, Weapons & Military Equipment", "armaments",
            "mandatory_exclusion", "high",
            "Prohibition of companies manufacturing weapons systems, controversial munitions, or military platforms.",
            0.0, 1, "Company product line disclosures and international defense registry checks.",
            "EthicVest Infrastructure Policy - Section 2.1", "active", "investigate",
            "Zero tolerance for munitions, missile systems, or combat equipment.", now_iso
        ),
        (
            "rule_tob_01", policy_ver_id, "POL-TOB-01",
            "Tobacco Manufacturing & Distribution", "tobacco",
            "mandatory_exclusion", "high",
            "Exclusion of companies producing or distributing combustible tobacco products.",
            0.0, 1, "Company annual reports and regulatory filings.",
            "EthicVest Infrastructure Policy - Section 4.1", "active", "investigate",
            "Zero tolerance for commercial tobacco manufacturing.", now_iso
        ),
        (
            "rule_pref_ren", policy_ver_id, "POL-PREF-REN",
            "European Renewable Energy & Wind Infrastructure", "renewable_energy",
            "positive_preference", "medium",
            "Positive preference for offshore wind, onshore wind, solar photovoltaic, and renewable infrastructure.",
            0.0, 0, "Company sustainability reports and verified renewable generation capacity (GW).",
            "EthicVest Positive Impact Priorities - Clean Energy Transition", "active", "pass",
            "Positive priority. Does not override any mandatory exclusion.", now_iso
        ),
        (
            "rule_pref_grid", policy_ver_id, "POL-PREF-GRID",
            "Electricity Grid Modernisation & Energy Storage", "grid_storage",
            "positive_preference", "medium",
            "Positive preference for high-voltage electricity transmission networks, sub-sea interconnectors, and utility-scale battery storage.",
            0.0, 0, "Network transmission asset disclosures and grid development plans.",
            "EthicVest Positive Impact Priorities - Grid Resilience", "active", "pass",
            "Positive priority. Promotes European grid interconnection.", now_iso
        ),
        (
            "rule_disc_01", policy_ver_id, "POL-DISC-01",
            "Holdings Transparency & 180-Day Freshness Limit", "disclosure",
            "disclosure_requirement", "medium",
            "Full constituent disclosures required, with publication date within the last 180 days.",
            90.0, 0, "Official audited annual report or quarterly fund schedule.",
            "EthicVest Data Quality Standards", "active", "investigate",
            "Funds with undisclosed opaque constituents or stale filings (>180 days) cannot be verified and are marked Needs ethical investigation.", now_iso
        )
    ]

    cursor.executemany("""
    INSERT INTO policy_rules (
        id, policy_version_id, rule_code, name, sector_or_activity, rule_type,
        severity, description, threshold_pct, include_indirect, evidence_required,
        source_document, status, action_on_unknown, review_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rules)

    # 4. Source Documents
    source_docs = [
        (
            "doc_orsted_fs",
            "Ørsted Annual Report & Sustainability Disclosure 2026",
            "Ørsted A/S (Denmark)",
            "https://orsted.com/en/investors/reports-and-presentations",
            "sustainability_report",
            "2026-09-30", "2026-10-21", 1,
            "Audited clean energy pure-play. 99% renewable power generation across European offshore wind farms.",
            "hash_orsted_2026",
            "Ørsted operates 14.8 GW of offshore and onshore wind, solar, and battery storage across Europe with zero upstream petroleum operations."
        ),
        (
            "doc_ngrid_fs",
            "National Grid plc Annual Report & Interconnectors Schedule 2026",
            "National Grid plc (UK)",
            "https://www.nationalgrid.com/investors",
            "factsheet",
            "2026-09-30", "2026-10-21", 1,
            "Audited UK and European high-voltage transmission networks and subsea clean interconnectors.",
            "hash_ngrid_2026",
            "Operates critical electricity transmission infrastructure connecting renewable offshore power into the UK and European grid via Viking Link and North Sea Link."
        ),
        (
            "doc_terna_fs",
            "Terna S.p.A. Sustainability Report & Grid Development Plan 2026",
            "Terna S.p.A. (Italy)",
            "https://www.terna.it/en/investors",
            "sustainability_report",
            "2026-09-30", "2026-10-22", 1,
            "Regulated transmission grid operator. Independent national transmission system with zero thermal coal or oil extraction.",
            "hash_terna_2026",
            "Manages over 75,000 km of high-voltage transmission lines in Italy and European cross-border interconnectors driving Mediterranean clean power integration."
        ),
        (
            "doc_iberdrola_fs",
            "Iberdrola S.A. Integrated Factsheet & Renewable Strategy Q3 2026",
            "Iberdrola S.A. (Spain)",
            "https://www.iberdrola.com/shareholders-investors",
            "factsheet",
            "2026-09-30", "2026-10-21", 1,
            "Audited European renewable utility. Over 42 GW of clean renewable generation and smart grid networks across Europe.",
            "hash_iberdrola_2026",
            "Pure-play electrification leader with major offshore wind in Baltic Eagle and Saint-Brieuc. Zero upstream fossil fuel extraction."
        ),
        (
            "doc_edpr_fs",
            "EDP Renováveis SA Results & Wind Infrastructure Portfolio 2026",
            "EDP Renováveis SA (Spain/Portugal)",
            "https://www.edpr.com/en/investors",
            "factsheet",
            "2026-09-30", "2026-10-20", 1,
            "Audited European wind and solar developer with zero fossil fuel exploration or weapons exposure.",
            "hash_edpr_2026",
            "European renewable power producer with over 16 GW installed wind and solar capacity across Spain, Portugal, France, Italy, and Poland."
        ),
        (
            "doc_alfen_fs",
            "Alfen N.V. Smart Energy Infrastructure Factsheet Q3 2026",
            "Alfen N.V. (Netherlands)",
            "https://alfen.com/investor-relations",
            "factsheet",
            "2026-09-30", "2026-10-21", 1,
            "Specialist European grid transformer sub-stations, stationary battery energy storage systems, and EV charging infrastructure.",
            "hash_alfen_2026",
            "Alfen's TheBattery large-scale energy storage systems stabilize renewable grids across Northern and Western Europe."
        ),
        (
            "doc_impax_fs",
            "Impax Environmental Markets plc Factsheet & Infrastructure Schedule",
            "Impax Asset Management (UK)",
            "https://impaxenvironmentalmarkets.co.uk/",
            "factsheet",
            "2026-09-30", "2026-10-22", 1,
            "Dedicated environmental and clean infrastructure fund investing in European water technology, waste recovery, and smart energy.",
            "hash_impax_2026",
            "100% pure-play environmental infrastructure fund audited and verified free of fossil fuels, armaments, and tobacco."
        ),
        (
            "doc_total_fs",
            "TotalEnergies SE Universal Registration Document & Oil Reserves 2026",
            "TotalEnergies SE (France)",
            "https://totalenergies.com/investors",
            "sec_filing",
            "2026-09-30", "2026-10-21", 1,
            "Major European integrated oil & gas exploration, drilling, and refining corporation.",
            "hash_total_2026",
            "Major upstream oil and gas exploration in the North Sea, Gulf of Guinea, and LNG liquefaction facilities. Confirmed breach of POL-FF-01."
        ),
        (
            "doc_rwe_fs",
            "RWE AG Annual Report & Generation Assets Disclosure 2026",
            "RWE AG (Germany)",
            "https://www.rwe.com/en/investor-relations",
            "factsheet",
            "2026-09-30", "2026-10-21", 1,
            "German utility operating large-scale opencast lignite coal mines (Garzweiler) and coal power stations.",
            "hash_rwe_2026",
            "Operates significant thermal coal and lignite power stations. Confirmed breach of POL-COAL-01."
        ),
        (
            "doc_vanguard_fs",
            "Vanguard FTSE All-World UCITS ETF Factsheet & Portfolio Schedule",
            "Vanguard Group (Ireland)",
            "https://www.vanguardinvestor.co.uk/",
            "factsheet",
            "2026-09-30", "2026-10-21", 1,
            "Broad market cap equity index containing oil conglomerates and weapons manufacturers.",
            "hash_vanguard_2026",
            "Holds Shell (0.38%), ExxonMobil (0.44%), and Lockheed Martin (0.14%). Confirmed breaches of POL-FF-01 and POL-ARM-01."
        ),
        (
            "doc_baltic_fs",
            "Baltic Infrastructure Growth Fund Factsheet (Stale / Opaque)",
            "Baltic Capital Partners (Luxembourg)",
            "https://balticinfra.internal/factsheet.pdf",
            "factsheet",
            "2025-11-30", "2026-10-22", 1,
            "Opaque fund disclosure. Top 5 assets account for 32% only; 68% opaque and filing is >200 days old.",
            "hash_baltic_stale",
            "Discloses partial constituent list only. Undisclosed remaining 68% constituents require ethical investigation."
        ),
        (
            "doc_northsea_fs",
            "North Sea Transition Fund Beta (Zero Holdings Disclosed)",
            "North Sea Asset Management (UK)",
            "https://northsea.internal/beta.pdf",
            "synthetic_test",
            "2026-10-01", "2026-10-22", 1,
            "Synthetic test asset with zero constituent holdings disclosed.",
            "hash_northsea_beta",
            "Opaque fund with zero constituent transparency to verify investigation handling."
        )
    ]

    cursor.executemany("""
    INSERT INTO source_documents (
        id, title, publisher, url, source_type, publication_date,
        retrieval_date, is_verified, verification_notes, file_hash, raw_excerpt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, source_docs)

    # 5. European Infrastructure Candidates
    candidates = [
        (
            "cand_orsted",
            "Ørsted A/S",
            "Ørsted A/S Ordinary Shares",
            "DK0060094928", "ISIN",
            "Ørsted Management", "Denmark", "European Renewable Infrastructure", "GBP",
            "Listed Infrastructure Company",
            "https://orsted.com",
            "https://orsted.com/en/investors/reports-and-presentations",
            "2026-09-30", "2026-10-21", "verified_factsheet", "full",
            "European-listed company operating primarily in Europe (Denmark, UK, Germany)",
            "Renewable Energy (Offshore Wind)",
            "Listed Infrastructure Company",
            94.5, "Moderate Volatility (Pure-Play Growth)", "Highest-ranked among eligible candidates",
            5.0, 1, now_iso
        ),
        (
            "cand_ngrid",
            "National Grid plc",
            "National Grid plc Ordinary Shares",
            "GB00BDR05C01", "ISIN",
            "National Grid Management", "United Kingdom", "Electricity Transmission & Networks", "GBP",
            "Listed Infrastructure Company",
            "https://nationalgrid.com",
            "https://www.nationalgrid.com/investors",
            "2026-09-30", "2026-10-21", "verified_factsheet", "full",
            "European-listed company operating in UK and North Sea Interconnectors",
            "Electricity Transmission & Grid",
            "Listed Infrastructure Company",
            91.8, "Low Volatility Defensive", "Eligible for further comparison",
            5.0, 1, now_iso
        ),
        (
            "cand_terna",
            "Terna S.p.A.",
            "Terna - Rete Elettrica Nazionale S.p.A.",
            "IT0003242622", "ISIN",
            "Terna Corporate", "Italy", "Electricity Transmission & Grids", "GBP",
            "Listed Infrastructure Company",
            "https://terna.it",
            "https://www.terna.it/en/investors",
            "2026-09-30", "2026-10-22", "verified_factsheet", "full",
            "European-listed utility operating Italian national transmission grid",
            "Electricity Transmission & Grids",
            "Listed Infrastructure Company",
            93.2, "Very Low Volatility (Regulated Asset)", "Highest-ranked among eligible candidates",
            5.0, 1, now_iso
        ),
        (
            "cand_iberdrola",
            "Iberdrola S.A.",
            "Iberdrola S.A. Ordinary Shares",
            "ES0144580Y14", "ISIN",
            "Iberdrola Management", "Spain", "Clean Power Networks & Renewables", "GBP",
            "Listed Infrastructure Company",
            "https://iberdrola.com",
            "https://www.iberdrola.com/shareholders-investors",
            "2026-09-30", "2026-10-21", "verified_factsheet", "full",
            "European-listed utility operating primarily in Europe (Spain, UK, Germany)",
            "Renewable Energy & Smart Grids",
            "Listed Infrastructure Company",
            90.4, "Moderate Volatility", "Eligible for further comparison",
            5.0, 1, now_iso
        ),
        (
            "cand_edpr",
            "EDP Renováveis SA",
            "EDP Renováveis SA Ordinary Shares",
            "ES0127760012", "ISIN",
            "EDP Group", "Spain", "Renewable Energy Infrastructure", "GBP",
            "Listed Infrastructure Company",
            "https://edpr.com",
            "https://www.edpr.com/en/investors",
            "2026-09-30", "2026-10-20", "verified_factsheet", "full",
            "Operating primarily in Europe (Spain, Portugal, France, Italy, Poland)",
            "Renewable Energy (Wind & Solar)",
            "Listed Infrastructure Company",
            88.2, "Moderate Growth Volatility", "Eligible for further comparison",
            5.0, 1, now_iso
        ),
        (
            "cand_alfen",
            "Alfen N.V.",
            "Alfen N.V. Ordinary Shares",
            "NL0012817175", "ISIN",
            "Alfen Corporate", "Netherlands", "Energy Storage & Smart Grids", "GBP",
            "Listed Infrastructure Company",
            "https://alfen.com",
            "https://alfen.com/investor-relations",
            "2026-09-30", "2026-10-21", "verified_factsheet", "full",
            "European-listed company operating in Western & Northern Europe",
            "Energy Storage & Smart Grids",
            "Listed Infrastructure Company",
            87.0, "Higher Volatility Specialist", "Eligible for further comparison",
            5.0, 1, now_iso
        ),
        (
            "cand_impax",
            "Impax Environmental Markets plc",
            "Impax Environmental Markets plc Ordinary Shares",
            "GB0004512044", "ISIN",
            "Impax Asset Management", "United Kingdom", "Water & Circular Environmental", "GBP",
            "Infrastructure Fund",
            "https://impaxenvironmentalmarkets.co.uk/",
            "https://impaxenvironmentalmarkets.co.uk/investor-centre/factsheets-and-reports/",
            "2026-09-30", "2026-10-22", "verified_factsheet", "full",
            "European-domiciled investment trust investing in European environmental infrastructure",
            "Water & Circular Infrastructure",
            "Infrastructure Fund",
            89.5, "Moderate Volatility Diversified", "Eligible for further comparison",
            5.0, 1, now_iso
        ),
        (
            "cand_total",
            "TotalEnergies SE",
            "TotalEnergies SE Ordinary Shares",
            "FR0000120271", "ISIN",
            "TotalEnergies Management", "France", "Integrated Oil & Gas Exploration", "GBP",
            "Listed Infrastructure Company",
            "https://totalenergies.com",
            "https://totalenergies.com/investors",
            "2026-09-30", "2026-10-21", "verified_factsheet", "full",
            "European-listed company with global upstream petroleum extraction",
            "Oil & Gas Exploration",
            "Listed Infrastructure Company",
            0.0, "High Commodity Volatility", "Excluded under configured policy",
            5.0, 1, now_iso
        ),
        (
            "cand_rwe",
            "RWE AG",
            "RWE AG Ordinary Shares",
            "DE0007037129", "ISIN",
            "RWE Group", "Germany", "Traditional Power & Coal Generation", "GBP",
            "Listed Infrastructure Company",
            "https://rwe.com",
            "https://www.rwe.com/en/investor-relations",
            "2026-09-30", "2026-10-21", "verified_factsheet", "full",
            "European-listed utility operating German opencast lignite coal mines",
            "Thermal Coal & Traditional Power",
            "Listed Infrastructure Company",
            0.0, "Regulatory & Carbon Transition Risk", "Excluded under configured policy",
            5.0, 1, now_iso
        ),
        (
            "cand_vanguard",
            "Vanguard FTSE All-World UCITS ETF",
            "Vanguard FTSE All-World UCITS ETF (Dist)",
            "IE00B3RBWM25", "ISIN",
            "Vanguard Group (Ireland)", "Ireland", "Broad Market Benchmark", "GBP",
            "Infrastructure Fund",
            "https://vanguardinvestor.co.uk",
            "https://fund-docs.vanguard.com/ftse-all-world-ucits-etf-factsheet.pdf",
            "2026-09-30", "2026-10-21", "verified_factsheet", "full",
            "Global Fund listed on European exchanges",
            "Broad Market Global Equities",
            "Infrastructure Fund",
            0.0, "Market Index Beta", "Excluded under configured policy",
            5.0, 1, now_iso
        ),
        (
            "cand_baltic",
            "Baltic Infrastructure Growth Fund",
            "Baltic Infrastructure Growth Fund Class A EUR",
            "LU1982348123", "ISIN",
            "Baltic Capital Partners", "Luxembourg", "Nordic & Baltic Transport Infrastructure", "GBP",
            "Infrastructure Fund",
            "https://balticinfra.internal",
            "https://balticinfra.internal/factsheet.pdf",
            "2025-11-30", "2026-10-22", "verified_factsheet", "partial",
            "Fund investing in European infrastructure (Baltic region)",
            "Transport & Baltic Logistics",
            "Infrastructure Fund",
            62.0, "Moderate Private Equity Risk", "Requires ethical investigation",
            4.2, 1, now_iso
        ),
        (
            "cand_northsea",
            "North Sea Transition Fund Beta",
            "North Sea Transition Fund Beta",
            "SYNTH0002BET", "ISIN",
            "North Sea Asset Management", "United Kingdom", "Energy Transition Multi-Asset", "GBP",
            "Infrastructure Fund",
            "https://northsea.internal",
            "https://northsea.internal/beta.pdf",
            "2026-10-01", "2026-10-22", "synthetic_demo", "none",
            "Fund targeting European energy transition",
            "Energy Transition (Opaque)",
            "Infrastructure Fund",
            0.0, "Unassessed Risk", "Requires ethical investigation",
            1.5, 0, now_iso
        )
    ]

    cursor.executemany("""
    INSERT INTO investment_candidates (
        id, name, legal_name, identifier, identifier_type, fund_manager,
        domicile, asset_class, currency, fund_type, official_url, factsheet_url,
        source_pub_date, data_retrieval_date, data_status, holdings_disclosure_level,
        european_exposure_basis, infrastructure_category, candidate_type,
        research_score, financial_risk_status, recommendation_category,
        price_history_years, has_sufficient_price_history, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, candidates)

    # 6. Financial Metrics (Expected Returns, Volatilities, Yields, Drawdowns)
    metrics = [
        # Ørsted: return 11.5%, vol 17.5%, Sharpe 0.43 (Balanced growth)
        ("met_orsted", "cand_orsted", 0.0, 0.0, 2.2, 14.8, 11.5, 28.5, 17.5, -22.4, 385.0, "high", "2026-09-30", "doc_orsted_fs", "complete"),
        # National Grid: return 7.8%, vol 11.5%, Sharpe 0.33 (Cautious defensive)
        ("met_ngrid", "cand_ngrid", 0.0, 0.0, 4.8, 8.4, 7.8, 22.0, 11.5, -12.1, 980.0, "high", "2026-09-30", "doc_ngrid_fs", "complete"),
        # Terna: return 8.5%, vol 10.2%, Sharpe 0.44 (Cautious champion)
        ("met_terna", "cand_terna", 0.0, 0.0, 4.2, 10.2, 8.5, 25.4, 10.2, -10.5, 7.6, "high", "2026-09-30", "doc_terna_fs", "complete"),
        # Iberdrola: return 9.8%, vol 13.0%, Sharpe 0.45 (Balanced anchor)
        ("met_iberdrola", "cand_iberdrola", 0.0, 0.0, 3.9, 12.0, 9.8, 31.0, 13.0, -14.2, 11.8, "high", "2026-09-30", "doc_iberdrola_fs", "complete"),
        # EDPR: return 10.2%, vol 15.8%, Sharpe 0.39 (Wind expansion)
        ("met_edpr", "cand_edpr", 0.0, 0.0, 1.8, 11.0, 10.2, 24.0, 15.8, -19.5, 14.5, "high", "2026-09-30", "doc_edpr_fs", "complete"),
        # Alfen: return 12.0%, vol 21.0%, Sharpe 0.38 (Grid storage specialist)
        ("met_alfen", "cand_alfen", 0.0, 0.0, 0.0, 8.5, 12.0, 35.0, 21.0, -29.0, 38.0, "medium", "2026-09-30", "doc_alfen_fs", "complete"),
        # Impax: return 10.5%, vol 14.1%, Sharpe 0.46 (Environmental Fund)
        ("met_impax", "cand_impax", 0.84, 0.0, 2.1, 11.8, 10.5, 29.0, 14.1, -16.2, 492.5, "high", "2026-09-30", "doc_impax_fs", "complete"),
        # TotalEnergies (Excluded)
        ("met_total", "cand_total", 0.0, 0.0, 5.8, 16.0, 14.0, 45.0, 22.0, -25.0, 62.0, "high", "2026-09-30", "doc_total_fs", "complete"),
        # RWE (Excluded)
        ("met_rwe", "cand_rwe", 0.0, 0.0, 2.8, 9.0, 8.0, 20.0, 18.5, -24.0, 35.0, "high", "2026-09-30", "doc_rwe_fs", "complete"),
        # Vanguard (Excluded)
        ("met_vanguard", "cand_vanguard", 0.22, 0.0, 1.85, 18.9, 12.5, 42.0, 12.8, -14.5, 98.4, "high", "2026-09-30", "doc_vanguard_fs", "complete"),
        # Baltic (Investigation)
        ("met_baltic", "cand_baltic", 1.10, 0.0, 3.2, 7.5, 6.8, 18.0, 13.5, -15.0, 120.0, "medium", "2025-11-30", "doc_baltic_fs", "partial"),
        # North Sea Beta (Investigation - Insufficient history)
        ("met_northsea", "cand_northsea", 1.25, 0.0, 0.0, None, None, None, None, None, 100.0, "low", "2026-10-01", "doc_northsea_fs", "unavailable")
    ]

    cursor.executemany("""
    INSERT INTO financial_metrics (
        id, candidate_id, ocf_fee_pct, other_fees_pct, yield_pct,
        perf_1yr_pct, perf_3yr_pct, perf_5yr_pct, volatility_3yr_pct,
        max_drawdown_pct, nav_gbp, liquidity_score, as_of_date, source_doc_id, data_completeness
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, metrics)

    # 7. Holdings & Infrastructure Assets
    holdings_data = [
        # Ørsted (Clean wind leader)
        ("h_ors_1", "cand_orsted", "Hornsea 1 & 2 Offshore Wind Farms", "UK-OFFSHORE", "Renewable Energy (Offshore Wind)", "Wind generation", 35.0, "2026-09-30", "doc_orsted_fs", "https://orsted.com", 0, "renewable_energy", "verified"),
        ("h_ors_2", "cand_orsted", "Borssele 1 & 2 Offshore Wind Farm", "NL-OFFSHORE", "Renewable Energy (Offshore Wind)", "Wind generation", 28.0, "2026-09-30", "doc_orsted_fs", "https://orsted.com", 0, "renewable_energy", "verified"),
        ("h_ors_3", "cand_orsted", "European Onshore Wind & Solar Capacity", "EU-ONSHORE", "Renewable Energy (Onshore Solar/Wind)", "Solar & wind", 25.0, "2026-09-30", "doc_orsted_fs", "https://orsted.com", 0, "renewable_energy", "verified"),
        ("h_ors_4", "cand_orsted", "Utility-Scale Battery Storage Systems", "EU-STORAGE", "Energy Storage", "Battery storage", 11.0, "2026-09-30", "doc_orsted_fs", "https://orsted.com", 0, "grid_storage", "verified"),

        # National Grid (UK high voltage transmission networks)
        ("h_ngr_1", "cand_ngrid", "UK Electricity Transmission Network", "UK-GRID-01", "Electricity Transmission", "High-voltage grid", 45.0, "2026-09-30", "doc_ngrid_fs", "https://nationalgrid.com", 0, "grid_storage", "verified"),
        ("h_ngr_2", "cand_ngrid", "Viking Link Subsea Interconnector (UK-Denmark)", "VIKING-LINK", "Grid Interconnectors", "Subsea cable", 20.0, "2026-09-30", "doc_ngrid_fs", "https://nationalgrid.com", 0, "grid_storage", "verified"),
        ("h_ngr_3", "cand_ngrid", "North Sea Link Clean Power Interconnector", "NSL-LINK", "Grid Interconnectors", "Subsea cable", 20.0, "2026-09-30", "doc_ngrid_fs", "https://nationalgrid.com", 0, "grid_storage", "verified"),
        ("h_ngr_4", "cand_ngrid", "Offshore Wind Transmission Integration Assets", "OFTO-ASSETS", "Electricity Transmission", "Renewable grid connection", 15.0, "2026-09-30", "doc_ngrid_fs", "https://nationalgrid.com", 0, "renewable_energy,grid_storage", "verified"),

        # Terna (Italian national grid)
        ("h_ter_1", "cand_terna", "Italian High-Voltage National Transmission Grid", "TERNA-GRID", "Electricity Transmission", "National grid system", 55.0, "2026-09-30", "doc_terna_fs", "https://terna.it", 0, "grid_storage", "verified"),
        ("h_ter_2", "cand_terna", "Tyrrhenian Submarine Clean Power Link", "TYRR-LINK", "Grid Modernisation", "Submarine cable", 25.0, "2026-09-30", "doc_terna_fs", "https://terna.it", 0, "grid_storage", "verified"),
        ("h_ter_3", "cand_terna", "Synchronous Compensators & Grid Energy Storage", "TERNA-SYNC", "Energy Storage", "Grid stabilization", 20.0, "2026-09-30", "doc_terna_fs", "https://terna.it", 0, "grid_storage", "verified"),

        # Iberdrola (Clean networks & renewables)
        ("h_ibe_1", "cand_iberdrola", "European Smart Electricity Networks (i-DE / SPEN)", "IBE-NET", "Electricity Distribution", "Smart distribution grid", 40.0, "2026-09-30", "doc_iberdrola_fs", "https://iberdrola.com", 0, "grid_storage", "verified"),
        ("h_ibe_2", "cand_iberdrola", "Saint-Brieuc & Baltic Eagle Offshore Wind", "IBE-OFFSHORE", "Renewable Energy (Offshore Wind)", "Offshore wind farms", 32.0, "2026-09-30", "doc_iberdrola_fs", "https://iberdrola.com", 0, "renewable_energy", "verified"),
        ("h_ibe_3", "cand_iberdrola", "European Hydroelectric Pumped Storage Infrastructure", "IBE-HYDRO", "Energy Storage", "Pumped hydro storage", 28.0, "2026-09-30", "doc_iberdrola_fs", "https://iberdrola.com", 0, "renewable_energy,grid_storage", "verified"),

        # EDPR (Wind & solar pure play)
        ("h_edp_1", "cand_edpr", "Spanish & Portuguese Onshore Wind Parks", "EDPR-IBERIA", "Renewable Energy (Wind)", "Wind generation", 48.0, "2026-09-30", "doc_edpr_fs", "https://edpr.com", 0, "renewable_energy", "verified"),
        ("h_edp_2", "cand_edpr", "Central European Solar PV Infrastructure", "EDPR-CENTRAL", "Renewable Energy (Solar)", "Solar generation", 32.0, "2026-09-30", "doc_edpr_fs", "https://edpr.com", 0, "renewable_energy", "verified"),
        ("h_edp_3", "cand_edpr", "Utility Scale Battery Colocated Storage", "EDPR-STORAGE", "Energy Storage", "Battery systems", 20.0, "2026-09-30", "doc_edpr_fs", "https://edpr.com", 0, "grid_storage", "verified"),

        # Alfen (Smart grids & storage)
        ("h_alf_1", "cand_alfen", "TheBattery Megawatt Utility Energy Storage", "ALF-STORAGE", "Energy Storage", "Stationary battery systems", 40.0, "2026-09-30", "doc_alfen_fs", "https://alfen.com", 0, "grid_storage", "verified"),
        ("h_alf_2", "cand_alfen", "Smart Grid Electrical Substations", "ALF-SUBSTATION", "Electricity Grid Modernisation", "Secondary transformer substations", 35.0, "2026-09-30", "doc_alfen_fs", "https://alfen.com", 0, "grid_storage", "verified"),
        ("h_alf_3", "cand_alfen", "European Commercial EV Fast-Charging Hubs", "ALF-EVCHARGE", "Transport Decarbonisation", "EV grid infrastructure", 25.0, "2026-09-30", "doc_alfen_fs", "https://alfen.com", 0, "grid_storage", "verified"),

        # Impax Environmental Markets
        ("h_imp_1", "cand_impax", "Clean Harbors Inc", "CLH", "Waste & Circular Infrastructure", "Resource recovery", 3.4, "2026-09-30", "doc_impax_fs", "https://cleanharbors.com", 0, "environmental_solutions", "verified"),
        ("h_imp_2", "cand_impax", "Xylem Inc", "XYL", "Smart Water Technology", "Water network efficiency", 3.0, "2026-09-30", "doc_impax_fs", "https://xylem.com", 0, "environmental_solutions", "verified"),
        ("h_imp_3", "cand_impax", "Vestas Wind Systems A/S", "VWS.CO", "Wind Energy Turbines", "Wind turbine manufacturing", 2.8, "2026-09-30", "doc_impax_fs", "https://vestas.com", 0, "renewable_energy", "verified"),
        ("h_imp_4", "cand_impax", "American Water Works Co", "AWK", "Clean Water Infrastructure", "Water supply utility", 2.6, "2026-09-30", "doc_impax_fs", "https://amwater.com", 0, "environmental_solutions", "verified"),

        # TotalEnergies (EXCLUDED - Upstream Petroleum)
        ("h_tot_1", "cand_total", "North Sea Offshore Petroleum Drilling Platforms", "TOT-OFFSHORE", "Upstream Petroleum Extraction", "Oil & Gas", 42.0, "2026-09-30", "doc_total_fs", "https://totalenergies.com", 1, "fossil_fuels", "verified"),
        ("h_tot_2", "cand_total", "LNG Liquefaction & Gas Export Terminals", "TOT-LNG", "Natural Gas Liquefaction", "Fossil fuels", 35.0, "2026-09-30", "doc_total_fs", "https://totalenergies.com", 1, "fossil_fuels", "verified"),
        ("h_tot_3", "cand_total", "European Petrochemical Refineries", "TOT-REFINERY", "Petroleum Refining", "Oil refining", 23.0, "2026-09-30", "doc_total_fs", "https://totalenergies.com", 1, "fossil_fuels", "verified"),

        # RWE AG (EXCLUDED - Thermal Coal Mining)
        ("h_rwe_1", "cand_rwe", "Garzweiler Opencast Lignite Coal Mine", "RWE-GARZ", "Thermal Coal Mining", "Lignite mining", 32.0, "2026-09-30", "doc_rwe_fs", "https://rwe.com", 1, "thermal_coal,fossil_fuels", "verified"),
        ("h_rwe_2", "cand_rwe", "Neurath Lignite Coal-Fired Electric Power Station", "RWE-COAL", "Coal-Fired Power Generation", "Coal power", 28.0, "2026-09-30", "doc_rwe_fs", "https://rwe.com", 1, "thermal_coal,fossil_fuels", "verified"),
        ("h_rwe_3", "cand_rwe", "European Renewable Assets (Wind/Solar)", "RWE-RENEW", "Renewable Energy", "Wind & solar", 40.0, "2026-09-30", "doc_rwe_fs", "https://rwe.com", 0, "renewable_energy", "verified"),

        # Vanguard FTSE All-World (EXCLUDED - Shell, Exxon, Lockheed, BAT)
        ("h_van_1", "cand_vanguard", "Shell plc", "SHEL.L", "Integrated Oil & Gas Extraction", "Fossil Fuels", 0.38, "2026-09-30", "doc_vanguard_fs", "https://shell.com", 1, "fossil_fuels", "verified"),
        ("h_van_2", "cand_vanguard", "ExxonMobil Corp", "XOM", "Upstream Petroleum Extraction", "Fossil Fuels", 0.44, "2026-09-30", "doc_vanguard_fs", "https://exxonmobil.com", 1, "fossil_fuels", "verified"),
        ("h_van_3", "cand_vanguard", "Lockheed Martin Corp", "LMT", "Aerospace, Defense & Weapon Systems", "Armaments", 0.14, "2026-09-30", "doc_vanguard_fs", "https://lockheedmartin.com", 1, "armaments", "verified"),
        ("h_van_4", "cand_vanguard", "British American Tobacco plc", "BATS.L", "Cigarette & Tobacco Manufacturing", "Tobacco", 0.10, "2026-09-30", "doc_vanguard_fs", "https://bat.com", 1, "tobacco", "verified"),

        # Baltic Infrastructure (INVESTIGATION - Opaque 68% holdings, stale)
        ("h_bal_1", "cand_baltic", "Tallinn Wind Port Terminal", "BALT-01", "Port Logistics", "Port infrastructure", 18.0, "2025-11-30", "doc_baltic_fs", "", 0, "renewable_energy", "verified"),
        ("h_bal_2", "cand_baltic", "Riga Rail Logistics Link", "BALT-02", "Rail Infrastructure", "Rail transport", 14.0, "2025-11-30", "doc_baltic_fs", "", 0, "transport", "verified"),
        ("h_bal_3", "cand_baltic", "Undisclosed Portfolio Assets (68% Opaque)", "NONE", "Unreported Constituents", "Unreported", 68.0, "2025-11-30", "doc_baltic_fs", "", 0, "unknown", "unverified")
    ]

    cursor.executemany("""
    INSERT INTO holdings (
        id, candidate_id, company_name, issuer_identifier, sector, sub_sector,
        weight_pct, holding_date, source_document_id, source_url,
        is_prohibited_direct, controversial_activities, verification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, holdings_data)

    # 8. Initial Audit Event
    cursor.execute("""
    INSERT INTO audit_events (
        id, timestamp, action_type, affected_record, details_json, policy_version_id, outcome
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        f"aud_{uuid.uuid4().hex[:12]}",
        now_iso,
        "demo_reset",
        "system_initialization",
        json.dumps({
            "message": "Initialized EthicVest European infrastructure investment universe.",
            "candidates_count": len(candidates),
            "rules_count": len(rules),
            "theme": "European Infrastructure (Renewable Energy, Grid Modernisation, Storage)"
        }),
        policy_ver_id,
        "success"
    ))

    # 9. Initial Data Refresh Records
    refresh_records = [
        ("ref_01", "European Infrastructure Disclosures & Factsheets", "success", len(candidates), len(candidates), None, now_iso),
        ("ref_02", "JRCT Published Ethical Policy", "success", 1, 1, None, now_iso),
        ("ref_03", "European Regulatory SFDR Registry", "success", 8, 8, None, now_iso),
        ("ref_04", "FRED Risk-Free Reference Rate (3-Month Yield)", "success", 1, 1, "Cached 3.90% annual reference yield", now_iso)
    ]
    cursor.executemany("""
    INSERT INTO data_refresh_runs (
        id, source_name, status, records_checked, records_updated, error_message, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, refresh_records)

    conn.commit()
    conn.close()
    print("EthicVest European Infrastructure database successfully seeded.")

if __name__ == "__main__":
    seed()
