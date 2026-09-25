#!/usr/bin/env python3
"""
tests/run_tests.py
Automated CLI runner for the CableSampler 4-tier in-browser test suite.
Zero external dependencies: uses Python 3 stdlib and Google Chrome headless.
"""

import os
import sys
import argparse
import subprocess
import json
import re
import time
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from tests.test_server import CableSamplerTestServer


def find_chrome():
    candidates = [
        "/home/jacobj/.cargo/bin/google-chrome",
        shutil.which("google-chrome"),
        shutil.which("google-chrome-stable"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
    ]
    for c in candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    raise FileNotFoundError("Google Chrome binary not found in PATH or cargo bin.")


def execute_browser_tests(port=0, timeout_sec=20, verbose=False):
    chrome_bin = find_chrome()
    print("=" * 78)
    print("CableSampler Automated Browser Test Suite Execution")
    print(f"Chrome Binary: {chrome_bin}")
    print("=" * 78)

    with CableSamplerTestServer(port=port, root_dir=PROJECT_ROOT, quiet=not verbose) as server:
        runner_url = f"http://127.0.0.1:{server.port}/tests/runner.html"
        print(f"Loading test runner: {runner_url}")

        cmd = [
            chrome_bin,
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--window-size=1280,800",
            "--virtual-time-budget=10000",
            "--dump-dom",
            runner_url
        ]

        start_time = time.time()
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_sec)
        elapsed = time.time() - start_time

        dom = proc.stdout

        # Search for #test-results in rendered DOM
        match = re.search(r'<div id="test-results"[^>]*data-summary=([\'"])(.*?)\1[^>]*>', dom)
        summary = None
        if match:
            raw_json = match.group(2)
            # unescape html entities if any
            raw_json = raw_json.replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
            try:
                summary = json.loads(raw_json)
            except json.JSONDecodeError as e:
                print(f"[ERROR] Failed to parse summary JSON from DOM: {e}")

        # Fallback to searching text content of #test-results
        if not summary:
            text_match = re.search(r'<div id="test-results"[^>]*>(.*?)</div>', dom, re.DOTALL)
            if text_match:
                try:
                    summary = json.loads(text_match.group(1).strip())
                except Exception:
                    pass

        # Check for server 404 / 500 errors
        server_errors = server.error_logs
        if server_errors:
            print(f"\n[NETWORK WARNING] Detected {len(server_errors)} HTTP error(s):")
            for err in server_errors:
                print(f"  - {err['request']} -> Status {err['status']}")

        if not summary:
            print("\n[FAIL] Could not locate test results in rendered DOM.")
            if verbose:
                print("\nDumped DOM snippet:\n", dom[:1000])
            return False, None

        # Print formatted summary table
        print("\n" + "-" * 78)
        print(f"{'Tier':<24} | {'Passed':>8} | {'Failed':>8} | {'Status':>8}")
        print("-" * 78)

        tiers = summary.get('tiers', {})
        all_passed = summary.get('failed', 1) == 0 and len(server_errors) == 0

        for tier_key, tier_data in tiers.items():
            tier_name = tier_key.replace('_', ' ').title()
            t_pass = tier_data.get('passed', 0)
            t_fail = tier_data.get('failed', 0)
            t_status = "PASS" if t_fail == 0 else "FAIL"
            print(f"{tier_name:<24} | {t_pass:>8} | {t_fail:>8} | {t_status:>8}")

        print("-" * 78)
        total = summary.get('total', 0)
        passed = summary.get('passed', 0)
        failed = summary.get('failed', 0)
        duration = summary.get('durationMs', int(elapsed * 1000))
        overall_status = "PASSED" if all_passed else "FAILED"

        print(f"Total Tests: {total} | Passed: {passed} | Failed: {failed} | Duration: {duration} ms")
        print(f"Network Status: {len(server_errors)} error(s) | Overall Suite: {overall_status}")
        print("=" * 78)

        # Print any failing tests
        if failed > 0:
            print("\nFailed Test Details:")
            for t in summary.get('tests', []):
                if t.get('status') == 'FAIL':
                    print(f"  - [{t.get('id')}] {t.get('description')}: {t.get('error')}")

        return all_passed, summary


def main():
    parser = argparse.ArgumentParser(description="Run CableSampler In-Browser Tests via Headless Chrome")
    parser.add_argument("--port", type=int, default=0, help="Port to bind server (default 0 for dynamic)")
    parser.add_argument("--timeout", type=int, default=20, help="Chrome execution timeout in seconds")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--visual", action="store_true", help="Also run visual regression diff")
    args = parser.parse_args()

    tests_ok, _ = execute_browser_tests(port=args.port, timeout_sec=args.timeout, verbose=args.verbose)

    visual_ok = True
    if args.visual:
        print("\nExecuting Visual Regression Tests...")
        from tests.visual_diff import run_visual_diff
        visual_ok, _ = run_visual_diff(port=args.port, verbose=args.verbose)

    sys.exit(0 if (tests_ok and visual_ok) else 1)


if __name__ == "__main__":
    main()
