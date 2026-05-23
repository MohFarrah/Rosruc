import hashlib
import json
import sys
from pathlib import Path

OPTIMIZER_ROOT = Path(__file__).resolve().parents[3]
AI_ROOT = OPTIMIZER_ROOT / "ai"
if str(OPTIMIZER_ROOT) not in sys.path:
    sys.path.insert(0, str(OPTIMIZER_ROOT))


class OrchestratorUnavailable(Exception):
    pass


def intent_hash(intent: dict) -> str:
    payload = intent.get("body", "") + json.dumps(intent.get("pr_diff_files", []), sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def run(intent: dict, services_manifest: list[dict], cache_key: str) -> dict:
    try:
        from ai.orchestrator import run as ai_run

        return await ai_run(intent, services_manifest, cache_key)
    except Exception as exc:
        raise OrchestratorUnavailable(str(exc)) from exc


def manifest_fallback(intent: dict, services_manifest: list[dict]) -> dict:
    from app.services.manifest import dependents_of, services_for_paths

    primary = [service["name"] for service in services_for_paths(intent.get("pr_diff_files", []))]
    dependent: list[str] = []
    for name in primary:
        dependent.extend(dependents_of(name))
    dependent = sorted(set(dependent) - set(primary))
    all_names = {service["name"] for service in services_manifest}
    impacted = set(primary) | set(dependent)
    skipped = sorted(all_names - impacted)

    return {
        "analysis": {
            "intent_id": intent["id"],
            "primary_services": primary,
            "dependent_services": dependent,
            "skipped_services": skipped,
            "skipped_test_suites": [],
            "confidence": 0.99,
            "rationale": "Manifest-only fallback: matched diff paths and declared dependents.",
        },
        "optimization": {
            "build_order": primary + dependent,
            "parallel_groups": [primary, dependent] if dependent else [primary],
            "test_strategy": {},
            "skip_reasons": {name: "No manifest impact detected" for name in skipped},
            "runner_size": "small",
            "confidence": 0.99,
        },
        "cache_hit": False,
        "stages": [],
    }
