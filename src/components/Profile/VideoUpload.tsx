'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, Check, Play, Trash2, AlertCircle,
  Circle, Square, RotateCcw, Camera, ChevronDown, ChevronUp,
  Pause, RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoSlot {
  slot:        number
  label:       string
  description: string
  required:    boolean
}

interface ExistingVideo {
  slot:             number
  cloudfront_url:   string
  duration_seconds: number
}

interface VideoUploadProps {
  existingVideos?:  ExistingVideo[]
  onVideoUploaded?: (slot: number, url: string) => void
}

type UploadState = 'idle' | 'validating' | 'uploading' | 'confirming' | 'done' | 'error'
type RecordState = 'idle' | 'requesting' | 'ready' | 'recording' | 'paused' | 'preview' | 'error'
type SlotMode    = 'choose' | 'record' | 'upload'

interface SlotState {
  uploadState:  UploadState
  progress:     number
  error:        string | null
  url:          string | null
  duration:     number | null
  mode:         SlotMode
  recordState:  RecordState
  recordError:  string | null
  recordedBlob: Blob | null
  previewUrl:   string | null
  elapsed:      number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO_SLOTS: VideoSlot[] = [
  {
    slot:        0,
    label:       'Introduction Video',
    description: 'Required · 30–120 sec · Profile hidden until uploaded',
    required:    true,
  },
  {
    slot:        1,
    label:       'Extra Video 1',
    description: 'Optional · 30–120 sec · Show more of your personality',
    required:    false,
  },
  {
    slot:        2,
    label:       'Extra Video 2',
    description: 'Optional · 30–120 sec · A day in your life, a hobby…',
    required:    false,
  },
]

const MAX_DURATION = 120
const MIN_DURATION = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function validateVideoDuration(
  file: File
): Promise<{ valid: boolean; duration?: number; error?: string }> {
  return new Promise(resolve => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      const d = Math.round(video.duration)
      if (d < MIN_DURATION)
        resolve({ valid: false, error: `Too short (${d}s). Minimum ${MIN_DURATION}s.` })
      else if (d > MAX_DURATION)
        resolve({ valid: false, error: `Too long (${d}s). Maximum ${MAX_DURATION}s.` })
      else resolve({ valid: true, duration: d })
    }
    video.onerror = () => resolve({ valid: false, error: 'Could not read video file.' })
    video.src = URL.createObjectURL(file)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoUpload({
  existingVideos = [],
  onVideoUploaded,
}: VideoUploadProps) {

  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>(() => {
    const init: Record<number, SlotState> = {}
    VIDEO_SLOTS.forEach(({ slot }) => {
      const existing = existingVideos.find(v => v.slot === slot)
      init[slot] = {
        uploadState:  existing ? 'done' : 'idle',
        progress:     existing ? 100 : 0,
        error:        null,
        url:          existing?.cloudfront_url ?? null,
        duration:     existing?.duration_seconds ?? null,
        mode:         'choose',
        recordState:  'idle',
        recordError:  null,
        recordedBlob: null,
        previewUrl:   null,
        elapsed:      0,
      }
    })
    return init
  })

  const [previewSlot, setPreviewSlot]   = useState<number | null>(null)
  const [expandedTips, setExpandedTips] = useState(false)

  const fileInputRefs    = useRef<Record<number, HTMLInputElement | null>>({})
  const mediaRecorderRef = useRef<Record<number, MediaRecorder | null>>({})
  const streamRef        = useRef<Record<number, MediaStream | null>>({})
  const chunksRef        = useRef<Record<number, Blob[]>>({})
  const liveVideoRef     = useRef<Record<number, HTMLVideoElement | null>>({})
  const timerRef         = useRef<Record<number, ReturnType<typeof setInterval> | null>>({})

  useEffect(() => {
    return () => {
      Object.values(streamRef.current).forEach(s => s?.getTracks().forEach(t => t.stop()))
      Object.values(timerRef.current).forEach(t => t && clearInterval(t))
    }
  }, [])

  // ── State helper ───────────────────────────────────────────────

  const update = useCallback((slot: number, patch: Partial<SlotState>) => {
    setSlotStates(prev => ({ ...prev, [slot]: { ...prev[slot], ...patch } }))
  }, [])

  // ── Upload via presigned POST ──────────────────────────────────

  const uploadFile = useCallback(async (
    slot: number,
    file: File,
    durationSeconds: number
  ) => {
    update(slot, { uploadState: 'uploading', progress: 5, error: null })

    try {
      const normalizedFileType = file.type.split(';')[0].trim()

      // Step 1: Get presigned POST data
      const uploadRes = await fetch('/api/videos/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          slot,
          fileType: normalizedFileType,
          fileSize: file.size,
        }),
      })

      if (!uploadRes.ok) {
        const e = await uploadRes.json()
        throw new Error(e.error ?? 'Failed to get upload URL')
      }

      const { url, fields, s3Key, cloudfrontUrl } = await uploadRes.json()

      update(slot, { progress: 15 })

      // Step 2: Upload to S3 using multipart FormData POST
      await new Promise<void>((resolve, reject) => {
        const formData = new FormData()

        // Fields MUST come before the file
        Object.entries(fields as Record<string, string>).forEach(([key, value]) => {
          formData.append(key, value)
        })
        formData.append('file', file)

        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            update(slot, { progress: Math.round((e.loaded / e.total) * 72) + 15 })
          }
        }
        xhr.onload = () => {
          if (xhr.status === 204 || xhr.status === 200) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status} — ${xhr.responseText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error — check your connection'))
        xhr.onabort = () => reject(new Error('Upload was cancelled'))
        xhr.open('POST', url)
        xhr.send(formData)
      })

      update(slot, { progress: 92, uploadState: 'confirming' })

      // Step 3: Confirm — save metadata to Supabase
      const confirmRes = await fetch('/api/videos/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          slot,
          s3Key,
          cloudfrontUrl,
          durationSeconds,
        }),
      })

      if (!confirmRes.ok) {
        const e = await confirmRes.json()
        throw new Error(e.error ?? 'Failed to confirm upload')
      }

      update(slot, {
        uploadState: 'done',
        progress:    100,
        url:         cloudfrontUrl,
        duration:    durationSeconds,
        mode:        'choose',
      })
      onVideoUploaded?.(slot, cloudfrontUrl)

    } catch (err: any) {
      update(slot, {
        uploadState: 'error',
        error:       err.message ?? 'Upload failed',
        progress:    0,
      })
    }
  }, [update, onVideoUploaded])

  // ── File-pick handler ──────────────────────────────────────────

  const handleFileSelect = useCallback(async (slot: number, file: File) => {
    update(slot, { uploadState: 'validating', error: null })
    const validation = await validateVideoDuration(file)
    if (!validation.valid) {
      update(slot, { uploadState: 'error', error: validation.error ?? 'Invalid video' })
      return
    }
    await uploadFile(slot, file, validation.duration!)
  }, [update, uploadFile])

  // ── Camera / recording ─────────────────────────────────────────

  const startCamera = useCallback(async (slot: number) => {
    update(slot, { recordState: 'requesting', recordError: null })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      streamRef.current[slot] = stream
      update(slot, { recordState: 'ready' })
      setTimeout(() => {
        const el = liveVideoRef.current[slot]
        if (el) { el.srcObject = stream; el.play() }
      }, 100)
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access and try again.'
        : 'Could not access camera/microphone.'
      update(slot, { recordState: 'error', recordError: msg })
    }
  }, [update])

  const startRecording = useCallback((slot: number) => {
    const stream = streamRef.current[slot]
    if (!stream) return

    chunksRef.current[slot] = []
    const mimeType =
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
      MediaRecorder.isTypeSupported('video/webm')                 ? 'video/webm' :
                                                                    'video/mp4'

    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current[slot] = recorder

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current[slot].push(e.data)
    }

    recorder.onstop = () => {
      const blob       = new Blob(chunksRef.current[slot], { type: mimeType })
      const previewUrl = URL.createObjectURL(blob)
      update(slot, { recordedBlob: blob, previewUrl, recordState: 'preview' })
      streamRef.current[slot]?.getTracks().forEach(t => t.stop())
      streamRef.current[slot] = null
    }

    recorder.start(250)
    update(slot, { recordState: 'recording', elapsed: 0 })

    timerRef.current[slot] = setInterval(() => {
      setSlotStates(prev => {
        const current = prev[slot]
        const next    = current.elapsed + 1
        if (next >= MAX_DURATION) {
          clearInterval(timerRef.current[slot]!)
          mediaRecorderRef.current[slot]?.stop()
        }
        return { ...prev, [slot]: { ...current, elapsed: next } }
      })
    }, 1000)
  }, [update])

  const pauseRecording = useCallback((slot: number) => {
    mediaRecorderRef.current[slot]?.pause()
    clearInterval(timerRef.current[slot]!)
    update(slot, { recordState: 'paused' })
  }, [update])

  const resumeRecording = useCallback((slot: number) => {
    mediaRecorderRef.current[slot]?.resume()
    update(slot, { recordState: 'recording' })
    timerRef.current[slot] = setInterval(() => {
      setSlotStates(prev => {
        const current = prev[slot]
        const next    = current.elapsed + 1
        if (next >= MAX_DURATION) {
          clearInterval(timerRef.current[slot]!)
          mediaRecorderRef.current[slot]?.stop()
        }
        return { ...prev, [slot]: { ...current, elapsed: next } }
      })
    }, 1000)
  }, [update])

  const stopRecording = useCallback((slot: number) => {
    clearInterval(timerRef.current[slot]!)
    mediaRecorderRef.current[slot]?.stop()
  }, [])

  const retakeRecording = useCallback((slot: number) => {
    if (slotStates[slot].previewUrl) URL.revokeObjectURL(slotStates[slot].previewUrl!)
    update(slot, {
      recordState:  'idle',
      recordedBlob: null,
      previewUrl:   null,
      elapsed:      0,
      recordError:  null,
      mode:         'choose',
    })
  }, [slotStates, update])

  const confirmRecording = useCallback(async (slot: number) => {
    const { recordedBlob, elapsed } = slotStates[slot]
    if (!recordedBlob) return
    if (elapsed < MIN_DURATION) {
      update(slot, { recordError: `Video too short (${elapsed}s). Minimum ${MIN_DURATION}s.` })
      return
    }
    const mimeType = recordedBlob.type || 'video/webm'
    const ext      = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const file     = new File([recordedBlob], `recording.${ext}`, { type: mimeType })
    await uploadFile(slot, file, elapsed)
  }, [slotStates, update, uploadFile])

  const resetSlot = useCallback((slot: number) => {
    if (slotStates[slot].previewUrl) URL.revokeObjectURL(slotStates[slot].previewUrl!)
    streamRef.current[slot]?.getTracks().forEach(t => t.stop())
    streamRef.current[slot] = null
    clearInterval(timerRef.current[slot]!)
    update(slot, {
      uploadState:  'idle',
      progress:     0,
      error:        null,
      url:          null,
      duration:     null,
      mode:         'choose',
      recordState:  'idle',
      recordError:  null,
      recordedBlob: null,
      previewUrl:   null,
      elapsed:      0,
    })
  }, [slotStates, update])

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {VIDEO_SLOTS.map(({ slot, label, description, required }) => {
        const s           = slotStates[slot]
        const isUploading = (
          s.uploadState === 'uploading' ||
          s.uploadState === 'confirming' ||
          s.uploadState === 'validating'
        )

        return (
          <div
            key={slot}
            className={`rounded-2xl border-2 overflow-hidden transition-all ${
              s.uploadState === 'done'  ? 'border-green-300 bg-green-50'  :
              s.uploadState === 'error' ? 'border-red-300 bg-red-50'      :
              isUploading               ? 'border-blue-300 bg-blue-50'    :
              required                  ? 'border-rose-200 bg-rose-50/30' :
                                          'border-gray-200 bg-gray-50'
            }`}
          >
            {/* Hidden file input — always mounted so click works */}
            <input
              ref={el => { fileInputRefs.current[slot] = el }}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/3gpp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(slot, file)
                e.target.value = ''
              }}
            />

            <div className="p-5">

              {/* Slot header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    {required && (
                      <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                        Required
                      </span>
                    )}
                    {s.uploadState === 'done' && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Check size={10} /> Uploaded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
                {s.uploadState === 'done' && (
                  <button
                    onClick={() => resetSlot(slot)}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                )}
              </div>

              {/* ── DONE: video player ── */}
              {s.uploadState === 'done' && s.url && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-2">
                  {previewSlot === slot ? (
                    <video
                      src={s.url}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <button
                        onClick={() => setPreviewSlot(slot)}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                          <Play size={28} className="text-white fill-white ml-1" />
                        </div>
                        {s.duration && (
                          <span className="text-sm text-white/70">{formatTime(s.duration)}</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── UPLOADING: progress bar ── */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-blue-600 mb-1">
                    <span>
                      {s.uploadState === 'validating' ? 'Checking video…' :
                       s.uploadState === 'confirming' ? 'Saving…' :
                       'Uploading…'}
                    </span>
                    <span>{s.progress}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ── UPLOAD ERROR ── */}
              {s.uploadState === 'error' && s.error && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-100 rounded-xl p-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{s.error}</span>
                </div>
              )}

              {/* ── CHOOSE MODE ── */}
              {s.mode === 'choose' &&
               (s.uploadState === 'idle' || s.uploadState === 'error') && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Record */}
                  <button
                    onClick={() => update(slot, { mode: 'record', uploadState: 'idle', error: null })}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed transition-all ${
                      required
                        ? 'border-rose-300 text-rose-600 hover:bg-rose-50'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Camera size={24} />
                    <span className="text-sm font-medium">Record Video</span>
                    <span className="text-xs text-gray-400">Use camera</span>
                  </button>

                  {/* Upload — triggers always-mounted hidden input */}
                  <button
                    onClick={() => fileInputRefs.current[slot]?.click()}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed transition-all ${
                      required
                        ? 'border-rose-300 text-rose-600 hover:bg-rose-50'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Upload size={24} />
                    <span className="text-sm font-medium">Upload File</span>
                    <span className="text-xs text-gray-400">MP4, MOV, WebM</span>
                  </button>
                </div>
              )}

              {/* ── RECORD MODE ── */}
              {s.mode === 'record' &&
               s.uploadState !== 'done' &&
               !isUploading && (
                <div>

                  {/* Start camera */}
                  {s.recordState === 'idle' && (
                    <div className="text-center py-4">
                      <button
                        onClick={() => startCamera(slot)}
                        className="flex items-center gap-2 mx-auto bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-600 transition-all"
                      >
                        <Camera size={18} /> Start Camera
                      </button>
                      <button
                        onClick={() => update(slot, { mode: 'choose' })}
                        className="mt-3 text-sm text-gray-400 hover:text-gray-600 block mx-auto"
                      >
                        ← Back
                      </button>
                    </div>
                  )}

                  {/* Requesting */}
                  {s.recordState === 'requesting' && (
                    <div className="text-center py-6 text-gray-500">
                      <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm">Requesting camera access…</p>
                    </div>
                  )}

                  {/* Camera error */}
                  {s.recordState === 'error' && (
                    <div>
                      <div className="flex items-center gap-2 text-red-600 text-sm mb-3 bg-red-100 rounded-xl p-3">
                        <AlertCircle size={16} />
                        <span>{s.recordError}</span>
                      </div>
                      <button
                        onClick={() => update(slot, { recordState: 'idle', recordError: null })}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {/* Live preview + controls */}
                  {(s.recordState === 'ready' ||
                    s.recordState === 'recording' ||
                    s.recordState === 'paused') && (
                    <div>
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-3">
                        <video
                          ref={el => { liveVideoRef.current[slot] = el }}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />

                        {s.recordState === 'recording' && (
                          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white text-sm font-mono font-semibold">
                              {formatTime(s.elapsed)}
                            </span>
                          </div>
                        )}

                        {s.recordState === 'paused' && (
                          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
                            <Pause size={12} className="text-yellow-400" />
                            <span className="text-white text-sm font-mono font-semibold">
                              {formatTime(s.elapsed)}
                            </span>
                          </div>
                        )}

                        {(s.recordState === 'recording' || s.recordState === 'paused') && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                            <div
                              className={`h-full transition-all duration-1000 ${
                                s.elapsed > 90 ? 'bg-red-500' :
                                s.elapsed > 60 ? 'bg-yellow-400' :
                                                 'bg-green-400'
                              }`}
                              style={{ width: `${(s.elapsed / MAX_DURATION) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => retakeRecording(slot)}
                          className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-200 hover:bg-gray-100 transition-all"
                        >
                          <RotateCcw size={18} className="text-gray-500" />
                        </button>

                        {s.recordState === 'ready' && (
                          <button
                            onClick={() => startRecording(slot)}
                            className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-lg"
                          >
                            <Circle size={28} className="text-white fill-white" />
                          </button>
                        )}

                        {(s.recordState === 'recording' || s.recordState === 'paused') && (
                          <button
                            onClick={() => stopRecording(slot)}
                            className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-lg"
                          >
                            <Square size={22} className="text-white fill-white" />
                          </button>
                        )}

                        {s.recordState === 'recording' && (
                          <button
                            onClick={() => pauseRecording(slot)}
                            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-200 hover:bg-gray-100 transition-all"
                          >
                            <Pause size={18} className="text-gray-500" />
                          </button>
                        )}
                        {s.recordState === 'paused' && (
                          <button
                            onClick={() => resumeRecording(slot)}
                            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-200 hover:bg-gray-100 transition-all"
                          >
                            <Play size={18} className="text-gray-500" />
                          </button>
                        )}
                        {s.recordState === 'ready' && <div className="w-10 h-10" />}
                      </div>

                      {s.recordState === 'ready' && (
                        <p className="text-center text-xs text-gray-400 mt-3">
                          Tap the red button to start recording
                        </p>
                      )}
                      {s.recordState === 'recording' && (
                        <p className="text-center text-xs text-gray-400 mt-3">
                          Min {MIN_DURATION}s · Max {MAX_DURATION}s
                        </p>
                      )}
                    </div>
                  )}

                  {/* Preview recorded video */}
                  {s.recordState === 'preview' && s.previewUrl && (
                    <div>
                      {s.recordError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm mb-3 bg-red-100 rounded-xl p-3">
                          <AlertCircle size={16} />
                          <span>{s.recordError}</span>
                        </div>
                      )}
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-3">
                        <video
                          src={s.previewUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur px-3 py-1 rounded-full">
                          <span className="text-white text-xs font-mono">
                            {formatTime(s.elapsed)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => retakeRecording(slot)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                        >
                          <RefreshCw size={16} /> Retake
                        </button>
                        <button
                          onClick={() => confirmRecording(slot)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all"
                        >
                          <Upload size={16} /> Use This Video
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )
      })}

      {/* ── Tips accordion ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedTips(t => !t)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-xs text-amber-700 font-semibold">
            💡 Tips for a great intro video
          </span>
          {expandedTips
            ? <ChevronUp size={16} className="text-amber-500" />
            : <ChevronDown size={16} className="text-amber-500" />
          }
        </button>
        {expandedTips && (
          <ul className="px-4 pb-3 space-y-1.5 text-xs text-amber-600">
            <li>• <strong>Good lighting</strong> — face a window or bright lamp</li>
            <li>• <strong>Speak clearly</strong> — say your name, what you do, what you're looking for</li>
            <li>• <strong>Be yourself</strong> — authentic beats perfect every time</li>
            <li>• <strong>30–120 seconds</strong> — enough to make a real impression</li>
            <li>• <strong>Quiet space</strong> — background noise makes it hard to hear you</li>
            <li>• <strong>Smile!</strong> — warmth comes through on camera</li>
          </ul>
        )}
      </div>

    </div>
  )
}
