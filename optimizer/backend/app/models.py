from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Intent(Base):
    __tablename__ = "intents"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source: Mapped[str] = mapped_column(String, default="jira")
    ticket_id: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(Text)
    pr_id: Mapped[str] = mapped_column(String)
    pr_title: Mapped[str] = mapped_column(String)
    pr_diff_files: Mapped[str] = mapped_column(Text)  # JSON array stored as text for now
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Service(Base):
    __tablename__ = "services"

    name: Mapped[str] = mapped_column(String, primary_key=True)
    description: Mapped[str] = mapped_column(Text)
    paths: Mapped[str] = mapped_column(Text)
    test_suites: Mapped[str] = mapped_column(Text)
    depends_on: Mapped[str] = mapped_column(Text)
    consumed_by: Mapped[str] = mapped_column(Text)
    baseline_build_seconds: Mapped[int] = mapped_column(Integer)
    baseline_test_seconds: Mapped[int] = mapped_column(Integer)
    dockerfile: Mapped[str] = mapped_column(String)


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    intent_id: Mapped[str] = mapped_column(String)
    primary_services: Mapped[str] = mapped_column(Text)
    dependent_services: Mapped[str] = mapped_column(Text)
    skipped_services: Mapped[str] = mapped_column(Text)
    skipped_test_suites: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    rationale: Mapped[str] = mapped_column(Text)
    cache_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    analysis_id: Mapped[str] = mapped_column(String)
    baseline_minutes: Mapped[float] = mapped_column(Float)
    optimized_minutes: Mapped[float] = mapped_column(Float)
    minutes_saved: Mapped[float] = mapped_column(Float)
    dollars_saved: Mapped[float] = mapped_column(Float)
    yaml: Mapped[str] = mapped_column(Text)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    plan_id: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="queued")
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ExecutionJob(Base):
    __tablename__ = "execution_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    execution_id: Mapped[str] = mapped_column(String)
    service: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="queued")
    duration_seconds_estimated: Mapped[int] = mapped_column(Integer)
    duration_seconds_actual: Mapped[int | None] = mapped_column(Integer, nullable=True)
    skipped_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class SavingsEvent(Base):
    __tablename__ = "savings_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    plan_id: Mapped[str] = mapped_column(String)
    minutes_saved: Mapped[float] = mapped_column(Float)
    dollars_saved: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
