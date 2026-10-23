import sys
import json
from database import init_db, get_connection
from seed_data import seed
from screening_engine import run_ethical_screening
from portfolio_calculator import calculate_portfolio

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified"}))
        sys.exit(1)

    action = sys.argv[1]

    if action == "seed" or action == "reset":
        seed()
        run_ethical_screening(triggered_by="system_reset")
        calculate_portfolio(allocation_strategy="balanced")
        print(json.dumps({"status": "success", "message": "Demo data successfully re-seeded with latest screening and portfolio."}))

    elif action == "screen":
        policy_ver_id = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "null" else None
        res = run_ethical_screening(policy_version_id=policy_ver_id, triggered_by="ui_action")
        print(json.dumps(res))

    elif action == "portfolio":
        params_str = sys.argv[2] if len(sys.argv) > 2 else "{}"
        try:
            params = json.loads(params_str)
        except Exception:
            params = {}
        strategy = params.get("allocation_strategy") or params.get("mode") or "balanced"
        res = calculate_portfolio(
            screening_run_id=params.get("screening_run_id"),
            total_budget_gbp=float(params.get("total_budget_gbp", 100000.0)),
            min_cash_reserve_pct=float(params.get("min_cash_reserve_pct", 5.0)),
            min_allocation_pct=float(params.get("min_allocation_pct", 10.0)),
            max_allocation_pct=float(params.get("max_allocation_pct", 35.0)),
            max_annual_fee_pct=float(params.get("max_annual_fee_pct", 0.85)),
            allocation_strategy=strategy
        )
        print(json.dumps(res))

    elif action == "test":
        import run_tests_json
        run_tests_json.run_tests_json()

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
