from agents.hotdock_agent import get_placeholder_notes
from core.response_builder import build_success_response


def run(interval: str, auto: bool) -> dict:
    return build_success_response(
        mode="hotdock",
        interval=interval,
        auto=auto,
        before_time="1 min",
        after_time="3 sec",
        summary="Generated a no-build file sync plan for local development.",
        recommendation=(
            "Use docker cp to sync changed files into a running container with nodemon or uvicorn reload."
        ),
        details={
            "syncPlan": [
                "Read local-to-container mappings from a future .hotdockrc file.",
                "Watch changed files in the workspace.",
                "Copy changed files into the running container without rebuilding.",
            ],
            "exampleCommand": (
                "docker cp ./src/app.py my-running-container:/app/src/app.py"
            ),
            "reloadAssumption": (
                "The container runs a reload-capable process such as nodemon or uvicorn --reload."
            ),
        },
        notes=get_placeholder_notes(),
    )
