import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiStop, HiXMark } from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import type { RemoteParticipant, LocalParticipant } from 'livekit-client'
import { Track } from 'livekit-client'

interface ScreenShareViewProps {
  participant: RemoteParticipant | LocalParticipant
  isLocal: boolean
  onStopSharing?: () => void
  onClose?: () => void
  className?: string
}

export function ScreenShareView({
  participant,
  isLocal,
  onStopSharing,
  onClose,
  className,
}: ScreenShareViewProps) {
  const { t } = useTranslation()
  const screenRef = useRef<HTMLVideoElement>(null)
  const [hasScreen, setHasScreen] = useState(false)
  const hasScreenRef = useRef(false)
  const displayName = participant.name || participant.identity || 'Unknown'

  useEffect(() => {
    if (!screenRef.current) return
    const el = screenRef.current

    const tryAttach = () => {
      if (hasScreenRef.current) return
      let ts
      if (isLocal) {
        ts = (participant as LocalParticipant).getTrackPublication(Track.Source.ScreenShare)
      } else {
        ts = (participant as RemoteParticipant).getTrackPublication(Track.Source.ScreenShare)
      }
      if (ts?.videoTrack) {
        ts.videoTrack.attach(el)
        setHasScreen(true)
        hasScreenRef.current = true
        clearInterval(interval)
      }
    }

    const interval = setInterval(tryAttach, 500)
    tryAttach()

    return () => {
      clearInterval(interval)
      const ts = isLocal
        ? (participant as LocalParticipant).getTrackPublication(Track.Source.ScreenShare)
        : (participant as RemoteParticipant).getTrackPublication(Track.Source.ScreenShare)
      if (ts?.videoTrack && el) {
        try {
          ts.videoTrack.detach(el)
        } catch {}
      }
    }
  }, [participant, isLocal])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('relative w-full h-full bg-black rounded-2xl overflow-hidden', className)}
    >
      <video
        ref={screenRef}
        className={cn("w-full h-full object-contain", !hasScreen && "hidden")}
        autoPlay
        playsInline
      />
      {!hasScreen && (
        <div className="flex items-center justify-center h-full absolute inset-0">
          <div className="text-center text-white/50">
            <p className="text-lg">{t('classroom.shareScreen')}</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Avatar name={displayName} size="sm" />
        <span className="text-white text-sm font-medium bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
          {displayName}
          {isLocal && ` (${t('classroom.you')})`}
        </span>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isLocal && onStopSharing && (
          <button
            onClick={onStopSharing}
            className="flex items-center gap-2 px-3 py-1.5 bg-danger-500 hover:bg-danger-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <HiStop className="w-4 h-4" />
            {t('classroom.stopSharing')}
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 bg-black/40 hover:bg-black/60 text-white/70 hover:text-white rounded-lg transition-colors"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
