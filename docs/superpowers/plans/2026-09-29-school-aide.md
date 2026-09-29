# school-aide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Vite web app that takes teacher audio (uploaded MP3 or live recording) and produces a friendly, colorful interactive checklist of assignments and tasks in grade 3–4 language for students with learning disabilities.

**Architecture:** Two-stage pipeline — AssemblyAI transcribes the audio to text, then Claude API (claude-opus-5-5) structures and rewrites it into a JSON tree of Assignments → Tasks using grade 3–4 plain language. The app has two screens: an input screen (upload or record) and a results screen (interactive colorful checklist). All state lives in React; no backend required.

**Tech Stack:** React 18, Vite 5, @anthropic-ai/sdk, AssemblyAI REST API, Nunito font, Vitest + @testing-library/react

**Spec:** `vision.md` at the project root

## Architecture Note

During planning (via claude-api skill) we confirmed that direct audio input to Claude API is not documented for current models. We therefore use AssemblyAI's free REST API for transcription, then Claude for structuring and plain-language rewriting. This adds `VITE_ASSEMBLYAI_API_KEY` to `.env` — not in the original grill-me session (which selected "Claude handles everything"), but the outcome for the user is identical.

## Global Constraints

- React 18, Vite 5, Node 22
- iPad-optimized: min touch target 44 px, viewport `maximum-scale=1.0`, no hover-only interactions
- API keys in `.env` only — never committed (`VITE_ANTHROPIC_API_KEY`, `VITE_ASSEMBLYAI_API_KEY`)
- Grade 3–4 reading level: sentences ≤ 10 words, no jargon, active voice, numbered steps
- Two-level output only: Assignments → Tasks (no sub-tasks)
- Local demo only — no backend, no auth, no persistence between sessions
- Claude model: `claude-opus-5-5`

## Review Focus

1. **Empty audio / no speech detected** — AssemblyAI may return an empty or null transcript; `structureTranscript` must handle this and return `{ assignments: [] }` rather than crash.
2. **Claude JSON wrapped in markdown fences** — Claude may wrap JSON in ` ```json ... ``` ` fences; the service must strip them before parsing.
3. **AssemblyAI polling timeout** — transcription is async (poll for status); a long file may take 30+ seconds; the UI must show a clear loading message throughout.
4. **MediaRecorder not supported** — Some iOS WebViews don't support MediaRecorder; the record button must self-disable with a friendly message rather than crash.
5. **Wrong file type uploaded** — User may drag in a video or document; the file input must validate MIME type and show a plain-English error before submitting.

---

### Task 1: Project scaffold

**Files:**
- Create: `school-aide/package.json`
- Create: `school-aide/vite.config.js`
- Create: `school-aide/index.html`
- Create: `school-aide/.env.example`
- Create: `school-aide/.gitignore`

**Interfaces:**
- Produces: runnable dev server at `localhost:5173`

- [ ] **Step 1: Create the project directory**

```bash
mkdir -p /Users/diego.brihuega/Desktop/Hackathon/school-aide
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "school-aide",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@anthropic-ai/sdk": "^0.54.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.14",
    "vitest": "^2.1.9",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.0.0",
    "@testing-library/dom": "^10.0.0"
  }
}
```

- [ ] **Step 3: Write `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>school-aide</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `.env.example`**

```
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_key_here
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
.env
.env.local
*.local
```

- [ ] **Step 7: Install dependencies**

```bash
cd /Users/diego.brihuega/Desktop/Hackathon/school-aide && npm install
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: server at `localhost:5173` (blank page — no `src/` yet; no console errors)

- [ ] **Step 9: Commit**

```bash
git add school-aide/
git commit -m "feat: scaffold school-aide React + Vite project"
```

---

### Task 2: Claude structuring service + AssemblyAI transcription service

**Files:**
- Create: `school-aide/src/services/structure.js`
- Create: `school-aide/src/services/structure.test.js`
- Create: `school-aide/src/services/transcribe.js`
- Create: `school-aide/src/services/transcribe.test.js`

**Interfaces:**
- `structure.js` exports: `async structureTranscript(transcript: string): Promise<{ assignments: Array<{ title: string, tasks: string[] }> }>`
- `transcribe.js` exports: `async transcribeAudio(audioBlob: Blob): Promise<string>`
- Consumes: `import.meta.env.VITE_ANTHROPIC_API_KEY`, `import.meta.env.VITE_ASSEMBLYAI_API_KEY`
- Produces: both functions consumed by `App.jsx` (Task 4)

