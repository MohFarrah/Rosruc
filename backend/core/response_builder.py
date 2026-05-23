from typing import Optional

from models.run_result import RunResult


def build_success_response(
    *,
    mode: str,
    interval: str,
    auto: bool,
    before_time: str,
    after_time: str,
    summary: str,
    recommendation: str,
    details: dict,
    notes: Optional[list[str]] = None,
) -> dict:
    return RunResult(
        status="success",
        mode=mode,
        interval=interval,
        auto=auto,
        beforeTime=before_time,
        afterTime=after_time,
        summary=summary,
        recommendation=recommendation,
        details=details,
        notes=notes or [],
    ).to_dict()
