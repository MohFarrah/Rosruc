---
name: backend execution plan
overview: Backend + database execution plan for the Intent-Aware CI/CD Optimizer hackathon. Owns FastAPI service, SQLite schema, all REST endpoints, repo manifest loader, YAML generator, savings calculator, simulated executor, and the integration seam to the AI orchestrator. Follows the JSON contracts frozen in the master plan.
todos:
  - id: be-h0-scaffold
    content: "H0:30–H2:00: Scaffold FastAPI app, SQLAlchemy models, init_db, health + intents read endpoints, manifest loader"
    status: pending
  - id: be-h2-stubs
    content: "H2:00–H4:00: Stubbed analyze/plan/execute endpoints + working executor state machine on fixture data"
    status: pending
  - id: be-h4-orchestrator-seam
    content: "H4:00–H6:00: Wire orchestrator_seam to AI engineer module + deterministic fallback path + real savings math"
    status: pending
  - id: be-h6-yaml-savings
    content: "H6:00–H8:00: Jinja2 YAML generator with skipped jobs as commented blocks + /savings/aggregate with sparkline"
    status: pending
  - id: be-h8-polish
    content: "H8:00–H12:00: Tune executor SPEED_FACTOR + jitter, add /demo/reset and /demo/seed-savings endpoints, performance pass"
    status: pending
  - id: be-h12-rehearse
    content: "H12:00–H14:00: 3 full demo runs with frontend, verify OpenAI-disabled fallback path works"
    status: pending
  - id: be-h15-freeze
    content: "H15:00–H16:00: Demo freeze. No code changes."
    status: pending
isProject: false
---

# Backend + Database Execution Plan

You own everything from the wire down. The frontend renders what you serve. The AI engineer hands you a Python module you call. Contracts are frozen in the master plan — do not deviate without group sign-off.

## Scope

You own:
- FastAPI service under `optimizer/backend/`
- SQLite schema, SQLAlchemy models, seed data
- All REST endpoints matching the master-plan contracts
- Repo manifest loader (`service_graph.json` parsing + lookup)
- Jinja2 GitHub Actions YAML generator
- Savings calculator (baseline minus optimized, $ math)
- Simulated executor (animated job state machine)
- Approval workflow endpoint
- Integration seam to AI orchestrator (you call, they implement)

You do NOT own:
- LLM prompts, schemas, or OpenAI calls (AI engineer)
- Any UI (frontend engineer)
- Real CI runners, real Docker, real GitHub OAuth (none of us)

## Folder Structure

```
optimizer/backend/
  app/
    __init__.py
    main.py                  # FastAPI app, CORS, router include
    config.py                # env, paths, pricing constants
    db.py                    # engine, session, init_db()
    models.py                # SQLAlchemy ORM models
    schemas.py               # Pydantic request/response models
    routes/
      __init__.py
      health.py
      intents.py
      analyses.py
      plans.py
      executions.py
      savings.py
    services/
      manifest.py            # loads + queries service_graph.json
      yaml_gen.py            # Jinja2 -> GitHub Actions YAML
      savings.py             # baseline vs optimized math
      executor.py            # simulated job runner (in-memory state machine)
      orchestrator_seam.py   # thin wrapper that imports AI engineer's module
    templates/
      optimized_ci.yml.j2    # Jinja2 template for generated YAML
  tests/                      # smoke only, optional
  requirements.txt
  run_dev.sh                  # uvicorn app.main:app --reload --port 8000
```

Place demo fixtures and the monorepo manifest at `optimizer/demo/` (shared with frontend and AI):
```
optimizer/demo/
  monorepo/
    service_graph.json
    services/payments/...    # stub files only
    services/auth/...
    ... (8 services total)
  intents/INT-101.json        # 3 of these
  prs/PR-2031.json            # 3 of these
```

## Database Schema (SQLite via SQLAlchemy)

Single file `optimizer.db`. `init_db()` creates tables on startup; seed from `optimizer/demo/intents/*.json` and `prs/*.json` if tables empty.

Tables:
- `intents` — id (str PK, e.g. `INT-101`), source, ticket_id, title, body, pr_id, pr_title, pr_diff_files (JSON), created_at.
- `services` — name (str PK), description, paths (JSON), test_suites (JSON), depends_on (JSON), consumed_by (JSON), baseline_build_seconds (int), baseline_test_seconds (int), dockerfile (str). Loaded once from `service_graph.json` on startup.
- `analyses` — id (PK), intent_id (FK), primary_services (JSON), dependent_services (JSON), skipped_services (JSON), skipped_test_suites (JSON), confidence (float), rationale (text), cache_hit (bool), created_at.
- `plans` — id (PK), analysis_id (FK), baseline_minutes (float), optimized_minutes (float), minutes_saved (float), dollars_saved (float), yaml (text), approved (bool), approved_at (datetime).
- `executions` — id (PK), plan_id (FK), status (queued|running|completed), started_at, completed_at.
- `execution_jobs` — id (PK), execution_id (FK), service (str), kind (build|test), status (queued|running|success|skipped|failed), duration_seconds_estimated (int), duration_seconds_actual (int), skipped_reason (str nullable), started_at, completed_at.
- `savings_events` — id (PK), plan_id (FK), minutes_saved (float), dollars_saved (float), created_at. Aggregate counter on dashboard reads `SUM(*)` from this table plus a hardcoded seed.

