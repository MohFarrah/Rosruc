"""PipelineOptimizer agent stub."""

from ai.schemas import OptimizationPlan


async def optimize_pipeline(analysis: dict, services_manifest: list[dict]) -> OptimizationPlan:
    run_services = analysis["primary_services"] + analysis["dependent_services"]
    skipped = analysis["skipped_services"]

    return OptimizationPlan(
        build_order=run_services,
        parallel_groups=[analysis["primary_services"], analysis["dependent_services"]],
        test_strategy={name: [] for name in run_services},
        skip_reasons={name: "No manifest impact detected" for name in skipped},
        runner_size="small",
        confidence=0.93,
    )
