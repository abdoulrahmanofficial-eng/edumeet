import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineCloudArrowUp,
  HiXMark,
  HiOutlineDocumentText,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineMusicalNote,
} from 'react-icons/hi2'
import { cn } from '@/utils/cn'

interface FileUploadProps {
  onUpload: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  label?: string
  className?: string
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return HiOutlinePhoto
  if (type.startsWith('video/')) return HiOutlineVideoCamera
  if (type.startsWith('audio/')) return HiOutlineMusicalNote
  return HiOutlineDocumentText
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  onUpload,
  accept,
  multiple = false,
  maxSize = 10,
  label,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFiles = (fileList: File[]): File[] => {
    const valid: File[] = []
    for (const file of fileList) {
      if (accept && !file.type.match(accept.replace('/*', '/'))) {
        setError(`File type "${file.type}" is not accepted`)
        continue
      }
      if (file.size > maxSize * 1024 * 1024) {
        setError(`"${file.name}" exceeds ${maxSize} MB limit`)
        continue
      }
      valid.push(file)
    }
    return valid
  }

  const handleFiles = (fileList: FileList | File[]) => {
    setError(null)
    const incoming = Array.from(fileList)
    const valid = validateFiles(incoming)
    const updated = multiple ? [...files, ...valid] : valid
    setFiles(updated)
    if (valid.length) onUpload(updated)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <p className="text-sm font-medium text-text-secondary mb-2">{label}</p>
      )}

      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        whileHover={{ scale: 1.005 }}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-border hover:border-primary-400 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800',
        )}
      >
        <HiOutlineCloudArrowUp className="w-10 h-10 text-text-tertiary mb-3" />
        <p className="text-sm font-medium text-text-primary">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          Max {maxSize} MB{multiple ? ', any files accepted' : ''}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInput}
          className="hidden"
        />
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-danger-500"
        >
          {error}
        </motion.p>
      )}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          <AnimatePresence>
            {files.map((file, i) => {
              const Icon = getFileIcon(file.type)
              return (
                <motion.li
                  key={`${file.name}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-border"
                >
                  <Icon className="w-5 h-5 text-text-tertiary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{file.name}</p>
                    <p className="text-xs text-text-tertiary">{formatSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="p-1 rounded-md text-text-tertiary hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
