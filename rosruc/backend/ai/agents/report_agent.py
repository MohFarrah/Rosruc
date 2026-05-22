def draft_report(ticket, workflow_notes):
    """Placeholder for report composition after workflow steps finish."""
    return {
        "title": f"Draft report for {ticket.get('title', 'Untitled ticket')}",
        "notes": workflow_notes,
    }
