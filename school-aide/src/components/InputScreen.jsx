import { useState, useRef } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder.js'

const ALLOWED_EXTENSIONS = /\.(mp3|wav|ogg|webm|m4a|aac|flac)$/i
const ALLOWED_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/x-m4a']

export default function InputScreen({ onSubmit, error }) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const fileInputRef = useRef(null)
  const { isRecording, isSupported, startRecording, stopRecording, audioBlob: recordedBlob } = useAudioRecorder()

  const activeBlob = uploadedFile ?? recordedBlob

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_MIME.includes(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
      setFileError('Please choose an audio file (MP3, WAV, M4A, or similar).')
      setUploadedFile(null)
      return
    }
    setFileError(null)
    setUploadedFile(file)
  }

  async function handleRecordToggle() {
    if (isRecording) {
      await stopRecording()
      setUploadedFile(null)
    } else {
      startRecording()
      setUploadedFile(null)
    }
  }

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎓</div>
        <h1>school-aide</h1>
        <p style={{ color: 'var(--color-text-soft)', marginTop: 8 }}>
          Turn class recordings into simple task lists.
        </p>
      </div>

      {/* Upload */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
        <h2 style={{ marginBottom: 16 }}>📁 Upload a recording</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="btn-secondary"
          onClick={() => fileInputRef.current.click()}
          style={{ width: '100%', marginBottom: 8 }}
        >
          {uploadedFile ? `✅ ${uploadedFile.name}` : 'Choose audio file'}
        </button>
        {fileError && (
          <p style={{ color: '#e53935', fontSize: 14, marginTop: 6 }}>{fileError}</p>
        )}
      </div>

      {/* Record */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', padding: 28, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
        <h2 style={{ marginBottom: 16 }}>🎙️ Record live</h2>
        {!isSupported ? (
          <p style={{ color: 'var(--color-text-soft)' }}>
            Recording is not supported in this browser. Please upload an audio file instead.
          </p>
        ) : (
          <button
            className={isRecording ? 'btn-primary' : 'btn-secondary'}
            onClick={handleRecordToggle}
            style={{ width: '100%' }}
          >
            {isRecording ? '⏹️ Stop recording' : '⏺️ Start recording'}
          </button>
        )}
        {recordedBlob && !uploadedFile && (
          <p style={{ marginTop: 10, color: 'var(--color-success)', fontWeight: 700 }}>
            ✅ Recording ready!
          </p>
        )}
      </div>

      {/* Error from parent (transcription/structuring) */}
      {error && (
        <div style={{ background: '#ffebee', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 20, color: '#c62828' }}>
          <strong>Oops!</strong> {error}
        </div>
      )}

      {/* Submit */}
      <button
        className="btn-primary"
        style={{ width: '100%', fontSize: '1.1rem', padding: '18px' }}
        disabled={!activeBlob || isRecording}
        onClick={() => onSubmit(activeBlob)}
      >
        Make my task list →
      </button>
    </div>
  )
}