- [ ] **Step 1: Write failing test for `structureTranscript`**

Create `school-aide/src/services/structure.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn(async ({ messages }) => {
        const input = messages[0].content
        if (input.includes('math worksheet')) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                assignments: [{
                  title: 'Math Worksheet',
                  tasks: ['Step 1: Open your math book.', 'Step 2: Do page 10.'],
                }],
              }),
            }],
          }
        }
        if (input.includes('json fences')) {
          return {
            content: [{
              type: 'text',
              text: '```json\n{"assignments":[]}\n```',
            }],
          }
        }
        return { content: [{ type: 'text', text: '{"assignments":[]}' }] }
      }),
    },
  })),
}))

describe('structureTranscript', () => {
  beforeEach(() => { vi.resetModules() })

  it('returns assignments with tasks from a transcript', async () => {
    const { structureTranscript } = await import('./structure.js')
    const result = await structureTranscript('Do math worksheet page 10.')
    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0].title).toBe('Math Worksheet')
    expect(result.assignments[0].tasks).toHaveLength(2)
  })

  it('returns empty assignments for empty transcript', async () => {
    const { structureTranscript } = await import('./structure.js')
    const result = await structureTranscript('')
    expect(result).toEqual({ assignments: [] })
  })

  it('strips markdown code fences from Claude response', async () => {
    const { structureTranscript } = await import('./structure.js')
    const result = await structureTranscript('json fences test')
    expect(result).toEqual({ assignments: [] })
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /Users/diego.brihuega/Desktop/Hackathon/school-aide && npx vitest run src/services/structure.test.js
```

Expected: FAIL — `structureTranscript` not found

- [ ] **Step 3: Write `structure.js`**

Create `school-aide/src/services/structure.js`:

```js
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a helper for teachers. You work with kids who have learning disabilities.

A teacher recorded a class. You will read what the teacher said.
Your job is to:
1. Find every assignment the teacher mentioned.
2. List the exact steps for each assignment.
3. Use very simple words. Grade 3 level only.

Simple writing rules:
- Short sentences. Max 10 words.
- Easy words only. No big words.
- Tell the student what to do. Use "Open", "Write", "Read", "Draw".
- Number every step. Start with 1.
- One step = one action only.

Return ONLY a JSON object. No markdown. No extra text. This exact format:
{
  "assignments": [
    {
      "title": "Short name for the assignment",
      "tasks": [
        "Step 1: Do this thing.",
        "Step 2: Do this next thing."
      ]
    }
  ]
}

If no assignments were mentioned, return: {"assignments": []}`

