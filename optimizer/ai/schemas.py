from typing import Literal

from pydantic import BaseModel, Field


class ParsedIntent(BaseModel):
    summary: str
    domain_concepts: list[str]
    code_areas: list[str]
    change_kind: Literal["bugfix", "feature", "refactor", "infra", "config", "docs"]
    risk_signals: list[str]
    confidence: float


class Analysis(BaseModel):
    intent_id: str
    primary_services: list[str]
    dependent_services: list[str]
    skipped_services: list[str]
    skipped_test_suites: list[str]
    confidence: float
    rationale: str


class OptimizationPlan(BaseModel):
    build_order: list[str]
    parallel_groups: list[list[str]]
    test_strategy: dict[str, list[str]]
    skip_reasons: dict[str, str]
    runner_size: Literal["small", "large"]
    confidence: float


class StageResult(BaseModel):
    agent: str
    duration_ms: int
    confidence: float
    model: str


class OrchestratorResult(BaseModel):
    analysis: Analysis
    optimization: OptimizationPlan
    cache_hit: bool = False
    stages: list[StageResult] = Field(default_factory=list)
