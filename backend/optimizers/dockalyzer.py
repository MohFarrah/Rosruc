from agents.dockalyzer_agent import get_placeholder_notes
from core.response_builder import build_success_response


def run(interval: str, auto: bool) -> dict:
    return build_success_response(
        mode="dockalyzer",
        interval=interval,
        auto=auto,
        before_time="45 min",
        after_time="20 sec",
        summary="Detected Docker cache bust caused by broad COPY . . before dependency install.",
        recommendation="Move dependency install before copying the full source tree.",
        details={
            "affectedLayer": "COPY . .",
            "cacheBustReason": (
                "The full source tree is copied before dependency installation, "
                "so small file edits invalidate expensive dependency layers."
            ),
            "exampleFix": [
                "COPY package*.json ./",
                "RUN npm ci",
                "COPY . .",
            ],
        },
        notes=get_placeholder_notes(),
    )
