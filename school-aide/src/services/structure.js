const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-3.5-sonnet'

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

  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'school-aide',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Here is what the teacher said:\n\n${transcript}\n\nReturn the JSON now.` },
      ],
    }),
  })

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  const raw = text
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')

  try {
    return JSON.parse(raw)
  } catch {
    return { assignments: [] }
  }
}
