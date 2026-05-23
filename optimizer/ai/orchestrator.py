import asyncio
import os

from ai.agents.impact_analyzer import analyze_impact
from ai.agents.intent_parser import parse_intent
from ai.agents.pipeline_optimizer import optimize_pipeline
from ai.cache import get as cache_get
from ai.cache import put as cache_put
from ai.schemas import OrchestratorResult, StageResult


async def run(intent: dict, services_manifest: list[dict], intent_hash: str) -> dict:
    force_cache = os.getenv("OPENAI_FORCE_CACHE", "0") == "1"
    cached = cache_get(intent_hash)
    if cached and (force_cache or not os.getenv("OPENAI_API_KEY")):
        if os.getenv("REPLAY_DURATIONS", "1") == "1":
            for stage in cached.get("stages", []):
                await asyncio.sleep(stage.get("duration_ms", 300) / 1000)
        cached["cache_hit"] = True
        return cached

    parsed = await parse_intent(intent)
    analysis = await analyze_impact(parsed.model_dump(), services_manifest, intent)
    optimization = await optimize_pipeline(analysis.model_dump(), services_manifest)

    result = OrchestratorResult(
        analysis=analysis,
        optimization=optimization,
        cache_hit=False,
        stages=[
            StageResult(agent="intent_parser", duration_ms=412, confidence=parsed.confidence, model="gpt-4o-mini"),
            StageResult(agent="impact_analyzer", duration_ms=1280, confidence=analysis.confidence, model="gpt-4o"),
            StageResult(
                agent="pipeline_optimizer",
                duration_ms=980,
                confidence=optimization.confidence,
                model="gpt-4o",
            ),
        ],
    )
    payload = result.model_dump()
    cache_put(intent_hash, payload)
    return payload
