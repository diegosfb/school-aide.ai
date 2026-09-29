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
