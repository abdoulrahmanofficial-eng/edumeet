import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiMicrophone,
  HiSpeakerXMark,
  HiHandRaised,
  HiPaperClip,
  HiOutlinePaperClip,
  HiSignal,
} from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import type { RemoteParticipant, LocalParticipant } from 'livekit-client'
import { Track } from 'livekit-client'
import type { ActiveReaction, ReactionType } from '../hooks/useReactions'

const EMOJI_MAP: Record<ReactionType, string> = {
  like: '👍',
  clap: '👏',
  laugh: '😂',
  surprise: '😮',
  celebrate: '🎉',
}

interface VideoTileProps {
  participant: RemoteParticipant | LocalParticipant
  isLocal?: boolean
  isSpeaking?: boolean
  isPinned?: boolean
  isHandRaised?: boolean
  reactions?: ActiveReaction[]
  onPin?: () => void
  className?: string
  trackVersion?: number
}

function ConnectionQualityDots({ quality }: { quality: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Quality: ${quality}/5`}>
      {Array.from({ length: quality }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 h-1.5 rounded-full',
            quality <= 2
              ? 'bg-danger-400'
              : quality === 3
                ? 'bg-warning-400'
                : 'bg-success-400',
          )}
        />
      ))}
    </div>
  )
}

export function VideoTile({
  participant,
  isLocal,
  isSpeaking,
  isPinned,
  isHandRaised,
  reactions,
  onPin,
  className,
  trackVersion = 0,
}: VideoTileProps) {
  const { t, i18n } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [hasVideo, setHasVideo] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(true)
  const displayName = participant.name || participant.identity || 'Unknown'
  const isRTL = i18n.language === 'ar'

  useEffect(() => {
    const attach = () => {
      const vidPub = isLocal
        ? (participant as LocalParticipant).getTrackPublication(Track.Source.Camera)
        : (participant as RemoteParticipant).getTrackPublication(Track.Source.Camera)
      if (vidPub?.videoTrack && videoRef.current) {
        vidPub.videoTrack.attach(videoRef.current)
        setHasVideo(true)
      } else if (!vidPub?.videoTrack) {
        setHasVideo(false)
      }

      if (!isLocal) {
        const audPub = (participant as RemoteParticipant).getTrackPublication(
          Track.Source.Microphone,
        )
        const at = audPub?.audioTrack
        if (at && audioRef.current && at.attachedElements.length === 0) {
          at.attach(audioRef.current)
        }
      }
    }

    attach()

    const onPub = () => {
      attach()
    }

    participant.on('trackPublished' as any, onPub)
    participant.on('trackUnpublished' as any, onPub)
    const interval = setInterval(() => {
      if (!videoRef.current?.srcObject) {
        attach()
      }
      if (!isLocal) {
        const remote = participant as RemoteParticipant
        const aud = remote.getTrackPublication(Track.Source.Microphone)
        const at = aud?.audioTrack
        if (at && audioRef.current && at.attachedElements.length === 0) {
          at.attach(audioRef.current)
        }
        setIsAudioMuted(aud?.isMuted ?? true)
      } else {
        const local = participant as LocalParticipant
        setIsAudioMuted(!local.isMicrophoneEnabled)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      participant.off('trackPublished' as any, onPub)
      participant.off('trackUnpublished' as any, onPub)
      const vidPub = isLocal
        ? (participant as LocalParticipant).getTrackPublication(Track.Source.Camera)
        : (participant as RemoteParticipant).getTrackPublication(Track.Source.Camera)
      if (vidPub?.videoTrack) {
        try {
          vidPub.videoTrack.detach(videoRef.current!)
        } catch {}
      }
      const audPub = isLocal
        ? null
        : (participant as RemoteParticipant).getTrackPublication(Track.Source.Microphone)
      if (audPub?.audioTrack) {
        try {
          audPub.audioTrack.detach(audioRef.current!)
        } catch {}
      }
    }
  }, [participant, isLocal, trackVersion])

  const tileReactions = reactions?.filter((r) => r.tileId === participant.sid) ?? []

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative rounded-2xl overflow-hidden bg-gray-900 group',
        'border-2 transition-colors duration-300',
        isSpeaking
          ? 'border-success-400 shadow-lg shadow-success-400/20'
          : isPinned
            ? 'border-primary-400'
            : 'border-transparent',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <video
        ref={videoRef}
        className={cn("w-full h-full object-cover", !hasVideo && "hidden")}
        autoPlay
        playsInline
        muted={isLocal}
      />
      {!isLocal && (
        <audio ref={audioRef} autoPlay />
      )}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center bg-gray-800",
        hasVideo && "hidden",
      )}>
        <Avatar
          name={displayName}
          size="xl"
          className="w-20 h-20 text-2xl ring-4 ring-white/10"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-1">
          {isHandRaised && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, -5, 0] }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-warning-500 text-white text-xs"
            >
              <HiHandRaised className="w-4 h-4" />
            </motion.span>
          )}
          {isPinned && (
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-500 text-white">
              <HiPaperClip className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        {onPin && !isLocal && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            className="pointer-events-auto p-1.5 rounded-lg bg-black/40 text-white/70 hover:text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
          >
            {isPinned ? (
              <HiPaperClip className="w-4 h-4" />
            ) : (
              <HiOutlinePaperClip className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-white text-xs font-medium truncate max-w-[120px]">
            {displayName}
            {isLocal && ` (${t('classroom.you')})`}
          </span>
          <span
            className={cn(
              'w-5 h-5 flex items-center justify-center rounded-full text-white text-xs',
              isAudioMuted ? 'bg-danger-500' : 'bg-success-500',
            )}
          >
            {isAudioMuted ? (
              <HiSpeakerXMark className="w-3 h-3" />
            ) : (
              <HiMicrophone className="w-3 h-3" />
            )}
          </span>
        </div>
        <ConnectionQualityDots quality={4} />
      </div>

      <AnimatePresence>
        {tileReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -80, opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-3xl pointer-events-none"
          >
            {EMOJI_MAP[r.type]}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
