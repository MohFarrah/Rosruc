from fastapi import APIRouter

router = APIRouter(prefix="/plans", tags=["plans"])


@router.post("/{plan_id}/approve")
def approve_plan(plan_id: str) -> dict:
    return {"message": "Approve endpoint stub", "plan_id": plan_id, "approved": True}


@router.post("/{plan_id}/execute")
def execute_plan(plan_id: str) -> dict:
    return {"message": "Execute endpoint stub", "plan_id": plan_id}
