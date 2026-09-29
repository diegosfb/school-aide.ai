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
