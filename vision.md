# school-aide — Vision

## What It Is

A web app that takes a recorded teacher class (MP3) and converts it into structured, plain-language assignments and tasks for kids with learning disabilities.

## Design Decisions

| Decision | Answer |
|---|---|
| Platform | Web app, iPad-optimized |
| Users | Teacher or classroom aide |
| Input | Upload MP3 or record live in-browser |
| Disabilities | Universal design — ADHD, dyslexia, autism spectrum, cognitive delays |
| Output | On-screen interactive checklist |
| Scope | Hackathon demo, local only |
| AI | Claude API (transcription + structuring in one call) |
| Stack | React + Vite |
| Deployment | Local (`localhost`) |
| API key | `.env` file |
| Structure | Assignments → Tasks (two levels) |
| Language | Full rewrite, grade 3–4 reading level |
| Interaction | Visual checkmark/strikethrough, browser state only |
| Screens | Two — input screen → results screen |
| Visual style | Friendly, colorful, rounded shapes, large readable text |
| Name | **school-aide** |

## User Flow

1. Teacher or aide opens the app on an iPad (local URL)
2. **Screen 1 — Input**: upload an MP3 or record live in-browser
3. Claude processes the audio: transcribes + rewrites into plain language + structures into Assignments → Tasks
4. **Screen 2 — Results**: friendly colorful checklist the aide walks through with the student
5. Student ticks off tasks as they complete them (visual checkmark/strikethrough)

## Language Rules for Output

- Grade 3–4 reading level
- Short sentences (max 10 words where possible)
- No jargon, no idioms, no passive voice
- Numbered steps, never bullet walls
- One idea per sentence

## Out of Scope (for demo)

- Authentication or user accounts
- Saving/storing assignments between sessions
- Sharing links or PDF export
- Multi-student management
- Error handling beyond happy path
