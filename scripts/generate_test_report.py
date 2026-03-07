from __future__ import annotations

import argparse
import datetime as dt
import subprocess
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos


@dataclass(frozen=True)
class TestResult:
    layer: str  # "frontend" | "backend"
    test_type: str  # "unit" | "integration" | "unknown"
    location: str
    name: str
    status: str  # "passed" | "failed" | "skipped"
    duration_seconds: float
    failure_message: str | None = None


def _run(cmd: list[str], cwd: Path) -> int:
    if sys.platform == "win32":
        return subprocess.run(["cmd", "/c", *cmd], cwd=cwd).returncode
    return subprocess.run(cmd, cwd=cwd).returncode


def _parse_vitest_type(test_name: str) -> str:
    lowered = test_name.lower()
    if "(unit)" in lowered:
        return "unit"
    if "(integration)" in lowered:
        return "integration"
    return "unknown"


def _backend_type_from_classname(classname: str) -> str:
    if classname.endswith("test_email_verification"):
        return "integration"
    if classname.endswith("test_utils"):
        return "unit"
    return "unknown"


def _humanize_pytest_name(name: str) -> str:
    raw = name.removeprefix("test_")
    parts = raw.split("_")

    def subject_label(subject: str) -> str:
        mapping = {
            "allowed file": "allowed_file(filename)",
            "verify password": "verify_password(password, hashed_password)",
            "send email verification code": "POST /api/citizens/send-email-verification-code",
        }
        return mapping.get(subject, subject)

    if "positive" in parts:
        idx = parts.index("positive")
        subject = subject_label(" ".join(parts[:idx]))
        detail = " ".join(parts[idx + 1 :])
        return f"{subject} (positive){': ' + detail if detail else ''}"

    if "negative" in parts:
        idx = parts.index("negative")
        subject = subject_label(" ".join(parts[:idx]))
        detail = " ".join(parts[idx + 1 :])
        return f"{subject} (negative){': ' + detail if detail else ''}"

    return subject_label(" ".join(parts))


def _junit_status(testcase: ET.Element) -> tuple[str, str | None]:
    failure = testcase.find("failure")
    error = testcase.find("error")
    skipped = testcase.find("skipped")
    if failure is not None:
        return "failed", (failure.get("message") or (failure.text or "")).strip() or None
    if error is not None:
        return "failed", (error.get("message") or (error.text or "")).strip() or None
    if skipped is not None:
        return "skipped", None
    return "passed", None


def parse_junit(path: Path, *, layer: str) -> list[TestResult]:
    tree = ET.parse(path)
    root = tree.getroot()

    results: list[TestResult] = []
    for testcase in root.iter("testcase"):
        classname = testcase.get("classname", "") or ""
        name = testcase.get("name", "") or ""
        duration_raw = testcase.get("time", "0") or "0"
        try:
            duration = float(duration_raw)
        except ValueError:
            duration = 0.0

        status, failure_message = _junit_status(testcase)

        if layer == "frontend":
            test_type = _parse_vitest_type(name)
            location = classname or "frontend"
            display_name = name
        else:
            test_type = _backend_type_from_classname(classname)
            module = classname
            if module.startswith("tests."):
                location = f"pythonserver/{module.replace('.', '/')}.py"
            else:
                location = module or "pythonserver"
            display_name = _humanize_pytest_name(name)

        results.append(
            TestResult(
                layer=layer,
                test_type=test_type,
                location=location,
                name=display_name,
                status=status,
                duration_seconds=duration,
                failure_message=failure_message,
            )
        )

    return results


def _count(results: list[TestResult], *, layer: str | None = None) -> dict[str, int]:
    filtered = results
    if layer:
        filtered = [r for r in results if r.layer == layer]
    out = {"passed": 0, "failed": 0, "skipped": 0, "total": len(filtered)}
    for r in filtered:
        out[r.status] += 1
    return out


