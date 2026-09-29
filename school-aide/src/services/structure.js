const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4.5'
const OPENROUTER_KEY_PREFIX = 'sk-or-'

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
        {
          "text": "Step 1: Do this thing.",
          "description": "One or two short sentences. Tell the student exactly how to do it. Simple words only."
        }
      ]
    }
  ]
}

Rules for "description":
- 1 or 2 sentences only.
- Grade 3 words. No hard words.
- Say where to look, what to pick up, or what to do first.
- Example: "Open the red folder on your desk. Take out the top sheet."

If no assignments were mentioned, return: {"assignments": []}`

function getOpenRouterApiKey() {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY?.trim()
  if (!apiKey || apiKey === 'your_openrouter_key_here' || !apiKey.startsWith(OPENROUTER_KEY_PREFIX)) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY. Add a sk-or- OpenRouter key to .env, then restart npm run dev.')
  }
  return apiKey
}

export async function structureTranscript(transcript) {
  if (!transcript || transcript.trim() === '') {
    return { assignments: [] }
  }

  const apiKey = getOpenRouterApiKey()

  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-OpenRouter-Title': 'school-aide',
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

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${res.status}. If you just edited .env, restart npm run dev.`)
  }

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
