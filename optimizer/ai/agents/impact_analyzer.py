"""ImpactAnalyzer agent stub."""

from ai.schemas import Analysis


async def analyze_impact(parsed_intent: dict, services_manifest: list[dict], intent: dict) -> Analysis:
    primary = ["payments"]
    dependent = ["notifications", "ledger"]
    all_names = {service["name"] for service in services_manifest}
    skipped = sorted(all_names - set(primary) - set(dependent))

    return Analysis(
        intent_id=intent["id"],
        primary_services=primary,
        dependent_services=dependent,
        skipped_services=skipped,
        skipped_test_suites=["frontend.unit", "frontend.e2e", "auth.integration", "ml.smoke"],
        confidence=0.91,
        rationale=(
            "Diff scoped to services/payments/. Manifest declares notifications and ledger "
            "consume payments via events. No frontend or auth surface touched."
        ),
    )
