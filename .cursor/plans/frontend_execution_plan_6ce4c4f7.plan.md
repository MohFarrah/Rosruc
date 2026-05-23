---
name: frontend execution plan
overview: Frontend / fullstack execution plan for the Intent-Aware CI/CD Optimizer hackathon. Owns the entire React UI, all views, the animated execution dashboard (the demo-winning visual), polling glue to the backend, plus authoring of the fake monorepo and demo intent fixtures. Also owns demo rehearsal.
todos:
  - id: fe-h0-scaffold
    content: "H0:30–H2:00: Scaffold Vite/React/TS/Tailwind, layout shell, router, types/contracts.ts mirroring backend Pydantic schemas"
    status: pending
  - id: fe-h0-demo-monorepo
    content: "H0:30–H2:00: Author service_graph.json with 8 services + manual graph_pos + 3 intent fixtures + 3 PR fixtures + stub service files (unblocks backend/AI)"
    status: pending
  - id: fe-h2-stub-views
    content: "H2:00–H4:00: All 6 routes render fixture data — Inbox, Intent Detail, Impact graph, Plan, Execution, Dashboard. Full click-through on stubs."
    status: pending
  - id: fe-h4-wire-real
    content: "H4:00–H6:00: Wire all routes to real backend endpoints, react-query polling on Execution, approval modal with specific savings copy"
    status: pending
  - id: fe-h6-graph-polish
    content: "H6:00–H8:00: ServiceGraph state-driven coloring + transitions, ConfidenceBadge thresholds, YAML viewer with prism + line-flash"
    status: pending
  - id: fe-h8-execution-dashboard
    content: "H8:00–H10:00: HERO COMPONENT — animated execution dashboard with JobCard grid, progress bars, skipped overlays, live savings ticker, side YAML panel. Allocate uninterrupted 2 hours."
    status: pending
  - id: fe-h10-polish
    content: "H10:00–H12:00: Aggregate counter count-up animation, all 3 demo intents wired, Tailwind polish pass for dev-tool aesthetic"
    status: pending
  - id: fe-h12-rehearse
    content: "H12:00–H14:00: 3+ full dry runs, time to 75–95s, record backup screen capture, file bugs against backend/AI"
    status: pending
  - id: fe-h15-freeze
    content: "H15:00–H16:00: Demo freeze on two laptops, browser zoom 110% for stage"
    status: pending
isProject: false
---

# Frontend / Fullstack Execution Plan

You own everything the judges look at. Animations, polish, and demo flow are the difference between "interesting hackathon project" and "I want to invest." Treat the execution dashboard like the hero of the product.

## Scope

You own:
- Entire React/Vite/Tailwind UI under `optimizer/frontend/`
- All views: Inbox, Intent Detail, Impact (react-flow graph), Plan/Approve, Execution Dashboard, Aggregate Savings home
- Polling integration to the backend (react-query)
- Approval modal, savings cards, YAML viewer with syntax highlighting
- Authoring the fake monorepo at `optimizer/demo/monorepo/` (the visual content), and the 3 demo intent + PR fixtures
- Demo rehearsal owner — you run the demo on stage

You do NOT own:
- Any backend endpoints, SQLite, or Python code
- AI prompts or OpenAI calls
- The `service_graph.json` semantics (you author the visible content; backend defines the schema)

## Stack (locked)

- Vite + React 18 + TypeScript
- TailwindCSS (no UI kit — Tailwind directly, dev-tool aesthetic: slate/zinc base, emerald for savings, amber for skipped, blue for running, red for errors)
- Zustand for global state (current intent, current plan, current execution)
- react-router-dom v6
- @tanstack/react-query for fetching + polling
- react-flow for the service-impact graph
- recharts for the savings sparkline
- prism-react-renderer for YAML syntax highlighting
- framer-motion for state transitions on job cards (only if H10+ buffer; else CSS transitions)

Do NOT install: Material UI, Chakra, Ant Design, d3, redux-toolkit, websockets, anything else. Time tax.

## Pivot from Existing Scaffold

