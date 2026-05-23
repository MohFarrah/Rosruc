# AI Orchestrator

Three-agent pipeline: IntentParser → ImpactAnalyzer → PipelineOptimizer.

```powershell
cd optimizer
.\.venv\Scripts\Activate.ps1
python -c "import asyncio; from ai.orchestrator import run; print('AI module OK')"
```

Backend imports this via `app.services.orchestrator_seam`.