export async function structureTranscript(transcript) {
  if (!transcript || transcript.trim() === '') {
    return { assignments: [] }
  }

  const client = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true,
  })

  const response = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Here is what the teacher said:\n\n${transcript}\n\nReturn the JSON now.`,
    }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock) return { assignments: [] }

  const raw = textBlock.text
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')

  try {
    return JSON.parse(raw)
  } catch {
    return { assignments: [] }
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/services/structure.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: Write failing test for `transcribeAudio`**

Create `school-aide/src/services/transcribe.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('transcribeAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('uploads audio, polls, and returns transcript text', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ upload_url: 'https://cdn.assemblyai.com/upload/abc' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'tx_xyz' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed', text: 'Do math worksheet page 10.' }) })

    const { transcribeAudio } = await import('./transcribe.js')
    const blob = new Blob(['fake audio'], { type: 'audio/mpeg' })
    const result = await transcribeAudio(blob)
    expect(result).toBe('Do math worksheet page 10.')
  })

  it('throws when AssemblyAI reports an error status', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ upload_url: 'https://cdn.assemblyai.com/upload/abc' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'tx_xyz' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'error', error: 'Audio quality too low' }) })

    const { transcribeAudio } = await import('./transcribe.js')
    const blob = new Blob(['fake audio'], { type: 'audio/mpeg' })
    await expect(transcribeAudio(blob)).rejects.toThrow('Audio quality too low')
  })

  it('throws when upload fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
    const { transcribeAudio } = await import('./transcribe.js')
    const blob = new Blob(['fake audio'], { type: 'audio/mpeg' })
    await expect(transcribeAudio(blob)).rejects.toThrow('Upload failed')
  })
})
```

- [ ] **Step 6: Run test to confirm it fails**

```bash
npx vitest run src/services/transcribe.test.js
```

Expected: FAIL — `transcribeAudio` not found

- [ ] **Step 7: Write `transcribe.js`**

Create `school-aide/src/services/transcribe.js`:

```js
const ASSEMBLYAI_API = 'https://api.assemblyai.com/v2'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function transcribeAudio(audioBlob) {
  const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY

  const uploadRes = await fetch(`${ASSEMBLYAI_API}/upload`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: audioBlob,
  })
  if (!uploadRes.ok) throw new Error('Upload failed')
  const { upload_url } = await uploadRes.json()

  const transcriptRes = await fetch(`${ASSEMBLYAI_API}/transcript`, {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ audio_url: upload_url }),
  })
  if (!transcriptRes.ok) throw new Error('Transcription request failed')
  const { id } = await transcriptRes.json()

  while (true) {
    await sleep(2000)
    const pollRes = await fetch(`${ASSEMBLYAI_API}/transcript/${id}`, {
      headers: { authorization: apiKey },
    })
    const data = await pollRes.json()
    if (data.status === 'completed') return data.text ?? ''
    if (data.status === 'error') throw new Error(data.error ?? 'Transcription failed')
  }
}
```

- [ ] **Step 8: Run all service tests**

```bash
npx vitest run src/services/
```

Expected: PASS (6 tests total across both files)

- [ ] **Step 9: Commit**

```bash
git add school-aide/src/services/
git commit -m "feat: add transcription and Claude structuring services"
```

---

### Task 3: Audio recorder hook

**Files:**
- Create: `school-aide/src/hooks/useAudioRecorder.js`
- Create: `school-aide/src/hooks/useAudioRecorder.test.js`

**Interfaces:**
- Exports: `useAudioRecorder(): { isRecording: boolean, isSupported: boolean, startRecording: () => void, stopRecording: () => Promise<Blob|null>, audioBlob: Blob|null }`
- Produces: consumed by `InputScreen` (Task 5)

- [ ] **Step 1: Write failing test**

Create `school-aide/src/hooks/useAudioRecorder.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAudioRecorder } from './useAudioRecorder.js'

describe('useAudioRecorder', () => {
  const originalMediaRecorder = global.MediaRecorder

  afterEach(() => {
    global.MediaRecorder = originalMediaRecorder
  })

  it('reports isSupported=false when MediaRecorder is unavailable', () => {
    delete global.MediaRecorder
    const { result } = renderHook(() => useAudioRecorder())
    expect(result.current.isSupported).toBe(false)
  })

  it('starts as not recording with null blob', () => {
    global.MediaRecorder = class {
      start() {}
      stop() {}
      addEventListener() {}
    }
    const { result } = renderHook(() => useAudioRecorder())
    expect(result.current.isRecording).toBe(false)
    expect(result.current.audioBlob).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/hooks/useAudioRecorder.test.js
```

Expected: FAIL — `useAudioRecorder` not found

- [ ] **Step 3: Write `useAudioRecorder.js`**

Create `school-aide/src/hooks/useAudioRecorder.js`:

```js
import { useState, useRef } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  const isSupported = typeof MediaRecorder !== 'undefined'

  function startRecording() {
    if (!isSupported) return
    chunksRef.current = []
    setAudioBlob(null)

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      })

      recorder.start()
      setIsRecording(true)
    })
  }

  function stopRecording() {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder) { resolve(null); return }

      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setIsRecording(false)
        recorder.stream.getTracks().forEach((t) => t.stop())
        resolve(blob)
      }, { once: true })

      recorder.stop()
    })
  }

  return { isRecording, isSupported, startRecording, stopRecording, audioBlob }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/hooks/useAudioRecorder.test.js
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add school-aide/src/hooks/
git commit -m "feat: add useAudioRecorder hook"
```

---

### Task 4: App shell + global styles

**Files:**
- Create: `school-aide/src/index.css`
- Create: `school-aide/src/main.jsx`
- Create: `school-aide/src/App.jsx`

**Interfaces:**
- `App` manages `screen: 'input' | 'loading' | 'results'` and `assignments` state
- Passes `onSubmit(blob)` down to `InputScreen`; passes `assignments` and `onReset` to `ResultsScreen`
- Produces: shell consumed by Tasks 5 and 6

- [ ] **Step 1: Write `index.css`**

Create `school-aide/src/index.css`:

```css
:root {
  --color-bg: #fffbf5;
  --color-surface: #ffffff;
  --color-primary: #ff7043;
  --color-primary-dark: #e64a19;
  --color-secondary: #42a5f5;
  --color-success: #66bb6a;
  --color-done: #e8f5e9;
  --color-text: #212121;
  --color-text-soft: #616161;
  --color-border: #e0e0e0;
  --radius: 20px;
  --radius-sm: 12px;
  --shadow: 0 4px 16px rgba(0,0,0,0.10);
  --font: 'Nunito', 'Segoe UI', sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  background: var(--color-bg);
  font-family: var(--font);
  color: var(--color-text);
  font-size: 18px;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 700;
  padding: 14px 28px;
  min-height: 44px;
  transition: transform 0.1s, box-shadow 0.1s;
}
button:active { transform: scale(0.97); }
button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 0 var(--color-primary-dark);
}
.btn-primary:active:not(:disabled) { box-shadow: none; transform: translateY(4px) scale(0.97); }

