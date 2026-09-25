#!/usr/bin/env python3
"""
tests/visual_diff.py
Automated visual regression testing engine for CableSampler HMI.
- Uses headless Google Chrome to capture 7 key HMI views
- Uses capture_harness.html to freeze dynamic timers for deterministic rendering
- Compares pixel-by-pixel against baseline screenshots via PIL (Pillow)
- Strict 0.00% difference threshold (with 0.01% font anti-aliasing tolerance)
"""

import os
import sys
import argparse
import subprocess
import shutil
from PIL import Image, ImageChops, ImageStat

# Add parent directory to path to import test_server
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from tests.test_server import CableSamplerTestServer

LOCAL_FIXTURES_BASELINE = os.path.join(SCRIPT_DIR, 'fixtures', 'baseline')
EXPLORER_BASELINE = os.path.join(
    PROJECT_ROOT, '.agents', 'explorer_survey_3', 'scratch', 'baseline'
)
DEFAULT_BASELINE_DIR = LOCAL_FIXTURES_BASELINE if os.path.isdir(LOCAL_FIXTURES_BASELINE) else EXPLORER_BASELINE
DEFAULT_OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'visual_diff_output')

VIEWS = [
    ("01_auth_locked", "unlock=0"),
    ("02_current_job", "view=current-job"),
    ("03_queue", "view=queue"),
    ("04_history", "view=history"),
    ("05_settings", "view=settings"),
    ("06_modal_create_job", "view=current-job&modal=1"),
    ("07_current_job_paused", "view=current-job&pause=1"),
]


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


def compare_images(baseline_path, target_path, diff_output_path=None, tolerance_percent=0.01):
    """
    Compares two PNG images pixel-by-pixel using PIL ImageChops.
    Returns (passed: bool, diff_percent: float, diff_sum: float, error_msg: str)
    """
    if not os.path.exists(baseline_path):
        return False, 100.0, 0.0, f"Baseline file missing: {baseline_path}"
    if not os.path.exists(target_path):
        return False, 100.0, 0.0, f"Captured target file missing: {target_path}"

    with Image.open(baseline_path) as b_img, Image.open(target_path) as t_img:
        base_rgb = b_img.convert('RGB')
        targ_rgb = t_img.convert('RGB')

        if base_rgb.size != targ_rgb.size:
            return False, 100.0, 0.0, f"Dimension mismatch: {base_rgb.size} vs {targ_rgb.size}"

        diff = ImageChops.difference(base_rgb, targ_rgb)
        stat = ImageStat.Stat(diff)
        diff_sum = sum(stat.sum)

        total_pixels = base_rgb.size[0] * base_rgb.size[1] * 3
        diff_percent = (diff_sum / (total_pixels * 255.0)) * 100.0

        if diff_sum > 0 and diff_output_path:
            os.makedirs(os.path.dirname(diff_output_path), exist_ok=True)
            # Create high-visibility amplified diff mask
            amplified = diff.point(lambda p: min(255, p * 8))
            amplified.save(diff_output_path)

        passed = diff_percent <= tolerance_percent
        return passed, diff_percent, diff_sum, None


def run_visual_diff(baseline_dir=DEFAULT_BASELINE_DIR, output_dir=DEFAULT_OUTPUT_DIR, port=0, verbose=False):
    chrome_bin = find_chrome()
    os.makedirs(output_dir, exist_ok=True)
    captured_dir = os.path.join(output_dir, "captured")
    diffs_dir = os.path.join(output_dir, "diffs")
    os.makedirs(captured_dir, exist_ok=True)
    os.makedirs(diffs_dir, exist_ok=True)

    print("=" * 78)
    print("CableSampler Visual Regression Diff Engine")
    print(f"Chrome Binary:  {chrome_bin}")
    print(f"Baseline Dir:   {baseline_dir}")
    print(f"Output Dir:     {output_dir}")
    print("=" * 78)

    results = []
    all_passed = True

    with CableSamplerTestServer(port=port, root_dir=PROJECT_ROOT, quiet=True) as server:
        harness_base_url = f"http://127.0.0.1:{server.port}/tests/capture_harness.html"

        for view_name, query_param in VIEWS:
            url = f"{harness_base_url}?{query_param}"
            target_png = os.path.join(captured_dir, f"{view_name}.png")
            diff_png = os.path.join(diffs_dir, f"{view_name}_diff.png")
            baseline_png = os.path.join(baseline_dir, f"{view_name}.png")

            # Capture screenshot
            cmd = [
                chrome_bin,
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--window-size=1280,800",
                f"--screenshot={target_png}",
                url
            ]

            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if proc.returncode != 0:
                print(f"[FAIL] Chrome failed capturing {view_name}: {proc.stderr[:200]}")
                results.append({
                    "name": view_name,
                    "passed": False,
                    "diff_percent": 100.0,
                    "error": f"Chrome exit code {proc.returncode}"
                })
                all_passed = False
                continue

            passed, diff_pct, diff_sum, err = compare_images(
                baseline_png, target_png, diff_output_path=diff_png, tolerance_percent=0.01
            )

            status = "PASS" if passed else "FAIL"
            if not passed:
                all_passed = False

            results.append({
                "name": view_name,
                "passed": passed,
                "diff_percent": diff_pct,
                "diff_sum": diff_sum,
                "error": err
            })

            pct_str = f"{diff_pct:.4f}%"
            print(f"[{status:4s}] {view_name:<24} | Diff: {pct_str:>8} | Baseline: {os.path.basename(baseline_png)}")
            if err:
                print(f"       Notice: {err}")

    print("-" * 78)
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    summary_status = "PASSED" if all_passed else "FAILED"
    print(f"Summary: {summary_status} ({passed_count}/{total_count} views matched baseline within tolerance)")
    print("=" * 78)

    return all_passed, results


def main():
    parser = argparse.ArgumentParser(description="Run CableSampler Visual Regression Diff")
    parser.add_argument("--baseline", default=DEFAULT_BASELINE_DIR, help="Directory containing baseline PNGs")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_DIR, help="Directory for captured images and diffs")
    parser.add_argument("--port", type=int, default=0, help="Server port (default 0 for dynamic)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--update-baseline", action="store_true", help="Save captured screenshots as baseline")
    args = parser.parse_args()

    if args.update_baseline:
        os.makedirs(args.baseline, exist_ok=True)
        print(f"Updating baseline screenshots in: {args.baseline}")
        chrome_bin = find_chrome()
        with CableSamplerTestServer(port=args.port, root_dir=PROJECT_ROOT, quiet=True) as server:
            harness_url = f"http://127.0.0.1:{server.port}/tests/capture_harness.html"
            for view_name, query_param in VIEWS:
                url = f"{harness_url}?{query_param}"
                out_png = os.path.join(args.baseline, f"{view_name}.png")
                cmd = [chrome_bin, "--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=1280,800", f"--screenshot={out_png}", url]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"  [SAVED] {view_name} -> {out_png}")
        print("Baseline update complete.")
        sys.exit(0)

    success, _ = run_visual_diff(
        baseline_dir=args.baseline,
        output_dir=args.output,
        port=args.port,
        verbose=args.verbose
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
