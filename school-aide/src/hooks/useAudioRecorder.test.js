import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAudioRecorder } from './useAudioRecorder.js'

describe('useAudioRecorder', () => {
  const originalMediaRecorder = global.MediaRecorder

  afterEach(() => {
    global.MediaRecorder = originalMediaRecorder
  })

  it('reports isSupported=false when MediaRecorder is unavailable', () => {
    delete global.MediaRecorder
    const { result } = renderHook(() => useAudioRecorder())
    expect(result.current.isSupported).toBe(false)
  })

  it('starts as not recording with null blob', () => {
    global.MediaRecorder = class {
      start() {}
      stop() {}
      addEventListener() {}
    }
    const { result } = renderHook(() => useAudioRecorder())
    expect(result.current.isRecording).toBe(false)
    expect(result.current.audioBlob).toBeNull()
  })
})
