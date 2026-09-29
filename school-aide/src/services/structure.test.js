import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('fetch', vi.fn(async (_url, { body }) => {
  const { messages } = JSON.parse(body)
  const input = messages.find((m) => m.role === 'user')?.content ?? ''

  let text
  if (input.includes('math worksheet')) {
    text = JSON.stringify({
      assignments: [{
        title: 'Math Worksheet',
        tasks: [
          { text: 'Step 1: Open your math book.', description: 'Find your math book in your bag.' },
          { text: 'Step 2: Do page 10.', description: 'Turn the pages until you see the number 10.' },
        ],
      }],
    })
  } else if (input.includes('json fences')) {
    text = '```json\n{"assignments":[]}\n```'
  } else {
    text = '{"assignments":[]}'
  }

  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content: text } }] }),
  }
}))

describe('structureTranscript', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_OPENROUTER_API_KEY', 'sk-or-test')
    fetch.mockClear()
  })

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

  it('strips markdown code fences from response', async () => {
    const { structureTranscript } = await import('./structure.js')
    const result = await structureTranscript('json fences test')
    expect(result).toEqual({ assignments: [] })
  })

  it('fails before fetch when OpenRouter key is missing', async () => {
    vi.stubEnv('VITE_OPENROUTER_API_KEY', '')
    const { structureTranscript } = await import('./structure.js')

    await expect(structureTranscript('Do math worksheet page 10.'))
      .rejects
      .toThrow('Missing VITE_OPENROUTER_API_KEY')
    expect(fetch).not.toHaveBeenCalled()
  })
})
