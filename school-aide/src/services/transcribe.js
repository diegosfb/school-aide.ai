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
