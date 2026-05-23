"""IntentParser agent stub."""

from ai.schemas import ParsedIntent


async def parse_intent(intent: dict) -> ParsedIntent:
    return ParsedIntent(
        summary=intent.get("title", "Untitled intent"),
        domain_concepts=["retry", "payments"],
        code_areas=intent.get("pr_diff_files", []),
        change_kind="bugfix",
        risk_signals=["customer-impact", "money-flow"],
        confidence=0.96,
    )