.btn-secondary {
  background: var(--color-secondary);
  color: #fff;
  box-shadow: 0 4px 0 #1565c0;
}
.btn-secondary:active:not(:disabled) { box-shadow: none; transform: translateY(4px) scale(0.97); }

.screen {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  min-height: 100vh;
}

h1 { font-size: 2rem; font-weight: 800; }
h2 { font-size: 1.4rem; font-weight: 700; }
```

- [ ] **Step 2: Write `main.jsx`**

Create `school-aide/src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 3: Write `App.jsx`**

Create `school-aide/src/App.jsx`:

```jsx
import { useState } from 'react'
import { transcribeAudio } from './services/transcribe.js'
import { structureTranscript } from './services/structure.js'
import InputScreen from './components/InputScreen.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('input')
  const [assignments, setAssignments] = useState([])
  const [error, setError] = useState(null)

  async function handleSubmit(audioBlob) {
    setError(null)
    setScreen('loading')
    try {
      const transcript = await transcribeAudio(audioBlob)
      const { assignments: parsed } = await structureTranscript(transcript)
      setAssignments(parsed)
      setScreen('results')
    } catch (e) {
      setError(e.message ?? 'Something went wrong. Please try again.')
      setScreen('input')
    }
  }

  function handleReset() {
    setAssignments([])
    setScreen('input')
  }

  if (screen === 'loading') {
    return (
      <div
        className="screen"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}
      >
        <div style={{ fontSize: 64 }}>🎧</div>
        <h2>Listening to your class...</h2>
        <p style={{ color: 'var(--color-text-soft)' }}>This takes about 30 seconds.</p>
      </div>
    )
  }

  if (screen === 'results') {
    return <ResultsScreen assignments={assignments} onReset={handleReset} />
  }

  return <InputScreen onSubmit={handleSubmit} error={error} />
}
```

- [ ] **Step 4: Create placeholder components so the dev server doesn't crash**

Create `school-aide/src/components/InputScreen.jsx` (temporary):

```jsx
export default function InputScreen() {
  return <div style={{ padding: 32 }}>InputScreen coming in Task 5</div>
}
```

Create `school-aide/src/components/ResultsScreen.jsx` (temporary):

```jsx
export default function ResultsScreen() {
  return <div style={{ padding: 32 }}>ResultsScreen coming in Task 6</div>
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Open `localhost:5173` — expect the placeholder InputScreen text. No console errors.

- [ ] **Step 6: Commit**

```bash
git add school-aide/src/
git commit -m "feat: add App shell and global styles"
```

---

### Task 5: InputScreen component

**Files:**
- Modify: `school-aide/src/components/InputScreen.jsx` (replace placeholder)

**Interfaces:**
- Props: `onSubmit: (audioBlob: Blob) => void`, `error: string | null`
- Consumes: `useAudioRecorder` (Task 3)
- Produces: calls `onSubmit(blob)` when user taps "Make my task list"

- [ ] **Step 1: Replace `InputScreen.jsx` with full implementation**

```jsx
import { useState, useRef } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder.js'

