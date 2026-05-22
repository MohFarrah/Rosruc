def generate_report(result):
    """Return the workflow report when a future agent result contains one."""
    return result.get("report", {})
