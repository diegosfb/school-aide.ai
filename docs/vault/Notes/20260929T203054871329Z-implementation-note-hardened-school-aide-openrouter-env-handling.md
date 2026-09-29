---
kind: "implementation-note"
date: 2026-09-29T20:30:54Z
agent: "Codex"
---

# Hardened school-aide OpenRouter env handling

Added a guard so structureTranscript fails before fetch when VITE_OPENROUTER_API_KEY is missing, placeholder, or not an sk-or- OpenRouter key. Added a regression test for the missing-key path and updated index.html to include mobile-web-app-capable metadata plus an inline favicon to stop the browser 404. Validation: school-aide npm test and npm run build pass. The actual local .env key names are present and redacted; restarting the Vite dev server is required after env changes.

## Related artifacts

None supplied.
