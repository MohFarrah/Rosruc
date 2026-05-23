from app.config import COMPUTE_COST_PER_MINUTE
from app.services.manifest import all_services


def compute_savings(primary_services: list[str], dependent_services: list[str]) -> dict[str, float]:
    impacted = set(primary_services) | set(dependent_services)
    baseline_seconds = 0
    optimized_seconds = 0

    for service in all_services():
        total = service.get("baseline_build_seconds", 0) + service.get("baseline_test_seconds", 0)
        baseline_seconds += total
        if service["name"] in impacted:
            optimized_seconds += total

    baseline_minutes = baseline_seconds / 60
    optimized_minutes = optimized_seconds / 60
    minutes_saved = max(baseline_minutes - optimized_minutes, 0)

    return {
        "baseline_minutes": round(baseline_minutes, 2),
        "optimized_minutes": round(optimized_minutes, 2),
        "minutes_saved": round(minutes_saved, 2),
        "dollars_saved": round(minutes_saved * COMPUTE_COST_PER_MINUTE, 2),
    }