The existing [rosruc/frontend](rosruc/frontend) is the wrong product. Plan:
- Create new project at `optimizer/frontend/` with `npm create vite@latest -- --template react-ts`.
- Do NOT try to migrate the existing components — they are for a bug-repro app, not a CI optimizer.
- The only thing salvageable is `vite.config.js` proxy pattern. Reference it; don't import from it.

## Folder Structure

```
optimizer/frontend/
  src/
    main.tsx
    App.tsx                  # router + layout
    routes/
      Inbox.tsx              # list of intents
      IntentDetail.tsx       # ticket + PR + Analyze button
      Impact.tsx             # react-flow graph + rationale sidebar
      Plan.tsx               # savings card + YAML viewer + Approve
      Execution.tsx          # animated job dashboard
      Dashboard.tsx          # aggregate savings home
    components/
      Layout.tsx             # nav + page chrome
      IntentCard.tsx
      ServiceGraph.tsx       # wraps react-flow
      JobCard.tsx            # one execution job (queued/running/etc)
      SavingsCard.tsx        # baseline vs optimized big numbers
      YamlViewer.tsx         # prism syntax highlight
      ApprovalModal.tsx
      ConfidenceBadge.tsx
      AggregateCounter.tsx   # animated count-up hours/$ saved
      Sparkline.tsx          # recharts wrapper
    api/
      client.ts              # axios or fetch wrapper, base URL
      intents.ts             # GET /intents, GET /intents/:id, POST /intents/:id/analyze
      plans.ts               # POST /analyses/:id/plan, POST /plans/:id/approve, POST /plans/:id/execute
      executions.ts          # GET /executions/:id (polled)
      savings.ts             # GET /savings/aggregate
      demo.ts                # POST /demo/reset, POST /demo/seed-savings
    state/
      store.ts               # zustand store
    types/
      contracts.ts           # TS mirror of master-plan JSON contracts
    styles/
      index.css              # tailwind directives only
  index.html
  package.json
  tailwind.config.ts
  vite.config.ts             # proxy /api -> http://localhost:8000
```

## Routing

- `/` — Aggregate Dashboard (loads first, hero metric)
- `/inbox` — list of intents
- `/intents/:id` — detail + Analyze button
- `/intents/:id/impact` — graph + rationale (rendered after analyze)
- `/intents/:id/plan` — savings + YAML + Approve
- `/intents/:id/execution` — animated dashboard (polls)

The "Analyze" button on Intent Detail is the hero CTA. The full demo path is one linear click-through: Dashboard → Inbox → Intent → Impact → Plan → Execution → back to Dashboard with counter ticked up.

## Visual Hierarchy

- The Aggregate Counter on `/` is the first thing judges see. Build it large, with count-up animation on mount and on plan-approval. Format: `47.3 hours saved` and `$189.12` side-by-side, sparkline beneath.
- The Execution Dashboard is the centerpiece. Layout: 4-column grid of JobCards with state-colored borders, top bar showing wall-clock elapsed vs baseline, side panel showing the YAML being executed (highlighted line for currently-running job).
- The Service Graph (react-flow) on Impact view: nodes are services, colored by state (primary=emerald, dependent=blue, skipped=zinc/40% opacity). Edges show `consumed_by` relationships. Manual layout — pin positions in `service_graph.json` as `{x, y}` for each service so the graph never re-laymouts mid-demo.

## Polling Pattern

react-query for all reads. For active executions:
```ts
useQuery({
  queryKey: ['execution', id],
  queryFn: () => api.executions.get(id),
  refetchInterval: (q) => q.state.data?.status === 'completed' ? false : 500,
})
```

500ms is the sweet spot — animation feels live, server isn't hammered. Backend executor uses `SPEED_FACTOR = 0.05` so jobs complete in 5–15s; this gives ~10–30 polls per job.

## Demo Monorepo Authoring (your highest-leverage early task)

You own writing `optimizer/demo/monorepo/service_graph.json` plus stub files. Quality of demo storytelling lives or dies here.

