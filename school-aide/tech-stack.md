# school-aide — Tech Stack & How It Works

## What It Does

A teacher or classroom aide records (or uploads) audio of a class lesson. The app transcribes the audio, then uses an LLM to extract assignments and rewrite them as plain, grade 3–4 level instructions. Students with learning disabilities work through the checklist on an iPad and tap each task when done. The aide can then grade completed tasks with a ✓/✗ review screen.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Transcription | AssemblyAI REST API |
| LLM / structuring | OpenRouter → `anthropic/claude-sonnet-4.5` |
| Audio capture | Browser MediaRecorder API |
| Styling | Plain CSS with custom properties (no CSS framework) |
| Tests | Vitest + @testing-library/react |
| Runtime | Browser only — no backend, no database |

---

## How It Works

### 1. Audio input (InputScreen)

The user either:
- **Uploads** an audio file (MP3, WAV, M4A). The file is validated by MIME type and extension before being accepted.
- **Records live** in the browser using the `MediaRecorder` API via the `useAudioRecorder` hook. The hook wraps `navigator.mediaDevices.getUserMedia({ audio: true })` and collects chunks into a `Blob` when recording stops.

Either way, an audio `Blob` is passed to `App.jsx` via `onSubmit`.

### 2. Transcription (AssemblyAI)

`src/services/transcribe.js` calls the AssemblyAI REST API in three steps:

```
1. POST /v2/upload        — upload the raw audio blob
2. POST /v2/transcript    — request a transcription job
3. GET  /v2/transcript/:id — poll every 2 s until status = "completed"
```

Polling is capped at 90 attempts (~3 minutes). The result is a plain text transcript.

### 3. Structuring (OpenRouter → Claude)

`src/services/structure.js` sends the transcript to OpenRouter's OpenAI-compatible endpoint:

```
POST https://openrouter.ai/api/v1/chat/completions
Model: anthropic/claude-sonnet-4.5
```

The system prompt instructs the model to:
- Find every assignment mentioned in the transcript
- Break each into numbered steps (one action per step)
- Rewrite everything at grade 3 reading level (max 10 words per sentence)
- Add a short `description` per step telling the student exactly how to do it
- Return a strict JSON structure — no markdown, no prose

The response shape:

```json
{
  "assignments": [
    {
      "title": "Math Worksheet",
      "tasks": [
        {
          "text": "Step 1: Open your math book.",
          "description": "Find your math book in your bag. Put it on your desk."
        }
      ]
    }
  ]
}
```

Markdown fences are stripped before parsing. If parsing fails, the app returns `{ assignments: [] }` rather than crashing.

### 4. Results screen

The structured assignments are displayed as coloured cards (`AssignmentCard`). Each task is a tappable row (`TaskItem`) — tapping toggles a green checkmark and strikethrough. The count of completed tasks is tracked in `ResultsScreen` state and shown on the **Turn In Work** button, which is disabled until at least one task is marked done.

### 5. Grading screen (GradingScreen)

When the student taps **Turn In Work**, only the completed tasks are passed to the grading screen. The teacher sees each task with its assignment label and taps **✓ Right** or **✗ Wrong**. Cards turn green or pink. The Back button returns to the results screen without losing the student's checkmarks.

---

## Screen Flow

```
InputScreen
    │  (audio blob)
    ▼
Loading  ──── transcribeAudio() ──── AssemblyAI
    │          structureTranscript() ── OpenRouter / Claude
    ▼
ResultsScreen  (student checks off tasks)
    │  (completed tasks list)
    ▼
GradingScreen  (teacher marks right / wrong)
    │  (Back)
    ▼
ResultsScreen
```

---

## Environment Variables

```
VITE_OPENROUTER_API_KEY   # OpenRouter key (sk-or-...)
VITE_ASSEMBLYAI_API_KEY   # AssemblyAI key
```

Both are loaded by Vite at build time via `import.meta.env`. They are **never committed** — `.env` is in `.gitignore`. The app validates the OpenRouter key format on startup and shows a clear error message if it is missing or malformed.

> ⚠️ Because this is a browser app, both keys are bundled into the client JS. This is acceptable for a local hackathon demo but **not suitable for public deployment**. A production version would proxy API calls through a server.

---

## Running Locally

```bash
cd school-aide
cp .env.example .env
# fill in VITE_OPENROUTER_API_KEY and VITE_ASSEMBLYAI_API_KEY
npm install
npm run dev        # http://localhost:5173
npm test           # run unit tests
```
