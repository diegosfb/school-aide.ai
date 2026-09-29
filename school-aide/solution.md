# school-aide — Solution Overview

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPTURE                                                                │
│                                                                         │
│   Teacher speaks        Plaud device records       MP3 exported         │
│   class instructions ──► the full lesson      ──►  and uploaded        │
│                          in high quality            to school-aide      │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  TRANSCRIPTION                                                          │
│                                                                         │
│   AssemblyAI receives the audio file and converts speech to text.       │
│   The full lesson transcript is returned as plain text.                 │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ANALYSIS & BREAKDOWN  (OpenRouter → Claude)                            │
│                                                                         │
│   The transcript is sent to an LLM via OpenRouter.                      │
│   The model is instructed to:                                           │
│     1. Identify every assignment mentioned in the lesson                │
│     2. Break each into atomic, one-action steps                         │
│     3. Rewrite everything at grade 3–4 reading level                    │
│     4. Add a short "how to start" description per step                  │
│     5. Return a structured JSON object                                   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STUDENT VIEW  — Tasks presented like a recipe                          │
│                                                                         │
│   📋 Math Worksheet                                                     │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │ ○  Step 1: Open your math book.                                  │  │
│   │    Find your math book in your bag. Put it on your desk.         │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │ ○  Step 2: Turn to page 10.                                      │  │
│   │    Look for the number 10 at the bottom of the page.             │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │ ○  Step 3: Do the first five problems.                           │  │
│   │    Write your answers in the box next to each problem.           │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   The student taps each step when done. It turns green. ✓               │
│   One step at a time — no need to hold anything in memory.              │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │  student taps "Turn In Work"
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  TEACHER GRADING VIEW                                                   │
│                                                                         │
│   Only the completed tasks are shown to the teacher.                    │
│   The teacher taps ✓ Right or ✗ Wrong on each one.                      │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │ Math Worksheet                                                   │  │
│   │ Step 1: Open your math book.          [ ✓ Right ] [ ✗ Wrong ]   │  │
│   │ Step 2: Turn to page 10.              [ ✓ Right ] [ ✗ Wrong ]   │  │
│   └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Breakdown

### 1. Capture — Plaud Device

The teacher wears or places a **Plaud** recording device during the lesson. Plaud is a hardware AI recorder designed for high-quality, hands-free audio capture. The teacher speaks naturally — no special phrasing required. After class, the aide exports the recording as an MP3 and uploads it to school-aide.

> The same flow works with any MP3, WAV, or M4A file, or with live in-browser recording for real-time use.

---

### 2. Transcription — AssemblyAI

The audio file is sent to **AssemblyAI**, a speech-to-text service optimised for natural conversational speech. AssemblyAI handles:

- Background noise and classroom acoustics
- Multiple speakers and overlapping dialogue
- Filler words and natural speech patterns

The output is a full plain-text transcript of everything the teacher said.

---

### 3. Analysis & Breakdown — OpenRouter → Claude

The transcript is routed through **OpenRouter** to **Claude** (Anthropic). OpenRouter acts as a model gateway, giving access to best-in-class LLMs through a single API.

The LLM receives a structured prompt that instructs it to act as a classroom aide. It reads the raw transcript and produces a JSON object containing:

- **Assignments** — every distinct activity or piece of work the teacher mentioned
- **Tasks** — the atomic, one-action steps inside each assignment
- **Descriptions** — 1–2 sentence plain-language hints for each step, telling the student exactly how to begin

The language is automatically rewritten to grade 3–4 level: short sentences, active verbs, no jargon, no ambiguity.

**Example transformation:**

| Teacher said | School-aide output |
|---|---|
| "For reading, I want you to work through the comprehension questions on page 18 and give me a thoughtful written response for each one." | **Step 1:** Read question 1 on page 18. *Look at the first question at the bottom of the page.* **Step 2:** Write one sentence to answer it. *Use your own words. Write on the lines below the question.* |

---

### 4. Student View — Recipe-style Checklist

The structured tasks are displayed on an iPad as a **visual checklist**, designed like a recipe:

- One card per assignment, colour-coded
- One row per step, with the action in bold and the "how to" hint below it
- A large tap target for each row — the student taps it when done
- The row turns green with a checkmark; no step disappears or reorders
- The student works top-to-bottom at their own pace

This approach directly addresses the core challenges of learning disabilities:

- **No working memory required** — every step is always visible on screen
- **No ambiguity** — each step is a single, concrete action
- **Clear progress** — the student can see exactly how much is done and what remains
- **Self-pacing** — there is no timer, no pressure, no audience

---

### 5. Turn In Work — Teacher Grading

When the student finishes, they (or the aide) taps **Turn In Work**. The app collects all the tasks the student marked as done and presents them to the teacher on a grading screen.

The teacher reviews each completed task and taps:
- **✓ Right** — the task was completed correctly
- **✗ Wrong** — the task needs to be redone or reviewed

This gives the teacher a fast, structured summary of what each student accomplished without requiring the student to navigate a complex submission process.

---

## Why This Approach Works

| Design decision | Why it matters for kids with learning disabilities |
|---|---|
| Audio capture with Plaud | Teacher speaks naturally — no extra workflow burden |
| Automatic transcription | No aide needs to manually type or copy instructions |
| LLM rewriting to grade 3–4 level | Removes language processing as a barrier |
| Atomic one-action steps | Matches the working memory capacity of students with ADHD and cognitive delays |
| Recipe-style visual checklist | Provides external structure so students don't have to self-organise |
| Tap-to-complete interaction | Low cognitive and motor demand; clear positive feedback |
| Teacher grading in the same tool | Closes the loop without adding a separate system |