8 services to author (fintech monorepo flavor — relatable, cost-sensitive):
- `payments` — charge / refund / retry / reconciliation
- `auth` — login / sessions / 2FA
- `notifications` — email / SMS / push fanout
- `ledger` — double-entry accounting
- `ml-recommender` — fraud-risk + product recs
- `frontend-web` — Next.js merchant dashboard
- `frontend-mobile` — React Native consumer app
- `infra` — Terraform / Helm charts

For each service create:
- `services/{name}/README.md` — 3 lines describing the service
- `services/{name}/Dockerfile` — minimal valid Dockerfile (FROM node:20 or python:3.11, COPY ., CMD)
- `services/{name}/package.json` or `pyproject.toml` — name + 3 fake deps
- `services/{name}/src/index.{ts,py}` — 20-line stub with realistic function names
- `services/{name}/tests/test_*.py` or `*.test.ts` — 3 fake test files with realistic names

The stubs are PROPS. Judges will scroll the YAML and may glance at one or two service folders. They need to look real for ~3 seconds of inspection. Don't over-invest beyond that.

Manual graph layout — pin x/y positions in `service_graph.json`:
```json
{
  "name": "payments",
  "graph_pos": { "x": 400, "y": 200 },
  ...
}
```

3 demo intents to author (each tells a distinct story):
1. `INT-101` "Update payment retry logic" — small fix, 1 primary + 2 dependents, 4 services skipped. The 90-second hero demo.
2. `INT-102` "Add fraud risk score to checkout" — cross-service refactor. 3 primary + 1 dependent, 3 services skipped. Demonstrates the system handles non-trivial impact.
3. `INT-103` "Bump Terraform AWS provider to v5.40" — infra-only. 1 primary, 0 dependents, ALL 7 other services skipped. Demonstrates extreme savings (~95%) — closing flourish.