const ALLOWED_EXTENSIONS = /\.(mp3|wav|ogg|webm|m4a|aac|flac)$/i
const ALLOWED_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/x-m4a']

export default function InputScreen({ onSubmit, error }) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const fileInputRef = useRef(null)
  const { isRecording, isSupported, startRecording, stopRecording, audioBlob: recordedBlob } = useAudioRecorder()

  const activeBlob = uploadedFile ?? recordedBlob

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_MIME.includes(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
      setFileError('Please choose an audio file (MP3, WAV, M4A, or similar).')
      setUploadedFile(null)
      return
    }
    setFileError(null)
    setUploadedFile(file)
  }

  async function handleRecordToggle() {
    if (isRecording) {
      await stopRecording()
      setUploadedFile(null)
    } else {
      startRecording()
      setUploadedFile(null)
    }
  }

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎓</div>
        <h1>school-aide</h1>
        <p style={{ color: 'var(--color-text-soft)', marginTop: 8 }}>
          Turn class recordings into simple task lists.
        </p>
      </div>

      {/* Upload */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
        <h2 style={{ marginBottom: 16 }}>📁 Upload a recording</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="btn-secondary"
          onClick={() => fileInputRef.current.click()}
          style={{ width: '100%', marginBottom: 8 }}
        >
          {uploadedFile ? `✅ ${uploadedFile.name}` : 'Choose audio file'}
        </button>
        {fileError && (
          <p style={{ color: '#e53935', fontSize: 14, marginTop: 6 }}>{fileError}</p>
        )}
      </div>

      {/* Record */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
        <h2 style={{ marginBottom: 16 }}>🎙️ Record live</h2>
        {!isSupported ? (
          <p style={{ color: 'var(--color-text-soft)' }}>
            Recording is not supported in this browser. Please upload an audio file instead.
          </p>
        ) : (
          <button
            className={isRecording ? 'btn-primary' : 'btn-secondary'}
            onClick={handleRecordToggle}
            style={{ width: '100%' }}
          >
            {isRecording ? '⏹️ Stop recording' : '⏺️ Start recording'}
          </button>
        )}
        {recordedBlob && !uploadedFile && (
          <p style={{ marginTop: 10, color: 'var(--color-success)', fontWeight: 700 }}>
            ✅ Recording ready!
          </p>
        )}
      </div>

      {/* Error from parent (transcription/structuring) */}
      {error && (
        <div style={{ background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 20, color: '#c62828' }}>
          <strong>Oops!</strong> {error}
        </div>
      )}

      {/* Submit */}
      <button
        className="btn-primary"
        style={{ width: '100%', fontSize: '1.1rem', padding: '18px' }}
        disabled={!activeBlob || isRecording}
        onClick={() => onSubmit(activeBlob)}
      >
        Make my task list →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser — input screen golden path**

Open `localhost:5173`. Check:
- Upload button opens native file picker
- Uploading a non-audio file shows the friendly error message
- Uploading an MP3 shows the filename and enables the submit button
- Record button toggles between start/stop states
- After stopping, "Recording ready!" appears and submit enables
- Submit button is disabled when no audio is selected and when recording is in progress
- All buttons are tall enough to tap comfortably on iPad (≥ 44 px)

- [ ] **Step 3: Commit**

```bash
git add school-aide/src/components/InputScreen.jsx
git commit -m "feat: add InputScreen with upload and live recording"
```

---

### Task 6: ResultsScreen + AssignmentCard + TaskItem

**Files:**
- Create: `school-aide/src/components/TaskItem.jsx`
- Create: `school-aide/src/components/AssignmentCard.jsx`
- Modify: `school-aide/src/components/ResultsScreen.jsx` (replace placeholder)

**Interfaces:**
- `ResultsScreen` props: `assignments: Array<{ title: string, tasks: string[] }>`, `onReset: () => void`
- `AssignmentCard` props: `title: string`, `tasks: string[]`, `colorIndex: number`
- `TaskItem` props: `text: string`

- [ ] **Step 1: Write `TaskItem.jsx`**

Create `school-aide/src/components/TaskItem.jsx`:

```jsx
import { useState } from 'react'

export default function TaskItem({ text }) {
  const [done, setDone] = useState(false)

  return (
    <li
      onClick={() => setDone((d) => !d)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 8px',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        background: done ? 'var(--color-done)' : 'transparent',
        borderRadius: 8,
        transition: 'background 0.2s',
        listStyle: 'none',
        userSelect: 'none',
        minHeight: 44,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: done ? 'none' : '3px solid var(--color-border)',
          background: done ? 'var(--color-success)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 800,
          transition: 'all 0.2s',
          marginTop: 2,
        }}
      >
        {done ? '✓' : ''}
      </span>
      <span
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          textDecoration: done ? 'line-through' : 'none',
          color: done ? 'var(--color-text-soft)' : 'var(--color-text)',
          transition: 'color 0.2s',
          flex: 1,
        }}
      >
        {text}
      </span>
    </li>
  )
}
```

- [ ] **Step 2: Write `AssignmentCard.jsx`**

Create `school-aide/src/components/AssignmentCard.jsx`:

```jsx
import TaskItem from './TaskItem.jsx'

const CARD_COLORS = [
  { bg: '#fff3e0', accent: '#ff9800' },
  { bg: '#e3f2fd', accent: '#2196f3' },
  { bg: '#f3e5f5', accent: '#9c27b0' },
  { bg: '#e8f5e9', accent: '#4caf50' },
  { bg: '#fce4ec', accent: '#e91e63' },
]

export default function AssignmentCard({ title, tasks, colorIndex }) {
  const color = CARD_COLORS[colorIndex % CARD_COLORS.length]

  return (
    <div
      style={{
        background: color.bg,
        borderRadius: 'var(--radius)',
        padding: 24,
        boxShadow: 'var(--shadow)',
        marginBottom: 20,
        borderLeft: `6px solid ${color.accent}`,
      }}
    >
      <h2 style={{ color: color.accent, marginBottom: 16 }}>{title}</h2>
      <ul style={{ padding: 0 }}>
        {tasks.map((task, i) => (
          <TaskItem key={i} text={task} />
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Replace `ResultsScreen.jsx` with full implementation**

```jsx
import AssignmentCard from './AssignmentCard.jsx'

export default function ResultsScreen({ assignments, onReset }) {
  if (assignments.length === 0) {
    return (
      <div className="screen" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🤔</div>
        <h2>No tasks found</h2>
        <p style={{ color: 'var(--color-text-soft)', margin: '12px 0 32px' }}>
          The recording did not have any clear assignments. Try again with a different recording.
        </p>
        <button className="btn-primary" onClick={onReset}>← Try again</button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
        <div>
          <div style={{ fontSize: 40 }}>📋</div>
          <h1 style={{ fontSize: '1.6rem', marginTop: 4 }}>Your tasks for today</h1>
          <p style={{ color: 'var(--color-text-soft)', fontSize: '0.95rem', marginTop: 4 }}>
            Tap each task when you finish it!
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={onReset}
          style={{ flexShrink: 0, fontSize: '0.9rem', padding: '10px 18px' }}
        >
          ← New list
        </button>
      </div>

      {assignments.map((a, i) => (
        <AssignmentCard key={i} title={a.title} tasks={a.tasks} colorIndex={i} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: End-to-end browser test (happy path)**

1. Copy `.env.example` to `.env` and fill in both API keys
2. Run `npm run dev` — open `localhost:5173`
3. Click "Start recording" and say: *"Today's homework: Math — do exercises 1 to 5 on page 10. Also read chapter 3 and write one sentence about it."*
4. Click "Stop recording" → "Make my task list"
5. Watch loading screen appear
6. Verify results screen shows colorful assignment cards with numbered tasks
7. Tap a task — verify green checkmark and strikethrough appear
8. Click "← New list" — verify input screen returns

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add school-aide/src/components/
git commit -m "feat: add ResultsScreen, AssignmentCard, TaskItem interactive checklist"
```

---

## Done Criteria

- [ ] `npm test` passes with no failures
- [ ] Happy path works end-to-end in browser: record audio → loading → colorful checklist → tap tasks
- [ ] File upload path works end-to-end
- [ ] Submit button stays disabled until audio is ready
- [ ] All tap targets ≥ 44 px (check on Safari dev tools mobile preview)
- [ ] No API keys in committed files
