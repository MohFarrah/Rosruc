---
name: ai execution plan
overview: AI engineer execution plan for the Intent-Aware CI/CD Optimizer hackathon. Owns three sequential OpenAI-Structured-Outputs agents (IntentParser, ImpactAnalyzer, PipelineOptimizer), prompts, JSON schemas, confidence scoring, disk-cached fallback, and the orchestrator entry point the backend calls. No LangGraph, no fine-tuning, no model training.
todos:
  - id: ai-h0-fixture-seam
    content: "H0:30–H2:00: Define Pydantic schemas, scaffold optimizer/ai/, hand-craft INT-101 fixture cache file, ship orchestrator.run() skeleton (unblocks backend)"
    status: pending
  - id: ai-h2-intent-parser
    content: "H2:00–H4:00: IntentParser agent live — prompt + few-shot + structured output + cache layer"
    status: pending
  - id: ai-h4-impact-analyzer
    content: "H4:00–H6:00: ImpactAnalyzer with deterministic prefilter + LLM hybrid — iterate prompt across all 3 demo intents until rationale is demo-grade"
    status: pending
  - id: ai-h6-pipeline-optimizer
    content: "H6:00–H8:00: PipelineOptimizer agent + full orchestrator wiring + confidence aggregation + OPENAI_FORCE_CACHE flag"
    status: pending
  - id: ai-h8-end-to-end
    content: "H8:00–H10:00: Run all 3 demo intents end-to-end, capture timings, iterate prompts if outputs not crisp"
    status: pending
  - id: ai-h10-precache
    content: "H10:00–H12:00: Pre-cache + commit all 3 demo intents, verify deterministic-fallback path with API key removed"
    status: pending
  - id: ai-h12-rehearse
    content: "H12:00–H14:00: Demo rehearsal, tune cached duration_ms for demo pacing, lock all caches"
    status: pending
  - id: ai-h15-freeze
    content: "H15:00–H16:00: Demo freeze with OPENAI_FORCE_CACHE=1 set on demo machines"
    status: pending
isProject: false
---

# AI Engineer Execution Plan

You own the intelligence. The backend calls one function and gets a structured result. Everything in between — prompts, schemas, sequencing, caching, fallbacks — is yours.

## Scope

You own:
- `optimizer/ai/` Python module
- 3 sequential agents: IntentParser, ImpactAnalyzer, PipelineOptimizer
- All prompts and OpenAI Structured Output JSON schemas
- Disk caching layer at `optimizer/ai/cache/`
- Confidence scoring per stage
- Orchestrator entry point `run(intent, services_manifest, intent_hash) -> dict`
- Optional embedding-based service matching (nice-to-have)

