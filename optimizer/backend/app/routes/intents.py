import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import INTENTS_DIR
from app.schemas import IntentResponse

router = APIRouter(prefix="/intents", tags=["intents"])


def _load_intent(path: Path) -> IntentResponse:
    data = json.loads(path.read_text(encoding="utf-8"))
    return IntentResponse(**data)


@router.get("", response_model=list[IntentResponse])
def list_intents() -> list[IntentResponse]:
    if not INTENTS_DIR.exists():
        return []
    intents = sorted(INTENTS_DIR.glob("*.json"))
    return [_load_intent(path) for path in intents]


@router.get("/{intent_id}", response_model=IntentResponse)
def get_intent(intent_id: str) -> IntentResponse:
    path = INTENTS_DIR / f"{intent_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Intent not found")
    return _load_intent(path)


@router.post("/{intent_id}/analyze")
def analyze_intent(intent_id: str) -> dict:
    path = INTENTS_DIR / f"{intent_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Intent not found")
    return {
        "message": "Analyze endpoint stub — wire orchestrator_seam in H4",
        "intent_id": intent_id,
    }
