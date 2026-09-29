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
