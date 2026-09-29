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
