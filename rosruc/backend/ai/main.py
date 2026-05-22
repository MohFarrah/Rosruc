"""Command line placeholder for the future Python AI workflow."""

import json
from datetime import datetime, timezone


def run_ticket_workflow(ticket):
    """Return a JSON-like placeholder result for one support ticket."""
    ticket_title = ticket.get("title", "Untitled ticket")
    generated_at = datetime.now(timezone.utc).isoformat()
    summary = f'Prepared a future investigation plan for "{ticket_title}".'

    return {
        "status": "report_ready",
        "summary": summary,
        "logs": [
            "Parsed the incoming support ticket.",
            "Reserved a future reproduction step for the Docker sandbox.",
            "Skipped fix and test execution in the placeholder workflow.",
        ],
        "report": {
            "title": f"Python placeholder report: {ticket_title}",
            "summary": summary,
            "generatedAt": generated_at,
            "reproductionNotes": [
                "Collect target repo and environment context.",
                "Turn ticket symptoms into executable reproduction steps.",
            ],
            "testNotes": ["Tests will run after sandbox wiring is implemented."],
            "nextSteps": [
                "Call the Python workflow from the Express service.",
                "Persist reports and ticket status updates.",
            ],
        },
    }


if __name__ == "__main__":
    sample_ticket = {
        "id": "ticket-demo-python",
        "title": "Checkout total changes after coupon removal",
        "description": "A customer reports stale totals on the checkout page.",
    }

    print(json.dumps(run_ticket_workflow(sample_ticket), indent=2))
