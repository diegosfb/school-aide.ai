---
kind: "implementation-note"
date: 2026-09-29T20:36:27Z
agent: "Codex"
---

# Added OpenRouter validation script for school-aide

Created school-aide/testOpenRouter.sh to parse VITE_OPENROUTER_API_KEY from school-aide/.env without sourcing or printing it, verify the key against OpenRouter /api/v1/key, then send a tiny chat completion using OPENROUTER_TEST_MODEL or openrouter/auto by default. Validation: bash -n passes and the script returned HTTP 200 for both key and chat checks. The previous app model anthropic/claude-3.5-sonnet returned OpenRouter 404: No endpoints found.

## Related artifacts

None supplied.