class ReportPDF(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", size=8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def write_pdf(results: list[TestResult], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    totals = _count(results)
    fe = _count(results, layer="frontend")
    be = _count(results, layer="backend")

    pdf = ReportPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=14)
    pdf.add_page()

    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", style="B", size=18)
    pdf.cell(0, 10, "Test Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 6, f"Generated: {now}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)

    pdf.set_font("Helvetica", style="B", size=12)
    pdf.cell(0, 8, "Summary", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", size=10)
    pdf.cell(
        0,
        6,
        f"Total: {totals['total']} | Passed: {totals['passed']} | Failed: {totals['failed']} | Skipped: {totals['skipped']}",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.cell(
        0,
        6,
        f"Frontend: {fe['total']} | Passed: {fe['passed']} | Failed: {fe['failed']} | Skipped: {fe['skipped']}",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )
    pdf.cell(
        0,
        6,
        f"Backend: {be['total']} | Passed: {be['passed']} | Failed: {be['failed']} | Skipped: {be['skipped']}",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )

    pdf.ln(4)
    pdf.set_font("Helvetica", style="B", size=12)
    pdf.cell(0, 8, "Details", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", size=9)

    def status_color(status: str) -> tuple[int, int, int]:
        return {"passed": (0, 128, 0), "failed": (180, 0, 0), "skipped": (120, 120, 120)}.get(status, (0, 0, 0))

    for r in sorted(results, key=lambda x: (x.layer, x.test_type, x.location, x.name)):
        pdf.set_text_color(*status_color(r.status))
        badge = r.status.upper()
        pdf.cell(
            0,
            5,
            f"[{badge}] {r.layer} / {r.test_type}",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )

        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(0, 4.5, f"Test: {r.name}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_text_color(80, 80, 80)
        location_wrapped = r.location.replace("\\", "\\ ").replace("/", "/ ")
        pdf.multi_cell(
            0,
            4.5,
            f"Location: {location_wrapped} | Duration: {r.duration_seconds:.3f}s",
            new_x=XPos.LMARGIN,
            new_y=YPos.NEXT,
        )

        if r.failure_message:
            pdf.set_text_color(180, 0, 0)
            pdf.multi_cell(
                0,
                4.5,
                f"Failure: {r.failure_message}",
                new_x=XPos.LMARGIN,
                new_y=YPos.NEXT,
            )

        pdf.ln(2)

    pdf.output(str(out_path))


def main() -> int:
    parser = argparse.ArgumentParser(description="Run frontend + backend tests and generate a PDF report.")
    parser.add_argument("--no-run", action="store_true", help="Do not run tests; use existing JUnit XML files in ./reports.")
    parser.add_argument("--out", default="reports/test-report.pdf", help="Output PDF path (default: reports/test-report.pdf)")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    reports_dir = repo_root / "reports"
    frontend_junit = reports_dir / "frontend-junit.xml"
    backend_junit = reports_dir / "backend-junit.xml"

    frontend_rc = 0
    backend_rc = 0
    if not args.no_run:
        reports_dir.mkdir(parents=True, exist_ok=True)
        frontend_rc = _run(
            ["npx", "vitest", "run", "--reporter", "junit", "--outputFile", str(frontend_junit)],
            cwd=repo_root,
        )
        backend_rc = _run(
            [sys.executable, "-m", "pytest", "--junitxml", str(backend_junit)],
            cwd=repo_root / "pythonserver",
        )

    if not frontend_junit.exists():
        raise SystemExit(f"Missing frontend JUnit file: {frontend_junit}")
    if not backend_junit.exists():
        raise SystemExit(f"Missing backend JUnit file: {backend_junit}")

    results = []
    results.extend(parse_junit(frontend_junit, layer="frontend"))
    results.extend(parse_junit(backend_junit, layer="backend"))

    out_path = (repo_root / args.out).resolve()
    write_pdf(results, out_path)
    print(f"PDF written to: {out_path}")
    any_failed = any(r.status == "failed" for r in results)
    if any_failed or frontend_rc != 0 or backend_rc != 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