Each intent JSON includes the ticket body and a fake PR diff file list. Make ticket bodies sound real (use Jira-ish language, mention customer impact, link to runbooks that don't exist).

## Hour-by-Hour Tasks

H0:00–H0:30 — three-person sync, lock contracts.

H0:30–H2:00:
- `npm create vite@latest`, install all deps, Tailwind init.
- Layout shell + router + nav.
- `types/contracts.ts` mirroring backend Pydantic schemas exactly.
- Author `service_graph.json` + 3 intents + 3 PRs (this is YOUR critical path — backend/AI block on this).
- Create stub files for all 8 services.

H2:00–H4:00:
- Inbox renders intent list from `GET /intents`.
- Intent Detail renders body + PR diff file list + Analyze button.
- Impact view renders react-flow graph from a hardcoded fixture analysis (backend stub will return same shape).
- Plan view renders SavingsCard + YamlViewer + Approve button from fixture.
- Aggregate Dashboard renders counter + sparkline from fixture.
- Full click-through works on stubs by H4. THIS IS THE SAFETY NET.

H4:00–H6:00:
- Wire all routes to real backend endpoints.
- react-query polling on Execution view.
- Approval modal with explicit "Skip 4 services + 12 test suites — save 17m and $2.14. Approve?" copy.

H6:00–H8:00:
- ServiceGraph polish: state-driven node colors, edge highlighting, smooth transitions when analysis lands.
- ConfidenceBadge component with color-coded thresholds (≥0.85 emerald "auto-approve eligible", 0.6–0.85 amber "human review", <0.6 red "manual override").
- YAML viewer with prism highlighting + line-flash on currently running job.

H8:00–H10:00 — THE EXECUTION DASHBOARD.
- This is the demo-winning component. Allocate yourself an uninterrupted 2 hours.
- Job grid: 4 columns, JobCard per execution_job. Border colors by state. Progress bar with `width: (elapsed / estimated) * 100%`.
- Skipped jobs flash on entry with "SKIPPED — saved Xm Ys" overlay.
- Top bar: total elapsed wall-clock vs baseline, with savings ticker incrementing live.
- Side panel: YAML scrolled to currently-running job, line highlighted.

H10:00–H12:00:
- Aggregate counter count-up animation on mount + on returning from execution.
- All 3 demo intents wired and visually distinct (different services lit on graph).
- Tailwind polish pass: spacing, typography, contrast. Dev-tool aesthetic — looks like Vercel/Linear, not Bootstrap.

H12:00–H14:00 — REHEARSAL.
- Run the full demo 3+ times end-to-end.
- Time each run, target 75–95 seconds.
- Memorize talking points (master plan demo flow).
- Record a backup screen capture as ultimate fallback.
- File bugs against backend / AI as you find them.

H14:00–H15:00 — buffer for last-minute bugs.

H15:00–H16:00 — DEMO FREEZE. Two laptops loaded with the demo, both pointed at localhost backend. Browser zoom set to 110% for stage projection.

## Animation Details (the wow moments)

- Aggregate counter: use `react-countup` or hand-rolled `requestAnimationFrame` loop. Animate from previous to new value over 1.2s with ease-out cubic.
- JobCard state transitions: 200ms color/border crossfade. Skipped overlay slides in from top with 300ms ease.
- ServiceGraph node updates: react-flow has built-in node animation; just update the `data.state` prop and it crossfades node fill.
- "AI is analyzing…" indicator on Intent Detail: 3-stage text rotation ("Reading intent…" → "Mapping impact…" → "Optimizing pipeline…") on a 600ms cycle while the analyze request is pending. Even if the call returns in 300ms, hold the indicator a minimum 1.5s for visual gravitas.

## Cursor / AI Tooling Recommendations

- Use Cursor agent to scaffold each route component from `types/contracts.ts` — paste the contract type, ask for a typed read view.
- Use Claude Opus directly for the Execution Dashboard layout — it benefits from a careful design prompt with the visual hierarchy described.
- Use Cursor inline edits for Tailwind class polish — fast iteration loop.
- For the demo monorepo stub files, generate them with a single prompt: "Generate a realistic stub for a payments service with: README, Dockerfile, pyproject.toml, src/index.py with charge/refund/retry functions, three test files." Repeat for 8 services. Total: 30 minutes.

## Risk Reduction (Frontend-Specific)

- react-flow can rabbit-hole on layout. Pin manual `{x, y}` positions in `service_graph.json` from minute one. Do NOT use `dagre` or `elkjs`.
- Polling at 500ms across 4 simultaneous queries can cause re-render storms. Use react-query's `select` to memoize and `keepPreviousData: true`.
- Tailwind JIT can choke on dynamic class names like `bg-${state}-500`. Use a static lookup map `{ running: 'bg-blue-500', success: 'bg-emerald-500', ... }`.
- Vite proxy must be set in `vite.config.ts` — `/api -> http://localhost:8000` — to avoid CORS dev-time pain.
- If framer-motion blows the time budget, drop it. CSS transitions cover 90% of the demo polish.

## What to Cut if Behind Schedule (in order)

1. framer-motion → CSS transitions
2. recharts sparkline → static rendered SVG with hardcoded path
3. prism-react-renderer YAML highlighting → plain `<pre>`
4. Confidence-driven approval UX → single Approve button always
5. ml-recommender service → cut from monorepo (down to 7 services)
6. INT-103 infra-only intent → cut to 2 demo intents
7. Aggregate Sparkline → just the count-up number

## Definition of Done (your slice)

- All 6 routes render without errors against a clean `POST /demo/reset`.
- Full demo flow click-through completes in 75–95 seconds.
- Aggregate counter visibly increments after every approved+executed plan.
- Service graph correctly highlights primary vs dependent vs skipped for all 3 demo intents.
- Execution dashboard animates jobs to completion with skipped jobs visibly flashing savings.
- YAML viewer shows the generated workflow with skipped jobs as commented blocks.
- Approval modal copy is specific and demo-ready (e.g. "Skip 4 services + 12 test suites — save 17m 22s and $2.14").
- Demo runs cleanly with backend running in OpenAI-disabled fallback mode.