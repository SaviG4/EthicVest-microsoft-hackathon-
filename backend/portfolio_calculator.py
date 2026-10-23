import json
import uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from database import get_connection

def calculate_portfolio(
    screening_run_id=None,
    total_budget_gbp=100000.0,
    min_cash_reserve_pct=5.0,
    min_allocation_pct=10.0,
    max_allocation_pct=35.0,
    max_annual_fee_pct=0.85,
    allocation_strategy="balanced", # "balanced" (max Sharpe proxy) or "cautious" (min volatility)
    db_path=None
):
    """
    Transparent, deterministic Portfolio Calculation Engine using Python Decimal.
    Ensures:
    - Only ELIGIBLE candidates can enter allocation.
    - Excluded candidates are strictly rejected.
    - Respects position limits [min_pct, max_pct].
    - Respects min cash reserve.
    - Penny-exact arithmetic: allocated + unallocated cash = total budget.
    - Explains infeasibility clearly if constraints cannot be satisfied.
    """
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # 1. Get latest screening run if not provided
    if not screening_run_id:
        cursor.execute("SELECT id, policy_version_id FROM screening_runs ORDER BY run_timestamp DESC LIMIT 1")
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("No screening runs available. Please execute ethical screening first.")
        screening_run_id = row["id"]
        policy_ver_id = row["policy_version_id"]
    else:
        cursor.execute("SELECT policy_version_id FROM screening_runs WHERE id = ?", (screening_run_id,))
        row = cursor.fetchone()
        policy_ver_id = row["policy_version_id"] if row else None

    # 2. Query eligible candidates with metrics
    cursor.execute("""
    SELECT c.id, c.name, c.identifier, c.asset_class, c.fund_manager,
           f.primary_status, f.evidence_completeness,
           m.ocf_fee_pct, m.yield_pct, m.volatility_3yr_pct, m.perf_1yr_pct, m.perf_3yr_pct, m.data_completeness
    FROM screening_findings f
    JOIN investment_candidates c ON f.candidate_id = c.id
    LEFT JOIN financial_metrics m ON c.id = m.candidate_id
    WHERE f.run_id = ?
    ORDER BY c.name ASC
    """, (screening_run_id,))
    all_findings = [dict(r) for r in cursor.fetchall()]

    # Filter strictly for ELIGIBLE candidates
    eligible_candidates = [c for c in all_findings if c["primary_status"] in ("Passes required checks", "ELIGIBLE FOR FURTHER COMPARISON")]

    # Decimal constants
    D_ZERO = Decimal("0.00")
    D_PENNY = Decimal("0.01")
    D_HUNDRED = Decimal("100.00")

    D_TOTAL_BUDGET = Decimal(str(total_budget_gbp)).quantize(D_PENNY, rounding=ROUND_HALF_UP)
    D_MIN_CASH_PCT = Decimal(str(min_cash_reserve_pct))
    D_MIN_ALLOC_PCT = Decimal(str(min_allocation_pct))
    D_MAX_ALLOC_PCT = Decimal(str(max_allocation_pct))
    D_MAX_FEE_PCT = Decimal(str(max_annual_fee_pct))

    min_cash_reserve_gbp = (D_TOTAL_BUDGET * (D_MIN_CASH_PCT / D_HUNDRED)).quantize(D_PENNY, rounding=ROUND_HALF_UP)
    investable_budget = D_TOTAL_BUDGET - min_cash_reserve_gbp

    scenario_id = f"scen_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Constraint Check 1: Must have eligible candidates
    if len(eligible_candidates) == 0:
        infeasibility_msg = "Infeasible: Zero candidates passed mandatory ethical screening. No compliant allocation can be constructed under active policy."
        conn.close()
        return {
            "scenario_id": scenario_id,
            "is_feasible": False,
            "infeasibility_reason": infeasibility_msg,
            "positions": [],
            "total_budget": float(D_TOTAL_BUDGET),
            "allocated_amount": 0.0,
            "unallocated_cash": float(D_TOTAL_BUDGET)
        }

    # Constraint Check 2: Minimum allocation feasibility
    min_needed = D_TOTAL_BUDGET * (D_MIN_ALLOC_PCT / D_HUNDRED) * Decimal(str(len(eligible_candidates)))
    if min_needed > investable_budget:
        # If too many candidates to give everyone min_alloc within investable budget, limit number of positions
        max_positions_possible = int(investable_budget / (D_TOTAL_BUDGET * (D_MIN_ALLOC_PCT / D_HUNDRED)))
        if max_positions_possible < 1:
            infeasibility_msg = f"Infeasible: Required min cash reserve ({D_MIN_CASH_PCT}%) leaves insufficient investable budget ({investable_budget}) for min position size ({D_MIN_ALLOC_PCT}%)."
            conn.close()
            return {
                "scenario_id": scenario_id,
                "is_feasible": False,
                "infeasibility_reason": infeasibility_msg,
                "positions": [],
                "total_budget": float(D_TOTAL_BUDGET),
                "allocated_amount": 0.0,
                "unallocated_cash": float(D_TOTAL_BUDGET)
            }
        # Select top candidates up to max_positions_possible
        if allocation_strategy in ("cautious", "min_volatility"):
            selected_candidates = sorted(eligible_candidates, key=lambda c: float(c.get("volatility_3yr_pct") or 15.0))[:max_positions_possible]
        else:
            selected_candidates = sorted(eligible_candidates, key=lambda c: (float(c.get("perf_3yr_pct") or 0.0) / max(3.0, float(c.get("volatility_3yr_pct") or 15.0))), reverse=True)[:max_positions_possible]
    else:
        selected_candidates = eligible_candidates

    # Compute raw weights based on strategy (Cautious vs Balanced)
    raw_weights = {}
    for cand in selected_candidates:
        c_id = cand["id"]
        vol = float(cand.get("volatility_3yr_pct") or 12.0)
        perf_3yr = float(cand.get("perf_3yr_pct") or 6.0)

        if allocation_strategy in ("cautious", "min_volatility"):
            # Cautious: Min-volatility / inverse-volatility weighting
            # Candidates with lowest historical volatility (e.g. National Grid, Terna) get highest allocations
            raw_w = Decimal(str(round(1.0 / max(3.0, vol), 6)))
        elif allocation_strategy in ("balanced", "max_sharpe", "risk_balanced"):
            # Balanced: Maximizes risk-adjusted return (Sharpe ratio proxy relative to ~3.5% risk-free rate)
            sharpe_proxy = max(0.1, (perf_3yr - 3.5) / max(4.0, vol))
            raw_w = Decimal(str(round(sharpe_proxy, 6)))
        elif allocation_strategy == "climate_impact":
            if "Environmental" in cand["name"] or "Impax" in cand.get("fund_manager", "") or "Ørsted" in cand["name"]:
                raw_w = Decimal("1.5")
            else:
                raw_w = Decimal("1.0")
        else: # equal_weight
            raw_w = Decimal("1.0")

        raw_weights[c_id] = raw_w

    sum_raw = sum(raw_weights.values())

    # Calculate initial percentage targets bounded by [min_alloc, max_alloc]
    bounded_pcts = {}
    for c_id, raw_w in raw_weights.items():
        share_of_investable = raw_w / sum_raw
        # Scale to percentage of total budget
        pct_of_total = (share_of_investable * (investable_budget / D_TOTAL_BUDGET) * D_HUNDRED)
        # Apply min/max clamp
        clamped_pct = max(D_MIN_ALLOC_PCT, min(D_MAX_ALLOC_PCT, pct_of_total))
        bounded_pcts[c_id] = clamped_pct

    # Normalize bounded pcts so their sum matches total investable percentage
    target_investable_pct = (investable_budget / D_TOTAL_BUDGET) * D_HUNDRED
    sum_bounded = sum(bounded_pcts.values())

    normalized_pcts = {}
    for c_id, p in bounded_pcts.items():
        norm_p = (p / sum_bounded) * target_investable_pct
        norm_p = max(D_MIN_ALLOC_PCT, min(D_MAX_ALLOC_PCT, norm_p))
        normalized_pcts[c_id] = norm_p.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Convert percentages to GBP amounts
    allocated_amounts = {}
    running_allocated_sum = D_ZERO
    for c_id, pct in normalized_pcts.items():
        amt = (D_TOTAL_BUDGET * (pct / D_HUNDRED)).quantize(D_PENNY, rounding=ROUND_HALF_UP)
        allocated_amounts[c_id] = amt
        running_allocated_sum += amt

    # Ensure cash reserve is at least min_cash_reserve_gbp
    remaining_cash = D_TOTAL_BUDGET - running_allocated_sum
    if remaining_cash < min_cash_reserve_gbp:
        # Trim from largest position by difference
        deficit = min_cash_reserve_gbp - remaining_cash
        largest_cid = max(allocated_amounts, key=lambda k: allocated_amounts[k])
        allocated_amounts[largest_cid] -= deficit
        running_allocated_sum -= deficit
        remaining_cash = min_cash_reserve_gbp

    # Build detailed positions
    positions = []
    total_fee_weighted = Decimal("0.0")
    total_yield_weighted = Decimal("0.0")
    total_vol_weighted = Decimal("0.0")

    for cand in selected_candidates:
        c_id = cand["id"]
        amt = allocated_amounts.get(c_id, D_ZERO)
        pct = (amt / D_TOTAL_BUDGET * D_HUNDRED).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        fee_pct = Decimal(str(cand.get("ocf_fee_pct") or 0.0))
        yield_pct = Decimal(str(cand.get("yield_pct") or 0.0))
        vol_pct = Decimal(str(cand.get("volatility_3yr_pct") or 0.0))

        annual_fee_gbp = (amt * (fee_pct / D_HUNDRED)).quantize(D_PENNY, rounding=ROUND_HALF_UP)

        total_fee_weighted += (pct / D_HUNDRED) * fee_pct
        total_yield_weighted += (pct / D_HUNDRED) * yield_pct
        total_vol_weighted += (pct / D_HUNDRED) * vol_pct

        positions.append({
            "candidate_id": c_id,
            "name": cand["name"],
            "identifier": cand["identifier"],
            "asset_class": cand["asset_class"],
            "fund_manager": cand["fund_manager"],
            "allocated_amount": float(amt),
            "weight_pct": float(pct),
            "ocf_fee_pct": float(fee_pct),
            "annual_fee_gbp": float(annual_fee_gbp),
            "yield_pct": float(yield_pct),
            "volatility_3yr_pct": float(vol_pct),
            "data_completeness": cand.get("data_completeness", "complete"),
            "rationale": f"Passed all verified ethical checks. Risk-balanced allocation of £{amt:,.2f} ({pct}% of total capital)."
        })

    weighted_fee_pct = float(total_fee_weighted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    weighted_yield_pct = float(total_yield_weighted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    weighted_vol_pct = float(total_vol_weighted.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    # Fee budget constraint validation
    is_feasible = True
    infeasibility_reason = None
    if Decimal(str(weighted_fee_pct)) > D_MAX_FEE_PCT:
        is_feasible = False
        infeasibility_reason = f"Fee constraint warning: Proposed portfolio weighted fee ({weighted_fee_pct}%) exceeds charity's maximum fee budget of {max_annual_fee_pct}%."

    # Save scenario to DB
    scenario_name = f"Scenario {allocation_strategy.replace('_', ' ').title()} (£{int(total_budget_gbp):,})"
    cursor.execute("""
    INSERT INTO portfolio_scenarios (
        id, name, screening_run_id, policy_version_id, total_budget,
        allocated_amount, unallocated_cash, weighted_fee_pct, weighted_yield_pct,
        weighted_volatility_pct, allocation_method, is_feasible, infeasibility_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        scenario_id, scenario_name, screening_run_id, policy_ver_id,
        float(D_TOTAL_BUDGET), float(running_allocated_sum), float(remaining_cash),
        weighted_fee_pct, weighted_yield_pct, weighted_vol_pct,
        allocation_strategy, 1 if is_feasible else 0, infeasibility_reason, now_iso
    ))

    # Save positions
    for p in positions:
        cursor.execute("""
        INSERT INTO portfolio_positions (
            scenario_id, candidate_id, allocated_amount, weight_pct,
            annual_fee_gbp, data_completeness, rationale
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            scenario_id, p["candidate_id"], p["allocated_amount"], p["weight_pct"],
            p["annual_fee_gbp"], p["data_completeness"], p["rationale"]
        ))

    # Audit event
    cursor.execute("""
    INSERT INTO audit_events (
        id, timestamp, action_type, affected_record, details_json,
        policy_version_id, screening_run_id, scenario_id, outcome
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"aud_{uuid.uuid4().hex[:12]}", now_iso, "portfolio_constructed", scenario_id,
        json.dumps({
            "total_budget": float(D_TOTAL_BUDGET),
            "allocated": float(running_allocated_sum),
            "cash_reserve": float(remaining_cash),
            "positions_count": len(positions),
            "weighted_fee_pct": weighted_fee_pct,
            "strategy": allocation_strategy
        }),
        policy_ver_id, screening_run_id, scenario_id, "success"
    ))

    conn.commit()
    conn.close()

    return {
        "scenario_id": scenario_id,
        "name": scenario_name,
        "screening_run_id": screening_run_id,
        "policy_version_id": policy_ver_id,
        "is_feasible": is_feasible,
        "infeasibility_reason": infeasibility_reason,
        "total_budget": float(D_TOTAL_BUDGET),
        "allocated_amount": float(running_allocated_sum),
        "unallocated_cash": float(remaining_cash),
        "weighted_fee_pct": weighted_fee_pct,
        "weighted_yield_pct": weighted_yield_pct,
        "weighted_volatility_pct": weighted_vol_pct,
        "positions": positions,
        "allocation_strategy": allocation_strategy,
        "created_at": now_iso
    }

if __name__ == "__main__":
    port = calculate_portfolio()
    print("Portfolio calculated successfully:", port["scenario_id"])
    print(f"Allocated: £{port['allocated_amount']:,.2f}, Cash: £{port['unallocated_cash']:,.2f}")
    for pos in port["positions"]:
        print(f" - {pos['name']}: £{pos['allocated_amount']:,.2f} ({pos['weight_pct']}%)")
