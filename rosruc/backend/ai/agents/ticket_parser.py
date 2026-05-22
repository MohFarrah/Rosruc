def parse_ticket(ticket):
    """Prepare a small normalized ticket shape for future agent steps."""
    return {
        "title": ticket.get("title", "Untitled ticket"),
        "description": ticket.get("description", ""),
        "signals": [],
    }
