# How to Run school-aide

## Prerequisites

- **Node.js** 18 or later — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node)
- An **OpenRouter API key** — sign up at [openrouter.ai](https://openrouter.ai), go to Keys, create one (starts with `sk-or-`)
- An **AssemblyAI API key** — sign up at [assemblyai.com](https://www.assemblyai.com), go to your dashboard to copy the key

---

## Setup

### 1. Install dependencies

```bash
cd school-aide
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```
VITE_OPENROUTER_API_KEY=sk-or-your-key-here
VITE_ASSEMBLYAI_API_KEY=your-assemblyai-key-here
```

> **Important:** save the file, then continue. Vite reads `.env` at startup — if you edit it later, restart the dev server.

### 3. Start the app

```bash
npm run dev
```

Open your browser at **http://localhost:5173**

---

## Using the App

### Step 1 — Input screen

You have two options:

- **Upload a file** — tap "Choose audio file" and select an MP3, WAV, or M4A recording of the class
- **Record live** — tap "Start recording", speak the instructions, then tap "Stop recording"

Once you have audio, tap **Process recording**.

### Step 2 — Loading

The app transcribes the audio (AssemblyAI) and then asks the AI to structure it into assignments (OpenRouter). This takes **20–40 seconds** depending on audio length.

### Step 3 — Results screen (student view)

The structured assignments appear as coloured cards. Hand the iPad to the student.

The student taps each task as they complete it — it turns green with a checkmark.

When done, tap **Turn In Work**.

### Step 4 — Grading screen (teacher view)

The teacher sees only the completed tasks. Tap **✓ Right** or **✗ Wrong** on each one. Tap **← Back** when finished.

---

## Running on an iPad

1. Make sure your computer and iPad are on the **same Wi-Fi network**
2. Find your computer's local IP address:
   - **Mac:** System Settings → Wi-Fi → Details → IP Address (e.g. `192.168.1.42`)
   - **Windows:** run `ipconfig` in a terminal, look for IPv4 Address
3. On the iPad, open Safari and go to `http://192.168.1.42:5173`

> The iPad must stay on the same network as the computer running `npm run dev`.

---

## Running Tests

```bash
npm test
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Missing VITE_OPENROUTER_API_KEY" error | Check `.env` has the key, restart `npm run dev` |
| No activity on OpenRouter dashboard | Restart the dev server after editing `.env` |
| Upload failed | Check your AssemblyAI key in `.env` |
| Transcription timed out | Audio may be too long or AssemblyAI is slow — try again |
| Microphone button does nothing | Browser needs mic permission — check browser settings |
| iPad can't reach the app | Make sure both devices are on the same Wi-Fi network |
