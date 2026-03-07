'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Star, AlertCircle, Loader2 } from 'lucide-react'

interface Photo {
  slot:  number
  url:   string
  s3Key: string
}

interface PhotoUploadProps {
  existingPhotos?: Photo[]
  onPhotosChanged?: (photos: Photo[]) => void
}

const TOTAL_SLOTS = 6

type SlotState = 'empty' | 'uploading' | 'done' | 'error'

interface SlotInfo {
  state:    SlotState
  progress: number
  error:    string | null
  photo:    Photo | null
}

export default function PhotoUpload({
  existingPhotos = [],
  onPhotosChanged,
}: PhotoUploadProps) {
  const [slots, setSlots] = useState<Record<number, SlotInfo>>(() => {
    const init: Record<number, SlotInfo> = {}
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const existing = existingPhotos.find(p => p.slot === i)
      init[i] = {
        state:    existing ? 'done' : 'empty',
        progress: existing ? 100 : 0,
        error:    null,
        photo:    existing ?? null,
      }
    }
    return init
  })

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const updateSlot = useCallback((slot: number, patch: Partial<SlotInfo>) => {
    setSlots(prev => ({ ...prev, [slot]: { ...prev[slot], ...patch } }))
  }, [])

  const uploadPhoto = useCallback(async (slot: number, file: File) => {
    updateSlot(slot, { state: 'uploading', progress: 5, error: null })

    try {
      const normalizedType = file.type.split(';')[0].trim()

      // Step 1: Get presigned POST
      const res = await fetch('/api/photos/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slot, fileType: normalizedType, fileSize: file.size }),
      })

      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error ?? 'Failed to get upload URL')
      }

      const { url, fields, s3Key, cloudfrontUrl } = await res.json()

      updateSlot(slot, { progress: 15 })

      // Step 2: Upload to S3
      await new Promise<void>((resolve, reject) => {
        const formData = new FormData()
        Object.entries(fields as Record<string, string>).forEach(([k, v]) => formData.append(k, v))
        formData.append('file', file)

        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            updateSlot(slot, { progress: Math.round((e.loaded / e.total) * 72) + 15 })
          }
        }
        xhr.onload  = () => (xhr.status === 204 || xhr.status === 200) ? resolve() : reject(new Error(`S3 ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', url)
        xhr.send(formData)
      })

      updateSlot(slot, { progress: 90 })

      // Step 3: Confirm — save to Supabase
      const confirmRes = await fetch('/api/photos/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slot, s3Key, cloudfrontUrl }),
      })

      if (!confirmRes.ok) {
        const e = await confirmRes.json()
        throw new Error(e.error ?? 'Failed to save photo')
      }

      const { photos } = await confirmRes.json()
      const newPhoto: Photo = { slot, url: cloudfrontUrl, s3Key }

      updateSlot(slot, { state: 'done', progress: 100, photo: newPhoto })
      onPhotosChanged?.(photos)

    } catch (err: any) {
      updateSlot(slot, { state: 'error', error: err.message ?? 'Upload failed', progress: 0 })
    }
  }, [updateSlot, onPhotosChanged])

  const deletePhoto = useCallback(async (slot: number) => {
    try {
      await fetch('/api/photos/confirm', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slot }),
      })
      updateSlot(slot, { state: 'empty', progress: 0, error: null, photo: null })
    } catch {
      updateSlot(slot, { error: 'Failed to delete' })
    }
  }, [updateSlot])

  const handleFileSelect = useCallback((slot: number, file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!allowed.includes(file.type.split(';')[0].trim().toLowerCase())) {
      updateSlot(slot, { state: 'error', error: 'Use JPEG, PNG, or WebP' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      updateSlot(slot, { state: 'error', error: 'Max 10MB per photo' })
      return
    }
    uploadPhoto(slot, file)
  }, [uploadPhoto, updateSlot])

  return (
    <div className="space-y-4">

      <p className="text-sm text-gray-500">
        Slot 0 is your <strong>profile picture</strong>. Add up to 6 photos total.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
          const s = slots[slot]
          const isProfile = slot === 0

          return (
            <div
              key={slot}
              className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                s.state === 'done'      ? 'border-green-300' :
                s.state === 'error'    ? 'border-red-300'   :
                s.state === 'uploading'? 'border-blue-300'  :
                isProfile              ? 'border-rose-200 border-dashed' :
                                         'border-gray-200 border-dashed'
              }`}
            >
              {/* ── Done: show photo ── */}
              {s.state === 'done' && s.photo && (
                <>
                  <img
                    src={s.photo.url}
                    alt={`Photo ${slot + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Profile badge */}
                  {isProfile && (
                    <div className="absolute top-1.5 left-1.5 bg-rose-500 rounded-full p-1">
                      <Star size={10} className="text-white fill-white" />
                    </div>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => deletePhoto(slot)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </>
              )}

              {/* ── Uploading: progress ── */}
              {s.state === 'uploading' && (
                <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={20} className="text-blue-500 animate-spin" />
                  <span className="text-xs text-blue-600 font-medium">{s.progress}%</span>
                  <div className="w-3/4 bg-blue-100 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ── Error ── */}
              {s.state === 'error' && (
                <button
                  onClick={() => fileInputRefs.current[slot]?.click()}
                  className="w-full h-full bg-red-50 flex flex-col items-center justify-center gap-1 p-2"
                >
                  <AlertCircle size={18} className="text-red-400" />
                  <span className="text-xs text-red-500 text-center leading-tight">{s.error}</span>
                  <span className="text-xs text-red-400">Tap to retry</span>
                </button>
              )}

              {/* ── Empty: upload button ── */}
              {s.state === 'empty' && (
                <button
                  onClick={() => fileInputRefs.current[slot]?.click()}
                  className={`w-full h-full flex flex-col items-center justify-center gap-1.5 transition-colors ${
                    isProfile
                      ? 'bg-rose-50 hover:bg-rose-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {isProfile ? (
                    <>
                      <Camera size={20} className="text-rose-400" />
                      <span className="text-xs text-rose-500 font-medium">Profile pic</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Photo {slot + 1}</span>
                    </>
                  )}
                </button>
              )}

              {/* Hidden file input */}
              <input
                ref={el => { fileInputRefs.current[slot] = el }}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(slot, file)
                  e.target.value = ''
                }}
              />
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Tap any slot to upload · Max 10MB per photo · JPEG, PNG, WebP
      </p>
    </div>
  )
}