Seed values for the aggregate counter (so the dashboard never starts at zero):
- 47.3 hours saved baseline
- $189.12 saved baseline
- These are added to `SUM(savings_events.*)` at query time, NOT inserted as rows. Document this clearly.

## REST Endpoints

Base URL: `http://localhost:8000`. Enable CORS for `http://localhost:5173` (Vite default).

- `GET /health` — `{ "status": "ok" }`
- `GET /intents` — list all intents from DB. Returns array of intent records.
- `GET /intents/{id}` — single intent.
- `POST /intents/{id}/analyze` — runs the AI orchestrator. Body optional (override flags). Returns `Analysis` record. Internally:
  1. Compute `intent_hash = sha256(intent.body + json.dumps(pr_diff_files))`.
  2. Call `orchestrator_seam.run(intent, services_manifest, intent_hash)` — AI engineer's entry point.
  3. Persist `Analysis`, return.
- `POST /analyses/{id}/plan` — generate optimization plan from analysis. Calls `savings.compute()` + `yaml_gen.render()`. Persists `Plan`, returns it.
- `POST /plans/{id}/approve` — sets `approved = true, approved_at = now()`. Returns updated plan.
- `POST /plans/{id}/execute` — creates `Execution` + N `ExecutionJob` rows in `queued` state. Kicks off `executor.start(execution_id)`. Returns execution_id.
- `GET /executions/{id}` — current status of execution + all jobs. Frontend polls this every 500ms during demo.
- `GET /savings/aggregate` — returns `{ "hours_saved": 47.3 + delta, "dollars_saved": 189.12 + delta, "runs_count": N, "sparkline": [...] }`. Sparkline = last 10 plans' `minutes_saved` values for recharts.

## Service Manifest Loader

`services/manifest.py`:
- On startup, load `optimizer/demo/monorepo/service_graph.json` into memory.
- Expose:
  - `all_services() -> list[Service]`
  - `get_service(name)`
  - `services_for_paths(paths: list[str]) -> list[Service]` — string-prefix match each diff file path against `service.paths` entries. This is the deterministic part of impact analysis. AI fills in the gaps.
  - `dependents_of(service_name) -> list[str]` — flatten `consumed_by`.

This is the FIRST function the AI engineer's ImpactAnalyzer calls. Get it right early.

## YAML Generator

`services/yaml_gen.py` + `templates/optimized_ci.yml.j2`. Renders a GitHub Actions workflow with:
- One `build-{service}` job per `primary_services + dependent_services`.
- One `test-{service}` job per impacted service that has tests.
- Skipped services rendered as commented-out blocks with a `# SKIPPED: <reason>` line — judges can scroll the YAML and see exactly what was pruned.
- Validate output with `yaml.safe_load(rendered)` before returning. If parse fails, raise loudly. Do NOT attempt to make it executable on a real GitHub Actions runner.

Template sketch (lives in `templates/optimized_ci.yml.j2`):
```yaml
name: optimized-ci
on: [pull_request]
jobs:
{% for svc in run_services %}
  build-{{ svc.name }}:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/build.sh {{ svc.name }}
{% endfor %}
{% for svc in skipped_services %}
  # SKIPPED build-{{ svc.name }}: {{ skip_reason[svc.name] }}
{% endfor %}
```

## Savings Calculator

`services/savings.py`:
- `baseline_minutes = sum(s.baseline_build_seconds + s.baseline_test_seconds for s in ALL services) / 60`
- `optimized_minutes = sum(...) for s in (primary_services + dependent_services)) / 60`
- `minutes_saved = baseline_minutes - optimized_minutes`
- `dollars_saved = minutes_saved * 0.12` (constant in `config.py`)
- Always emit a `savings_events` row when a plan is approved+executed (so the aggregate counter ticks).

## Simulated Executor

`services/executor.py` is the visual centerpiece — make this feel alive.

State machine per `ExecutionJob`:
- queued → running (after a small per-job stagger) → success | skipped
- Skipped jobs flip to `skipped` instantly with `skipped_reason` populated.
- Running jobs hold for `duration_seconds_estimated * SPEED_FACTOR`. Set `SPEED_FACTOR = 0.05` so a 220-second test "completes" in ~11 seconds for a punchy demo.
- Implementation: a single `asyncio.create_task(_run_execution(execution_id))` background task that mutates DB rows over time. Use SQLAlchemy with sync sessions inside `asyncio.to_thread` to keep it simple. Frontend polls `GET /executions/{id}`.

Visualizable jitter: add ±10% random jitter to per-job durations so the dashboard feels organic.

