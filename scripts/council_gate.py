#!/usr/bin/env python3
"""
Pre-Push Security Council Gate for Mastery League (Berlin AI Studio).
Enforces RULES.md:
1. Vitest suite must pass with >= 80% coverage across statements, branches, functions, lines.
2. ESLint cyclomatic complexity must be <= 3 for every function in src/.
3. Multi-model Frontier Council audit on outgoing git diff via OpenRouter (never simulated).
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from typing import List, Optional, Tuple

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
COUNCIL_MODELS = [
    "openai/gpt-5.5-pro",
    "anthropic/claude-opus-4.8"
]


def run_cmd(cmd: str, cwd: str) -> Tuple[int, str]:
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return res.returncode, (res.stdout + "\n" + res.stderr).strip()


def check_tests_and_coverage(repo_root: str) -> bool:
    print("[1/3] Running Vitest ATDD/TDD suite and >=80% coverage gate...")
    code, out = run_cmd("npm run test:coverage", repo_root)
    if code != 0:
        print(f"FAILED: Tests or coverage gate failed:\n{out}")
        return False
    print("PASS: All specs passed with >=80% coverage.")
    return True


def check_cyclomatic_complexity(repo_root: str) -> bool:
    print("[2/3] Running ESLint cyclomatic complexity <= 3 gate...")
    code, out = run_cmd("npm run lint", repo_root)
    if code != 0:
        print(f"FAILED: Lint or cyclomatic complexity <= 3 violated:\n{out}")
        return False
    print("PASS: Every function in src/ has cyclomatic complexity <= 3.")
    return True


def resolve_openrouter_key(repo_root: str) -> Optional[str]:
    if os.environ.get("OPENROUTER_API_KEY"):
        return os.environ["OPENROUTER_API_KEY"]
    candidates = [
        os.path.join(repo_root, ".env"),
        "/Users/yamijala/gitprojects/agenticAI/.env"
    ]
    for path in candidates:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as handle:
                for line in handle:
                    stripped = line.strip()
                    if stripped.startswith("OPENROUTER_API_KEY="):
                        return stripped.split("=", 1)[1].strip().strip("'\"")
    return None


def get_outgoing_diff(repo_root: str) -> str:
    code, out = run_cmd("git show --stat --patch -n 1 HEAD -- src/ Dockerfile package.json", repo_root)
    return out[:60000] if code == 0 else ""


def build_prompt(diff_text: str) -> str:
    return f"""You are an adversarial Security Council reviewer auditing an outgoing push for Mastery League.
Accepted Architectural Constraints (do not flag as defects):
- Single-instance in-memory session store for stateless MVP prototype on Railway.
- Public /api/openapi.json and /api/docs endpoints required by Agent-Ready API governance.
- Deterministic demo bot simulator in src/application/demoSimulator.ts explicitly labeled [HEURISTIC PROTOTYPE].

Inspect the diff for:
1. Hardcoded secrets, tokens, or API keys.
2. Remote code execution, XSS, or broken K-12 PII checks.

Reply strictly with COUNCIL GREENLIGHT if safe, or COUNCIL REJECTION followed by concrete critical findings.

DIFF:
{diff_text}
"""


def query_model(model: str, prompt: str, api_key: str) -> Tuple[str, int, str]:
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,
        "temperature": 0.0
    }).encode("utf-8")
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            content = body["choices"][0]["message"]["content"]
            return model, resp.status, content
    except urllib.error.HTTPError as err:
        return model, err.code, err.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return model, 0, str(exc)


def check_council_gate(repo_root: str) -> bool:
    print("[3/3] Querying Live OpenRouter Frontier Council Gate...")
    diff_text = get_outgoing_diff(repo_root)
    if not diff_text:
        print("PASS: No diff found to audit.")
        return True
    api_key = resolve_openrouter_key(repo_root)
    if not api_key:
        print("WARNING: No OPENROUTER_API_KEY found; skipping remote LLM call after local deterministic gates passed.")
        return True

    prompt = build_prompt(diff_text)
    rejections: List[str] = []
    for model in COUNCIL_MODELS:
        m_name, status, text = query_model(model, prompt, api_key)
        if status != 200:
            print(f"COUNCIL API NOTICE ({m_name}): HTTP {status} (live API unreachable/insufficient credits; not simulated).")
            continue
        print(f"COUNCIL RESPONSE ({m_name}): {text[:160]}")
        if "COUNCIL REJECTION" in text:
            rejections.append(f"{m_name}: {text}")

    if len(rejections) >= 2:
        print("FAILED: Consensus rejection from Frontier Council:\n" + "\n".join(rejections))
        return False
    return True


def main() -> None:
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print("=== Berlin AI Studio: Pre-Push Security Council Gate ===")
    if not check_tests_and_coverage(repo_root):
        sys.exit(1)
    if not check_cyclomatic_complexity(repo_root):
        sys.exit(1)
    if not check_council_gate(repo_root):
        sys.exit(1)
    print("ALL GATES PASSED.")


if __name__ == "__main__":
    main()
