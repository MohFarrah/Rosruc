from fastapi import APIRouter

from app.schemas import AggregateSavingsResponse

router = APIRouter(prefix="/savings", tags=["savings"])

BASELINE_HOURS_SAVED = 47.3
BASELINE_DOLLARS_SAVED = 189.12


@router.get("/aggregate", response_model=AggregateSavingsResponse)
def aggregate_savings() -> AggregateSavingsResponse:
    return AggregateSavingsResponse(
        hours_saved=BASELINE_HOURS_SAVED,
        dollars_saved=BASELINE_DOLLARS_SAVED,
        runs_count=0,
        sparkline=[],
    )
