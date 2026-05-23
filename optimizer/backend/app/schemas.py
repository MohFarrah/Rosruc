from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"


class IntentResponse(BaseModel):
    id: str
    source: str
    ticket_id: str
    title: str
    body: str
    pr_id: str
    pr_title: str
    pr_diff_files: list[str]
    created_at: datetime | None = None


class AnalysisResponse(BaseModel):
    id: str
    intent_id: str
    primary_services: list[str]
    dependent_services: list[str]
    skipped_services: list[str]
    skipped_test_suites: list[str]
    confidence: float
    rationale: str
    cache_hit: bool = False
    created_at: datetime | None = None


class PlanResponse(BaseModel):
    id: str
    analysis_id: str
    intent_id: str | None = None
    baseline_minutes: float
    optimized_minutes: float
    minutes_saved: float
    dollars_saved: float
    yaml: str
    approved: bool = False
    approved_at: datetime | None = None


class ExecutionJobResponse(BaseModel):
    id: str
    execution_id: str
    service: str
    kind: str
    status: str
    duration_seconds_estimated: int
    duration_seconds_actual: int | None = None
    skipped_reason: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class ExecutionResponse(BaseModel):
    id: str
    plan_id: str
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    jobs: list[ExecutionJobResponse] = Field(default_factory=list)


class AggregateSavingsResponse(BaseModel):
    hours_saved: float
    dollars_saved: float
    runs_count: int
    sparkline: list[float] = Field(default_factory=list)
