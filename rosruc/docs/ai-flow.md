# Future AI Flow

The first app returns a placeholder result. The intended workflow is:

1. Ticket parser extracts symptoms, environment clues, expected behavior, and missing details.
2. Reproduction agent turns the parsed ticket into commands and checks for a target repository.
3. Docker sandbox runs the target code in isolation and captures evidence.
4. Test runner executes focused reproduction tests and baseline project tests.
5. Fix agent proposes a small patch after a reproducible failure is understood.
6. Report generator summarizes evidence, patch details, tests, risks, and a PR draft.

The flow should preserve logs at each step so a developer can understand what the agent tried before reviewing a fix.
