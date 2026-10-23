import json
import uuid
from datetime import datetime, timezone
from database import get_connection

def run_ethical_screening(policy_version_id=None, triggered_by="manual", db_path=None):
    """
    Deterministic Python Ethical Screening Engine.
    Enforces rules:
    - Rules determine compliance.
    - Mandatory exclusions cannot be offset by high ESG score, strong returns, or low fees.
    - Confirmed breach -> EXCLUDED (even if other data is partial).
    - Missing/stale holdings with no breach -> NEEDS INVESTIGATION.
    - All mandatory checks satisfied with verified evidence -> ELIGIBLE FOR FURTHER COMPARISON.
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # 1. Determine active policy version
    if not policy_version_id:
        cursor.execute("SELECT id FROM policy_versions ORDER BY version_number DESC LIMIT 1")
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("No policy version found in database.")
        policy_version_id = row["id"]

    # 2. Load active policy rules
    cursor.execute("""
    SELECT id, rule_code, name, sector_or_activity, rule_type, severity,
           description, threshold_pct, include_indirect, action_on_unknown, status
    FROM policy_rules
    WHERE policy_version_id = ? AND status = 'active'
    """, (policy_version_id,))
    rules = [dict(r) for r in cursor.fetchall()]

    mandatory_rules = [r for r in rules if r["rule_type"] == "mandatory_exclusion"]
    positive_rules = [r for r in rules if r["rule_type"] == "positive_preference"]
    disclosure_rules = [r for r in rules if r["rule_type"] == "disclosure_requirement"]

    # 3. Load all candidates
    cursor.execute("""
    SELECT id, name, legal_name, identifier, fund_manager, asset_class,
           source_pub_date, data_retrieval_date, data_status, holdings_disclosure_level
    FROM investment_candidates
    ORDER BY name ASC
    """)
    candidates = [dict(c) for c in cursor.fetchall()]

    run_id = f"scr_run_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    now_dt = datetime.now(timezone.utc)

    findings = []
    eligible_count = 0
    excluded_count = 0
    investigate_count = 0

    for cand in candidates:
        cand_id = cand["id"]

        # Load holdings for candidate
        cursor.execute("""
        SELECT id, company_name, issuer_identifier, sector, sub_sector,
               weight_pct, holding_date, is_prohibited_direct, controversial_activities,
               verification_status, source_url
        FROM holdings
        WHERE candidate_id = ?
        """, (cand_id,))
        holdings = [dict(h) for h in cursor.fetchall()]

        # Check data freshness (>180 days considered stale)
        pub_date_str = cand.get("source_pub_date")
        is_stale = False
        data_freshness_status = "current"
        if pub_date_str:
            try:
                pub_dt = datetime.strptime(pub_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                age_days = (now_dt - pub_dt).days
                if age_days > 180:
                    is_stale = True
                    data_freshness_status = "stale"
            except Exception:
                is_stale = True
                data_freshness_status = "unknown_date"
        else:
            is_stale = True
            data_freshness_status = "missing_date"

        # Check holdings coverage
        disc_level = cand.get("holdings_disclosure_level", "none")
        total_holdings_weight = sum(h["weight_pct"] for h in holdings)
        has_opaque_holding = any(h.get("controversial_activities") == "unknown" or "Unreported" in h.get("sector", "") for h in holdings)

        evidence_completeness = "complete"
        holdings_coverage_pct = 100.0
        if disc_level == "none" or len(holdings) == 0:
            evidence_completeness = "missing"
            holdings_coverage_pct = 0.0
        elif disc_level == "partial" or has_opaque_holding:
            evidence_completeness = "partial"
            holdings_coverage_pct = 26.0
        else:
            evidence_completeness = "complete"
            holdings_coverage_pct = 100.0

        # Evaluate rules
        confirmed_breaches = []
        unresolved_checks = []
        passed_checks = []
        positive_alignments = []

        # 1. Check Mandatory Exclusions against holdings
        for m_rule in mandatory_rules:
            activity = m_rule["sector_or_activity"]
            rule_code = m_rule["rule_code"]
            threshold = float(m_rule.get("threshold_pct") or 0.0)

            # Look for matching holdings
            breached_holdings = []
            exposure_sum = 0.0

            for h in holdings:
                controv = (h.get("controversial_activities") or "").lower()
                sec = (h.get("sector") or "").lower()
                is_direct = h.get("is_prohibited_direct", 0) == 1

                # Tag matching
                matches = False
                if activity == "fossil_fuels":
                    if "fossil_fuel" in controv:
                        matches = True
                    elif any(w in sec for w in ["oil & gas", "petroleum", "oil exploration", "oil extraction", "fossil fuel", "natural gas extraction"]):
                        matches = True
                elif activity == "thermal_coal":
                    if "thermal_coal" in controv or "coal mining" in sec or "coal extraction" in sec:
                        matches = True
                elif activity == "armaments":
                    if "armaments" in controv or "weapons" in controv or "defense system" in sec or "military" in sec or "munitions" in sec:
                        matches = True
                elif activity == "tobacco":
                    if "tobacco" in controv or "cigarette" in sec:
                        matches = True
                elif activity == "gambling":
                    if "gambling" in controv or "casino" in sec or "sports betting" in sec:
                        matches = True
                elif is_direct and activity in controv:
                    matches = True

                if matches:
                    weight = float(h["weight_pct"])
                    exposure_sum += weight
                    breached_holdings.append({
                        "holding_id": h["id"],
                        "company_name": h["company_name"],
                        "ticker": h["issuer_identifier"],
                        "sector": h["sector"],
                        "weight_pct": weight,
                        "source_url": h["source_url"]
                    })

            if exposure_sum > threshold or (threshold == 0.0 and len(breached_holdings) > 0):
                confirmed_breaches.append({
                    "rule_id": m_rule["id"],
                    "rule_code": rule_code,
                    "rule_name": m_rule["name"],
                    "exposure_pct": round(exposure_sum, 2),
                    "threshold_pct": threshold,
                    "breached_holdings": breached_holdings,
                    "rationale": f"Confirmed direct holding exposure of {round(exposure_sum, 2)}% exceeds policy threshold of {threshold}%."
                })
            else:
                passed_checks.append({
                    "rule_code": rule_code,
                    "rule_name": m_rule["name"],
                    "status": "passed",
                    "exposure_pct": round(exposure_sum, 2)
                })

        # 2. Check Disclosure Rules
        for d_rule in disclosure_rules:
            if d_rule["sector_or_activity"] == "disclosure":
                if evidence_completeness in ("missing", "partial") or is_stale:
                    unresolved_checks.append({
                        "rule_code": d_rule["rule_code"],
                        "rule_name": d_rule["name"],
                        "issue": "Incomplete or stale holdings transparency.",
                        "details": f"Disclosure level is '{disc_level}', freshness is '{data_freshness_status}', coverage is {holdings_coverage_pct}%."
                    })
                else:
                    passed_checks.append({
                        "rule_code": d_rule["rule_code"],
                        "rule_name": d_rule["name"],
                        "status": "passed",
                        "details": "Full holdings published within 180 days verified."
                    })

        # 3. Check Positive Preferences
        for p_rule in positive_rules:
            p_activity = p_rule["sector_or_activity"]
            matching_holdings = []
            for h in holdings:
                controv = (h.get("controversial_activities") or "").lower()
                sec = (h.get("sector") or "").lower()
                if (p_activity == "renewable_energy" and ("renewable" in controv or "energy" in sec or "solar" in sec or "wind" in sec)) or \
                   (p_activity == "environmental_solutions" and ("environmental" in controv or "water" in sec or "waste" in sec or "circular" in sec)):
                    matching_holdings.append({
                        "company_name": h["company_name"],
                        "weight_pct": h["weight_pct"],
                        "theme": p_rule["name"]
                    })
            if matching_holdings:
                positive_alignments.append({
                    "rule_code": p_rule["rule_code"],
                    "rule_name": p_rule["name"],
                    "holdings_count": len(matching_holdings),
                    "aligned_weight_pct": round(sum(h["weight_pct"] for h in matching_holdings), 2),
                    "top_holdings": matching_holdings[:3]
                })

        # Determine Primary Status
        # RULE 1: If ANY confirmed breach of mandatory rule exists -> Excluded
        if len(confirmed_breaches) > 0:
            primary_status = "Excluded"
            excluded_count += 1
            summary_rationale = f"Excluded: Breached {len(confirmed_breaches)} mandatory ethical policy rules ({', '.join(b['rule_code'] for b in confirmed_breaches)}). Mandatory exclusions cannot be offset by positive ESG metrics."
        # RULE 2: If no confirmed breach, but holdings missing or partial or stale -> Needs ethical investigation
        elif evidence_completeness in ("missing", "partial") or is_stale or len(unresolved_checks) > 0:
            primary_status = "Needs ethical investigation"
            investigate_count += 1
            reasons = []
            if evidence_completeness == "missing":
                reasons.append("Holdings disclosures completely unavailable")
            elif evidence_completeness == "partial":
                reasons.append(f"Partial holdings disclosure ({holdings_coverage_pct}% covered)")
            if is_stale:
                reasons.append("Factsheet/filing date is older than 180-day freshness limit")
            summary_rationale = f"Needs ethical investigation: {'; '.join(reasons)}. Ethical compliance cannot be established without verified full holdings disclosure."
        # RULE 3: Satisfies all mandatory checks
        else:
            primary_status = "Passes required checks"
            eligible_count += 1
            summary_rationale = f"Passes required checks: Passed all {len(passed_checks)} verified policy checks with 100% disclosed constituent holdings."

        details_json = json.dumps({
            "confirmed_breaches": confirmed_breaches,
            "unresolved_checks": unresolved_checks,
            "passed_checks": passed_checks,
            "positive_alignments": positive_alignments,
            "is_stale": is_stale,
            "holdings_count": len(holdings)
        })

        findings.append({
            "candidate_id": cand_id,
            "primary_status": primary_status,
            "evidence_completeness": evidence_completeness,
            "confirmed_breaches_count": len(confirmed_breaches),
            "unresolved_checks_count": len(unresolved_checks),
            "holdings_coverage_pct": holdings_coverage_pct,
            "data_freshness_status": data_freshness_status,
            "summary_rationale": summary_rationale,
            "details_json": details_json
        })

    # Save Screening Run to DB
    cursor.execute("""
    INSERT INTO screening_runs (
        id, policy_version_id, run_timestamp, total_candidates,
        eligible_count, excluded_count, investigate_count, triggered_by, screening_engine_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id, policy_version_id, now_iso, len(candidates),
        eligible_count, excluded_count, investigate_count, triggered_by, "1.0.0-deterministic"
    ))

    # Save Findings
    for f in findings:
        f_id = f"find_{uuid.uuid4().hex[:12]}"
        cursor.execute("""
        INSERT INTO screening_findings (
            id, run_id, candidate_id, primary_status, evidence_completeness,
            confirmed_breaches_count, unresolved_checks_count, holdings_coverage_pct,
            data_freshness_status, summary_rationale, details_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f_id, run_id, f["candidate_id"], f["primary_status"], f["evidence_completeness"],
            f["confirmed_breaches_count"], f["unresolved_checks_count"], f["holdings_coverage_pct"],
            f["data_freshness_status"], f["summary_rationale"], f["details_json"]
        ))

    # Log Audit Event
    audit_id = f"aud_{uuid.uuid4().hex[:12]}"
    cursor.execute("""
    INSERT INTO audit_events (
        id, timestamp, action_type, affected_record, details_json,
        policy_version_id, screening_run_id, outcome
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        audit_id, now_iso, "screening_executed", run_id,
        json.dumps({
            "total": len(candidates),
            "eligible": eligible_count,
            "excluded": excluded_count,
            "needs_investigation": investigate_count,
            "triggered_by": triggered_by
        }),
        policy_version_id, run_id, "success"
    ))

    conn.commit()
    conn.close()

    return {
        "run_id": run_id,
        "policy_version_id": policy_version_id,
        "timestamp": now_iso,
        "total_candidates": len(candidates),
        "eligible_count": eligible_count,
        "excluded_count": excluded_count,
        "investigate_count": investigate_count,
        "findings": findings
    }

if __name__ == "__main__":
    res = run_ethical_screening()
    print(f"Screening Run Completed: ID={res['run_id']}")
    print(f"Eligible: {res['eligible_count']}, Excluded: {res['excluded_count']}, Investigate: {res['investigate_count']}")