You do NOT own:
- Anything HTTP, FastAPI, or React
- The `service_graph.json` content (frontend authors it; you consume it)
- Persisting results to SQLite (backend handles that)
- The YAML output (backend's `yaml_gen.py` consumes your `optimization` block)

## Stack (locked)

- Python 3.11
- `openai` SDK ≥ 1.40 (Structured Outputs API)
- `pydantic` v2 for schema definition + validation
- Models:
  - `gpt-4o-mini` for IntentParser (fast, cheap, plenty good)
  - `gpt-4o` for ImpactAnalyzer + PipelineOptimizer (better reasoning over the manifest)
  - `text-embedding-3-small` for optional service matching
- `seed=42` everywhere for reproducibility during rehearsal

NOT using: LangGraph, LangChain, LlamaIndex, AutoGen, CrewAI, Instructor. They are too much abstraction for 16 hours. Three plain async Python functions chained sequentially is the right shape. Use OpenAI's native Structured Outputs (`response_format={"type":"json_schema", ...}`) — that gives you typed JSON without a framework.

## Folder Structure

```
optimizer/ai/
  __init__.py
  orchestrator.py           # run() — backend calls this
  agents/
    intent_parser.py
    impact_analyzer.py
    pipeline_optimizer.py
  prompts/
    intent_parser.system.md
    impact_analyzer.system.md
    pipeline_optimizer.system.md
    fewshot/
      intent_parser.examples.json
      impact_analyzer.examples.json
  schemas.py                # pydantic models for all 3 agents
  cache.py                  # disk cache by intent_hash
  embeddings.py             # optional service matching
  config.py                 # model names, temperature, paths
  cache/                    # gitignored at runtime, committed for demo
    {intent_hash}.json
```

## Orchestrator Contract (the seam to backend)

This signature is FROZEN at H2. Backend's `services/orchestrator_seam.py` calls it.

```python
async def run(
    intent: dict,
    services_manifest: list[dict],
    intent_hash: str,
) -> dict:
    """
    Returns:
      {
        "analysis": { ... master-plan Analysis schema ... },
        "optimization": { ... internal OptimizationPlan, consumed by yaml_gen ... },
        "cache_hit": bool,
        "stages": [
          { "agent": "intent_parser", "duration_ms": 412, "confidence": 0.96, "model": "gpt-4o-mini" },
          { "agent": "impact_analyzer", "duration_ms": 1280, "confidence": 0.91, "model": "gpt-4o" },
          { "agent": "pipeline_optimizer", "duration_ms": 980, "confidence": 0.93, "model": "gpt-4o" }
        ]
      }
    """
```

The `stages` array is what powers the frontend's "AI is thinking…" streaming indicator. Each agent returns its `duration_ms` so the UI can replay them with realistic timing on demo runs.

Cache behavior:
- Compute key from `intent_hash` (already provided by backend).
- On hit: return cached payload, set `cache_hit=True`, replay durations via `asyncio.sleep` if `REPLAY_DURATIONS=True` (env flag — on for demo, off for dev).
- On miss with API key present: run all 3 agents, write cache, return.
- On miss with API key absent or call fails: raise `OrchestratorUnavailable`. Backend catches and falls back to deterministic manifest-only path. Document this loudly.

## Agent 1: IntentParser

Goal: turn raw human/PM language into structured engineering signal.

Input: `{ title, body, pr_title, pr_diff_files }` from the intent record.

Output schema (Pydantic, used as OpenAI Structured Output):
```python
class ParsedIntent(BaseModel):
    summary: str                 # 1-sentence, plain English
    domain_concepts: list[str]   # e.g. ["retry", "debounce", "race-condition"]
    code_areas: list[str]        # echo + cleanup of pr_diff_files
    change_kind: Literal["bugfix", "feature", "refactor", "infra", "config", "docs"]
    risk_signals: list[str]      # e.g. ["customer-impact", "money-flow"]
    confidence: float            # 0.0–1.0
```

System prompt sketch (in `prompts/intent_parser.system.md`):
> You are an engineering intent parser. You read product-management tickets and pull-request metadata and extract structured signals an automated CI/CD optimizer can use. You never invent file paths. You echo the diff paths verbatim. Domain concepts must be 1–3-word noun phrases. Risk signals are drawn from a fixed vocabulary: customer-impact, money-flow, security, data-loss, perf-regression, none. Confidence reflects how unambiguous the ticket and diff are; below 0.7 means the ticket is vague.

2 few-shot examples in `fewshot/intent_parser.examples.json`. One bugfix, one infra change. Few-shot format mirrors the OpenAI structured-output schema exactly.

Model: `gpt-4o-mini`, temperature 0.1, seed 42.

## Agent 2: ImpactAnalyzer

Goal: map ParsedIntent + manifest → which services need to build/test, which to skip.

Input: `{ parsed_intent, services_manifest }`. The manifest is passed inline as part of the user message — at 8 services it's < 4KB JSON, well within context.

Output schema (this matches the master-plan Analysis contract — backend persists it as-is):
```python
class Analysis(BaseModel):
    primary_services: list[str]
    dependent_services: list[str]
    skipped_services: list[str]
    skipped_test_suites: list[str]
    confidence: float
    rationale: str               # 2–3 sentences, demo-grade
```

Hybrid strategy — combine deterministic and LLM signals:

1. Deterministic prefilter (in `agents/impact_analyzer.py`, NOT in the prompt):
   - For each `path` in `parsed_intent.code_areas`, prefix-match against each service's `paths` field. Matches → seed `primary_services`.
   - Flatten manifest's `consumed_by` for each primary → seed `dependent_services`.
2. LLM pass (the actual agent call):
   - Pass the deterministic seeds AS HINTS plus the full manifest plus the parsed intent.
   - Prompt asks the model to: confirm seeds, expand if `domain_concepts` suggest missed services (e.g. "retry" might involve `notifications` even when no notifications path was touched), generate `skipped_services` as the complement, and write a 2–3 sentence rationale a human reviewer would respect.
   - Model returns the full `Analysis` typed JSON.

System prompt sketch (in `prompts/impact_analyzer.system.md`):
> You are an impact analyzer for a CI/CD optimizer. You receive a parsed engineering intent and a service manifest with declared paths, dependents, and consumers. Your job is to decide which services must rebuild, which dependent services must test, and which can be safely skipped. Prefer to skip when evidence is clear. Always include `skipped_services` as the exact set complement of (primary_services ∪ dependent_services). Tests for skipped services go into `skipped_test_suites`. Your rationale must be specific: cite which path matched, which manifest edge, which domain concept. Do not hand-wave. If you are uncertain, set confidence below 0.7 and bias toward including a service rather than skipping it — false negatives are dangerous in CI optimization.

This is the most demo-critical prompt. Iterate on it heavily during H6–H8.

Model: `gpt-4o`, temperature 0.1, seed 42.

## Agent 3: PipelineOptimizer

Goal: turn the Analysis into concrete CI execution decisions the YAML generator consumes.

Input: `{ analysis, services_manifest }`.

Output schema (internal contract with backend `yaml_gen.py` and `savings.py`):
```python
class OptimizationPlan(BaseModel):
    build_order: list[str]                    # topological-ish order
    parallel_groups: list[list[str]]          # services that can run concurrently
    test_strategy: dict[str, list[str]]       # service -> test suites to run
    skip_reasons: dict[str, str]              # skipped service -> human-readable reason for the YAML comment
    runner_size: Literal["small", "large"]    # demo flourish: large for >5 services, else small
    confidence: float
```

System prompt sketch:
> You are a CI/CD pipeline optimizer. Given an impact analysis and service manifest, produce an execution plan: build order respecting `depends_on` edges, parallel groups grouping services with no dependency between them, per-service test strategy from the manifest, and human-readable skip reasons that will be embedded as YAML comments. Skip reasons must reference specific evidence (path, manifest edge, or absence of consumer relationship). Prefer aggressive parallelization.

Model: `gpt-4o`, temperature 0.1, seed 42.

## Caching Layer

`cache.py`:
```python
def get(intent_hash: str) -> dict | None: ...
def put(intent_hash: str, payload: dict) -> None: ...
```

Files at `optimizer/ai/cache/{intent_hash}.json`. Schema includes a `cached_at` timestamp and the full `run()` payload.

Pre-cache strategy for the demo:
- At H10–H12, run each of the 3 demo intents through `orchestrator.run()` once with live OpenAI calls.
- Inspect the cached JSON. If outputs are good, COMMIT them to git.
- During the live demo, set `OPENAI_FORCE_CACHE=1` env var so the orchestrator never calls OpenAI — guaranteed deterministic, zero stage WiFi risk.
- Keep `OPENAI_FORCE_CACHE` toggleable so we can demo "live AI" if connectivity is excellent and judges seem skeptical.

## Confidence Scoring

Each agent returns a `confidence` float. Define interpretation:
- ≥ 0.85 — green, auto-approval eligible (frontend ConfidenceBadge shows emerald)
- 0.6–0.85 — amber, human review required
- < 0.6 — red, manual override required, recommend running full pipeline

Aggregate confidence shown to the user is the MIN of all 3 agent confidences (weakest link).

If `aggregate_confidence < 0.6`, the orchestrator emits an additional field `recommendation: "run_full_pipeline"` and the frontend shows that prominently. This protects the demo from looking reckless.

## Embedding-Based Service Matching (NICE TO HAVE)

If H10+ buffer:
- Pre-compute embeddings for each service's `description + paths.joined()` using `text-embedding-3-small`.
- Cache vectors in `optimizer/ai/embeddings_cache.json`.
- In ImpactAnalyzer, for each `domain_concept` not directly matched by manifest, cosine-search top-2 services and add as a hint to the prompt.
- Cut at first sign of complexity. The deterministic prefilter + LLM hybrid already covers 90% of cases for our 3 demo intents.

## Hour-by-Hour Tasks

H0:00–H0:30 — three-person sync, lock contracts.

H0:30–H2:00:
- `pip install openai pydantic`
- Folder scaffolding above.
- Define all 3 Pydantic schemas in `schemas.py`.
- Hand-craft a fixture cache file for `INT-101` so backend/frontend can develop against real-shaped data immediately. This is YOUR critical-path early deliverable.
- Write `orchestrator.run()` skeleton returning the fixture.
- Backend integrates against this from H2 onward.

H2:00–H4:00:
- IntentParser: prompt + few-shot + schema + first live OpenAI call working.
- Validate output for `INT-101` against expected shape.
- Add cache `get/put`.

H4:00–H6:00:
- ImpactAnalyzer: deterministic prefilter + prompt + few-shot + first live call.
- Iterate prompt against all 3 demo intents until rationale + skipped_services look demo-grade.
- This is your highest-leverage block — protect the time.

H6:00–H8:00:
- PipelineOptimizer: prompt + schema + first live call.
- Wire all 3 agents into `orchestrator.run()` end-to-end.
- Confidence aggregation logic.
- `OPENAI_FORCE_CACHE` env flag.

H8:00–H10:00:
- Run all 3 demo intents end-to-end. Capture timing per agent.
- If outputs aren't crisp, iterate prompts.
- Add `replay_durations` so cached runs play back at realistic latencies.

H10:00–H12:00:
- Pre-cache all 3 demo intents (commit cache files).
- Optional: embedding-based service matching, if time.
- Test the deterministic-fallback path (set `OPENAI_API_KEY=` to empty, ensure backend's fallback path engages cleanly).

H12:00–H14:00:
- Demo rehearsal with frontend + backend.
- Tune cached `duration_ms` values for demo pacing — parser fast, analyzer slow ("AI is reasoning hard"), optimizer medium.
- Lock all caches.

H14:00–H15:00 — buffer.

H15:00–H16:00 — DEMO FREEZE. `OPENAI_FORCE_CACHE=1` set on demo machines.

## Prompt Engineering Tactics (use these explicitly)

- Always include the manifest in the user message, never the system prompt — keeps system prompt cacheable across calls.
- For ImpactAnalyzer, end the user message with: `"List your reasoning step by step in `rationale` before stating which services are skipped."` This tightens skip decisions.
- Use OpenAI's `strict: true` JSON-schema mode — guarantees parseable JSON.
- Few-shot examples should bracket the difficulty range: 1 obvious case, 1 ambiguous case showing the desired conservative bias toward including a service.
- Temperature 0.1 not 0 — small jitter helps the model handle edge cases gracefully without going off-rails.
- Model selection: do NOT use `gpt-4o` for IntentParser — overkill, slower, and the simple parsing is well within `gpt-4o-mini` capability.

## Cursor / Codex Recommendations

- Use Codex / Claude Opus directly (not Cursor inline) for prompt iteration. Paste the system prompt + a sample input + the desired output. Iterate the prompt against critique. Cursor inline edits are too short-context for prompt work.
- Use Cursor agent mode for the Pydantic schema scaffolding, cache layer, and orchestrator skeleton — boilerplate code where Cursor shines.
- For prompt evaluation, write a tiny harness (`scripts/eval.py`) that runs all 3 demo intents through the orchestrator and prints a side-by-side table of expected vs actual fields. Don't formalize this as a test framework — it's a 30-line script.

## Risk Reduction (AI-Specific)

- OpenAI rate limits or 5xx during demo → `OPENAI_FORCE_CACHE=1` + committed cache files. Practice toggling this on a sample machine.
- Hallucinated services (model invents a service name not in the manifest) → validate every service in the output against the manifest in `orchestrator.run()` post-processing. Drop unknown names with a logged warning. Never let invalid data reach the UI.
- Schema drift → freeze Pydantic schemas at H2. Backend's `analyses` table column shape mirrors `Analysis` exactly. If you need to change a field after H4, get backend + frontend sign-off in the team channel before pushing.
- Slow latency on `gpt-4o` ImpactAnalyzer → if it's >3s consistently, downgrade to `gpt-4o-mini` and accept slightly worse rationale quality. Cached path makes this irrelevant on demo day.
- Manifest changes mid-build (frontend tweaks `service_graph.json`) → cache key includes a hash of the manifest in addition to `intent_hash`. Frontend changes invalidate caches automatically.

## What to Cut if Behind Schedule (in order)

1. Embedding-based service matching (skip entirely)
2. PipelineOptimizer agent → replace with deterministic Python: build_order = topological sort over `depends_on`, parallel_groups = naive level assignment, skip_reasons = templated string per skipped service. The YAML still looks great. Saves 2 hours.
3. Few-shot examples → keep system prompts only, accept slightly weaker outputs
4. Confidence aggregation → hardcode 0.91 across the board
5. Replay-duration realism → return instantly on cache hit

## Definition of Done (your slice)

- `orchestrator.run()` returns the documented payload for all 3 demo intents within 3s on cold call, instantly on cached call.
- All 3 cache files committed under `optimizer/ai/cache/`.
- `OPENAI_FORCE_CACHE=1` makes the demo run with zero network calls and identical outputs.
- All Pydantic schemas validate against backend's expected shapes (smoke-tested via the integration seam).
- `aggregate_confidence` ≥ 0.85 for all 3 demo intents in cached form.
- Rationale text on each Analysis reads like something a senior engineer would write — specific, evidence-cited, not generic.
- Deterministic-fallback path verified working (kill OPENAI_API_KEY, confirm backend produces a sensible Analysis from manifest only).