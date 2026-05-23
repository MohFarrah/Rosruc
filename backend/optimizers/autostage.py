from agents.autostage_agent import get_placeholder_notes
from core.response_builder import build_success_response


def run(interval: str, auto: bool) -> dict:
    return build_success_response(
        mode="autostage",
        interval=interval,
        auto=auto,
        before_time="20 min",
        after_time="2 min",
        summary="Generated a cache-friendly multi-stage Dockerfile plan.",
        recommendation=(
            "Use a dependency stage, slim base image, and copy package files before source files."
        ),
        details={
            "suggestedStages": [
                {
                    "name": "deps",
                    "purpose": "Install dependencies from package or lock files before copying source.",
                },
                {
                    "name": "build",
                    "purpose": "Copy application source and produce build artifacts.",
                },
                {
                    "name": "runtime",
                    "purpose": "Use a slim runtime image with only production artifacts.",
                },
            ],
            "cacheOrdering": [
                "Copy dependency manifests first.",
                "Install dependencies in their own layer.",
                "Copy frequently changing source files later.",
            ],
        },
        notes=get_placeholder_notes(),
    )
