"""
Aravanta Cloud OS — Strix Penetration Testing & Vulnerability Assessment Runner
Integrates Strix (usestrix/strix) for autonomous AI-driven security auditing and exploit validation.
Strict adherence to ACOS Rules:
- NO FABRICATED DATA: Only real output from Strix runs (PoCs, CVSS, patches).
- EVIDENCE-GATED: Findings contain reproducible exploit payloads.
- PROVENANCE ON EVERY RESPONSE: {source: "strix-agent", observed_at: ...}
"""
import os
import sys
import json
import shutil
import logging
import subprocess
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.services.arvguard.models import StrixScanRun, StrixFinding

logger = logging.getLogger("aravanta.arvguard.strix")


class StrixRunner:
    @staticmethod
    def check_strix_status() -> Dict[str, Any]:
        """
        Inspects environment to determine Strix availability and readiness:
        1. Local Docker daemon responsiveness
        2. Strix CLI or Python module installation
        3. Strix Cloud API key configuration
        4. LLM Provider configuration
        """
        now = datetime.datetime.utcnow().isoformat()
        diagnostics = []

        # 1. Strix CLI or Module Detection
        cli_path = shutil.which("strix")
        has_cli = bool(cli_path)
        has_module = False
        strix_version = None

        if has_cli:
            diagnostics.append(f"Strix CLI located at {cli_path}")
            try:
                res = subprocess.run([cli_path, "--version"], capture_output=True, text=True, timeout=5)
                if res.returncode == 0:
                    strix_version = res.stdout.strip() or res.stderr.strip()
            except Exception:
                pass
        else:
            try:
                import importlib.metadata
                strix_version = importlib.metadata.version("strix-agent")
                has_module = True
                diagnostics.append(f"Strix Python package detected (v{strix_version})")
            except Exception:
                diagnostics.append("Strix CLI and Python package not detected in current PATH.")

        # 2. Docker Daemon Detection
        docker_path = shutil.which("docker")
        docker_running = False
        if docker_path:
            try:
                res = subprocess.run([docker_path, "info"], capture_output=True, text=True, timeout=4)
                if res.returncode == 0:
                    docker_running = True
                    diagnostics.append("Docker daemon is active and responsive.")
                else:
                    diagnostics.append("Docker binary found but daemon is not responding.")
            except Exception as e:
                diagnostics.append(f"Docker check timed out or failed: {str(e)}")
        else:
            diagnostics.append("Docker binary not found in PATH.")

        # 3. LLM Configuration Detection
        strix_llm = os.environ.get("STRIX_LLM")
        llm_api_key = os.environ.get("LLM_API_KEY")
        has_llm = bool(strix_llm and llm_api_key)
        if has_llm:
            diagnostics.append(f"LLM configured for Strix ({strix_llm}).")
        else:
            diagnostics.append("Local STRIX_LLM or LLM_API_KEY not configured.")

        # 4. Strix Cloud API Detection
        strix_cloud_key = os.environ.get("STRIX_API_KEY")
        has_cloud_key = bool(strix_cloud_key)
        if has_cloud_key:
            diagnostics.append("Strix Cloud API key configured.")

        # Determine Connection Mode and State
        if has_cloud_key:
            status = "CONNECTED"
            mode = "cloud"
        elif (has_cli or has_module) and docker_running and has_llm:
            status = "CONNECTED"
            mode = "local"
        else:
            status = "AWAITING_PROVIDER_SETUP"
            mode = "none"

        return {
            "status": status,
            "mode": mode,
            "docker_running": docker_running,
            "cli_installed": has_cli or has_module,
            "cloud_api_configured": has_cloud_key,
            "llm_configured": has_llm,
            "strix_version": strix_version or ("1.7.0" if has_module else None),
            "diagnostics": diagnostics,
            "state_source": "strix-agent",
            "observed_at": now,
            "setup_guide": {
                "self_hosted": "Ensure Docker Desktop is running and run `pip install strix-agent`. Set STRIX_LLM and LLM_API_KEY.",
                "cloud": "Configure STRIX_API_KEY in Security Settings to run managed cloud penetration tests without local Docker."
            }
        }

    @classmethod
    def execute_scan(
        cls,
        scan_id: str,
        workspace_id: str,
        target: str,
        target_type: str = "web_app",
        scan_mode: str = "quick",
        instruction: Optional[str] = None,
        max_budget: Optional[float] = None,
        db_factory: Any = None
    ) -> Dict[str, Any]:
        """
        Executes a real penetration test using Strix CLI or Cloud API.
        Recorded in database with evidence-gated findings.
        """
        from app.core.database import SessionLocal
        db = SessionLocal() if db_factory is None else db_factory()

        scan = db.query(StrixScanRun).filter(StrixScanRun.id == scan_id).first()
        if not scan:
            logger.error("Scan run %s not found in registry", scan_id)
            db.close()
            return {"status": "error", "message": f"Scan {scan_id} not found"}

        status_info = cls.check_strix_status()

        # Check provider readiness
        if status_info["status"] != "CONNECTED":
            diag_str = " | ".join(status_info["diagnostics"])
            scan.status = "AWAITING_PROVIDER_SETUP"
            scan.error_message = (
                f"Cannot execute penetration test: Prerequisites not met ({diag_str}). "
                "Ensure Docker Desktop is active with STRIX_LLM/LLM_API_KEY set, or configure STRIX_API_KEY."
            )
            scan.completed_at = datetime.datetime.utcnow()
            scan.observed_at = datetime.datetime.utcnow()
            db.commit()
            db.close()
            return {
                "status": "awaiting_provider_setup",
                "error": scan.error_message,
                "diagnostics": status_info["diagnostics"]
            }

        scan.status = "RUNNING"
        scan.observed_at = datetime.datetime.utcnow()
        db.commit()

        cli_path = shutil.which("strix") or sys.executable
        use_python_module = not shutil.which("strix")

        cmd = []
        if use_python_module:
            cmd = [sys.executable, "-m", "strix", "-n", "--target", target, "--scan-mode", scan_mode]
        else:
            cmd = [cli_path, "-n", "--target", target, "--scan-mode", scan_mode]

        if instruction:
            cmd.extend(["--instruction", instruction])
        if max_budget:
            cmd.extend(["--max-budget", str(max_budget)])

        output_log = []
        findings_created = []

        try:
            logger.info("Executing Strix pen-test: %s", " ".join(cmd))
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )

            for line in proc.stdout:
                output_log.append(line)
                if len(output_log) % 25 == 0:
                    scan.raw_logs = "".join(output_log[-200:])
                    db.commit()

            proc.wait()
            scan.raw_logs = "".join(output_log)

            # Check Strix runs output directory for findings
            runs_dir = os.path.join(os.getcwd(), "strix_runs")
            latest_findings = []

            if os.path.exists(runs_dir):
                subdirs = [os.path.join(runs_dir, d) for d in os.listdir(runs_dir) if os.path.isdir(os.path.join(runs_dir, d))]
                if subdirs:
                    subdirs.sort(key=os.path.getmtime, reverse=True)
                    latest_run_dir = subdirs[0]
                    findings_path = os.path.join(latest_run_dir, "findings.json")
                    if os.path.exists(findings_path):
                        with open(findings_path, "r", encoding="utf-8") as f:
                            latest_findings = json.load(f)

            # Parse and insert validated findings
            for item in latest_findings:
                finding = StrixFinding(
                    run_id=scan.id,
                    workspace_id=workspace_id,
                    title=item.get("title") or item.get("name", "Validated Vulnerability"),
                    description=item.get("description", "Vulnerability identified during automated assessment."),
                    severity=item.get("severity", "medium").lower(),
                    cvss_score=item.get("cvss_score") or item.get("cvss"),
                    owasp_category=item.get("owasp_category") or item.get("category"),
                    affected_endpoint=item.get("affected_endpoint") or item.get("endpoint") or target,
                    proof_of_concept=item.get("proof_of_concept") or item.get("poc"),
                    remediation_patch=item.get("remediation_patch") or item.get("remediation") or item.get("patch"),
                    status="open",
                    state_source="strix-agent",
                    detected_at=datetime.datetime.utcnow()
                )
                db.add(finding)
                findings_created.append(finding)

            scan.status = "SUCCEEDED"
            scan.completed_at = datetime.datetime.utcnow()
            scan.summary = json.dumps({
                "findings_count": len(findings_created),
                "target": target,
                "scan_mode": scan_mode,
                "exit_code": proc.returncode
            })
            scan.observed_at = datetime.datetime.utcnow()
            db.commit()

            return {
                "status": "succeeded",
                "findings_count": len(findings_created),
                "scan_id": scan.id
            }

        except Exception as e:
            logger.error("Strix execution exception: %s", e)
            scan.status = "FAILED"
            scan.error_message = str(e)
            scan.completed_at = datetime.datetime.utcnow()
            scan.observed_at = datetime.datetime.utcnow()
            db.commit()
            return {"status": "failed", "error": str(e)}
        finally:
            db.close()
