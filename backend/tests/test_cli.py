"""
Aravanta Cloud OS — CLI Unit & Integration Tests
Tests CLI argument parsing, formatters, and command execution.
"""
import sys
import subprocess
from pathlib import Path
import pytest

CLI_PATH = Path(__file__).resolve().parent.parent.parent / "cli" / "aravanta.py"


def test_cli_version_flag():
    result = subprocess.run([sys.executable, str(CLI_PATH), "--version"], capture_output=True, text=True)
    assert result.returncode == 0
    assert "aravanta-cli 1.0.0" in result.stdout or "aravanta-cli 1.0.0" in result.stderr


def test_cli_help_flag():
    result = subprocess.run([sys.executable, str(CLI_PATH), "--help"], capture_output=True, text=True)
    assert result.returncode == 0
    assert "usage: aravanta" in result.stdout
    assert "auth" in result.stdout
    assert "org" in result.stdout
    assert "project" in result.stdout
    assert "compute" in result.stdout
    assert "resource" in result.stdout


def test_cli_parser_subcommands():
    sys.path.insert(0, str(CLI_PATH.parent))
    import aravanta

    parser = aravanta.build_parser()
    
    # Test version command
    args = parser.parse_args(["version"])
    assert args.command == "version"

    # Test org create
    args = parser.parse_args(["org", "create", "--name", "Test Org", "--slug", "test-org"])
    assert args.command == "org"
    assert args.org_action == "create"
    assert args.name == "Test Org"

    # Test compute create
    args = parser.parse_args(["compute", "create", "--name", "worker-01", "--cpu", "4", "--ram", "8192", "--json"])
    assert args.command == "compute"
    assert args.compute_action == "create"
    assert args.name == "worker-01"
    assert args.cpu == 4
    assert args.ram == 8192
    assert args.json is True


def test_cli_format_output(capsys):
    sys.path.insert(0, str(CLI_PATH.parent))
    import aravanta

    test_data = [{"id": "res-1", "name": "web-node", "status": "RUNNING"}]

    # Test JSON formatting
    aravanta.format_output(test_data, "json")
    captured = capsys.readouterr()
    assert '"id": "res-1"' in captured.out
    assert '"name": "web-node"' in captured.out

    # Test Table formatting
    aravanta.format_output(test_data, "table")
    captured = capsys.readouterr()
    assert "ID" in captured.out
    assert "NAME" in captured.out
    assert "STATUS" in captured.out
    assert "web-node" in captured.out

    # Test YAML formatting
    aravanta.format_output(test_data[0], "yaml")
    captured = capsys.readouterr()
    assert "id: res-1" in captured.out
    assert "status: RUNNING" in captured.out