## AI Orchestrator Seam

`services/orchestrator_seam.py` is the integration boundary. Define it FIRST so the AI engineer can deliver against it:

```python
def run(intent: dict, services_manifest: list[dict], intent_hash: str) -> dict:
    """
    Returns an Analysis dict matching the master-plan schema.
    Implemented by the AI engineer in optimizer/ai/orchestrator.py.
    Caches by intent_hash to optimizer/ai/cache/{intent_hash}.json.
    """
```

The seam itself just imports and calls. If the AI module raises or is unavailable, fall back to a deterministic stub: every diff path is matched via `manifest.services_for_paths`, dependents are flattened, everything else is skipped, confidence is fixed at 0.99, rationale is "manifest-only fallback." This guarantees the demo runs even if OpenAI is down.

## Demo Reliability Guardrails

- Wrap every endpoint with structured error JSON: `{ "error": "...", "code": "..." }`. Never let a 500 reach the UI.
- Log every request to a rotating file `optimizer/backend/server.log` — useful for live debugging during the demo.
- Add a `POST /demo/reset` endpoint that wipes `analyses`, `plans`, `executions`, `execution_jobs`, `savings_events` and re-seeds intents. One-button reset between rehearsal runs.
- Add a `POST /demo/seed-savings` endpoint that bumps the aggregate counter by a configurable delta — emergency lever if the counter ever looks too low on stage.

## Hour-by-Hour Tasks

H0:00–H0:30 — sync with team, lock contracts (master plan section).

H0:30–H2:00:
- `pip install fastapi uvicorn[standard] sqlalchemy pydantic jinja2 pyyaml`
- Scaffold folder structure above.
- `db.py` + `models.py` + `init_db()`.
- `GET /health`, `GET /intents`, `GET /intents/{id}` working off seeded fixtures.
- Manifest loader returns services from `service_graph.json`.

H2:00–H4:00:
- `POST /intents/{id}/analyze` returns hardcoded fixture analysis (matches master-plan schema). No AI yet.
- `POST /analyses/{id}/plan` returns hardcoded plan with stub YAML.
- `POST /plans/{id}/execute` creates an execution + jobs, kicks off executor.
- `GET /executions/{id}` returns live state.
- Frontend should now have a complete demo on stubs.

H4:00–H6:00:
- Wire `orchestrator_seam.run()` to AI engineer's module.
- Implement deterministic fallback path.
- `savings.compute()` real math from manifest.

H6:00–H8:00:
- `yaml_gen.render()` with Jinja2 template, validated parseable.
- Replace stub plans with real generated ones.
- `GET /savings/aggregate` real, with sparkline data.

H8:00–H12:00:
- Tune executor timing — SPEED_FACTOR, jitter — until visually satisfying.
- `POST /demo/reset` endpoint.
- `POST /demo/seed-savings` endpoint.
- Performance pass: ensure `GET /executions/{id}` returns in <50ms even when polled at 2Hz.

H12:00–H14:00:
- Run with frontend through full demo flow 3+ times.
- Fix every bug surfaced.
- Confirm cache fallback works when OpenAI is force-disabled (toggle env var).

H14:00–H15:00 — buffer.

H15:00–H16:00 — DEMO FREEZE. No code changes.

## Cursor / AI Tooling Recommendations

- Use Cursor agent mode for the boilerplate: SQLAlchemy models, Pydantic schemas, route stubs. Prompt: "Generate FastAPI routes for these Pydantic models matching the master plan contracts" — pin the contracts file as context.
- Use Codex / Claude Opus directly for the executor state machine — that one needs careful design and is worth a dedicated planning prompt.
- Use Cursor inline edits for the Jinja2 template — iterate on YAML output until it looks like a real `.github/workflows/ci.yml`.
- Skip writing tests. Smoke test by hitting endpoints with the frontend and a saved Postman/Bruno collection.

## Risk Reduction (Backend-Specific)

- The executor running async background tasks inside FastAPI is the most common bug source. Test the full execution → polling loop by H4.
- SQLAlchemy + asyncio + SQLite is finicky. Use sync engine + `asyncio.to_thread` for executor work — do NOT mix `aiosqlite` and sync engines in the same process.
- Hardcode `optimizer.db` path absolute (in `config.py`) so it doesn't move when the working directory changes during dev.
- The manifest is the single most important file in this codebase. Validate it loads and round-trips on startup. If it fails, refuse to boot — don't let a bad manifest poison runtime.

## Definition of Done (your slice)

- All 9 endpoints respond with master-plan-compliant JSON.
- Demo can be reset to clean state in one click.
- Aggregate savings counter increases visibly after each approved+executed plan.
- Generated YAML parses with `yaml.safe_load` and visibly shows skipped jobs as commented blocks.
- Executor animation feels live (5–15 seconds per job under SPEED_FACTOR=0.05).
- Demo runs end-to-end with OpenAI disabled (deterministic fallback path).