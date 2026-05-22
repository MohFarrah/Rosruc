function runPlaceholderWorkflow(ticket) {
  const summary = `Drafted a placeholder investigation plan for "${ticket.title}".`;

  return {
    status: "report_ready",
    summary,
    logs: [
      "Ticket parser extracted the title and customer symptoms.",
      "Reproduction agent reserved a future Docker sandbox run.",
      "Fix agent skipped code changes because AI execution is not wired yet.",
      "Report generator produced a demo report for the frontend.",
    ],
    report: {
      title: `Placeholder report: ${ticket.title}`,
      summary,
      reproductionNotes: [
        "Use the ticket description as the first reproduction clue.",
        "Load a target repository into an isolated Docker sandbox.",
        "Capture commands, failing tests, and environment details.",
      ],
      testNotes: [
        "No test suite ran in this starter workflow.",
        "Future runs should compare failing and passing tests before a PR draft.",
      ],
      nextSteps: [
        "Wire the Node API to the Python workflow process.",
        "Persist ticket and report state in SQLite.",
        "Add Docker sandbox execution for a demo target repository.",
      ],
    },
  };
}

module.exports = {
  runPlaceholderWorkflow,
};
