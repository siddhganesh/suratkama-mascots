/**
 * ImageUploader — Firebase Storage drag-and-drop image upload
 *
 * Modes
 * ─────────────────────────────────────────────────────────────
 * Firebase Mode : Drag & drop or click-to-browse → uploads to Firebase Storage
 *                 → auto-fills the download URL into the form
 * Mock/Demo Mode: Falls back to a standard URL text input + image preview,
 *                 so the admin panel works without Firebase Storage configured.
 */

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Link2, X, CheckCircle2, AlertCircle, Image } from 'lucide-react'

// Firebase Storage imports — only used when storage is available
import { isFirebaseEnabled } from '../../config/firebase'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

// ── Upload with progress using Firebase Storage ────────────────────────────────
async function uploadWithProgress(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  const { getStorage, ref, getDownloadURL } = await import('firebase/storage')
  const { app } = await import('../../config/firebase')
  if (!app) throw new Error('Firebase app not initialized')

  const storage = getStorage(app)
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storageRef = ref(storage, `mascot-images/${timestamp}-${safeName}`)

  const { uploadBytesResumable } = await import('firebase/storage')

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        onProgress(pct)
      },
      err => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 5

export default function ImageUploader({ value, onChange, label = 'Mascot Image' }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<'upload' | 'url'>(!isFirebaseEnabled ? 'url' : 'upload')
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, WebP or GIF images are supported.'
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSuccess(false)
    setUploading(true)
    setProgress(0)

    try {
      const url = await uploadWithProgress(file, setProgress)
      onChange(url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-brown-600 uppercase tracking-wider">{label}</label>

        {/* Mode toggle — only shown when Firebase is available */}
        {isFirebaseEnabled && (
          <div className="flex items-center gap-1 bg-brown-50 border border-brown-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                mode === 'upload' ? 'bg-white text-brown-800 shadow-sm' : 'text-brown-500'
              }`}
            >
              <Upload size={10} />Upload
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                mode === 'url' ? 'bg-white text-brown-800 shadow-sm' : 'text-brown-500'
              }`}
            >
              <Link2 size={10} />URL
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragging
                  ? 'border-brown-500 bg-brown-50'
                  : 'border-brown-200 bg-brown-50/50 hover:border-brown-400 hover:bg-brown-50'
              } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={handleInputChange}
              />

              {uploading ? (
                <div className="space-y-3">
                  <div className="w-10 h-10 mx-auto border-2 border-brown-200 border-t-brown-600 rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-brown-700">Uploading to Firebase Storage…</p>
                  <div className="w-full bg-brown-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-brown-500 to-brown-700 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-brown-500 font-bold">{progress}%</p>
                </div>
              ) : success ? (
                <div className="space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-green-500" />
                  <p className="text-sm font-semibold text-green-600">Uploaded successfully!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={28} className="mx-auto text-brown-400" />
                  <div>
                    <p className="text-sm font-semibold text-brown-700">
                      {dragging ? 'Drop image here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-xs text-brown-400 mt-1">JPEG, PNG, WebP, GIF — max {MAX_SIZE_MB}MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  <AlertCircle size={12} />
                  {error}
                  <button type="button" onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">
                    <X size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <input
              type="url"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="https://example.com/mascot-image.jpg"
              className="input-field bg-white text-brown-950 border-brown-200 w-full"
            />
            {!isFirebaseEnabled && (
              <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
                💡 Add Firebase config in <code className="bg-amber-50 px-1 rounded">.env</code> to enable direct image upload
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden border border-brown-200 bg-brown-50"
          >
            <img
              src={value}
              alt="Preview"
              className="w-full h-32 object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="absolute top-2 right-2">
              <button
                type="button"
                onClick={() => onChange('')}
                className="w-6 h-6 bg-white/90 backdrop-blur-sm border border-brown-200 rounded-full flex items-center justify-center text-brown-600 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
              <Image size={10} className="text-white" />
              <span className="text-[10px] text-white font-semibold">Preview</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
