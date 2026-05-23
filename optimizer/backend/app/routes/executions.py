from fastapi import APIRouter

router = APIRouter(prefix="/executions", tags=["executions"])


@router.get("/{execution_id}")
def get_execution(execution_id: str) -> dict:
    return {"message": "Execution endpoint stub", "execution_id": execution_id, "status": "queued", "jobs": []}
