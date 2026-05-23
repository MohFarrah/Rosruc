from fastapi import APIRouter

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.post("/{analysis_id}/plan")
def create_plan(analysis_id: str) -> dict:
    return {"message": "Plan endpoint stub", "analysis_id": analysis_id}
