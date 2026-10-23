import unittest
import time
import json
import sys
import os

from test_ethicalvest import TestEthicalVestAI

def run_tests_json():
    TestEthicalVestAI.setUpClass()
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEthicalVestAI)
    results = []

    start_time = time.time()
    try:
        for test in suite:
            test_name = test._testMethodName
            doc = getattr(test, test_name).__doc__ or ""
            t0 = time.time()
            result = unittest.TestResult()
            test.run(result)
            duration_ms = round((time.time() - t0) * 1000, 2)

            is_success = len(result.errors) == 0 and len(result.failures) == 0
            error_msg = ""
            if not is_success:
                if result.errors:
                    error_msg = str(result.errors[0][1])
                elif result.failures:
                    error_msg = str(result.failures[0][1])

            results.append({
                "test_id": test_name,
                "title": test_name.replace("test_", "").replace("_", " ").title(),
                "description": doc.strip(),
                "passed": is_success,
                "duration_ms": duration_ms,
                "error": error_msg
            })
    finally:
        TestEthicalVestAI.tearDownClass()

    total_time = round(time.time() - start_time, 3)
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = len(results) - passed_count

    output = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_tests": len(results),
        "passed_count": passed_count,
        "failed_count": failed_count,
        "total_duration_sec": total_time,
        "tests": results
    }

    print(json.dumps(output))

if __name__ == "__main__":
    run_tests_json()
