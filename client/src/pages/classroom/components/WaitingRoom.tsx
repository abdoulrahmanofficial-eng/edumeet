import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HiVideoCamera,
  HiVideoCameraSlash,
  HiMicrophone,
  HiSpeakerXMark,
  HiClock,
} from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

interface WaitingRoomProps {
  displayName: string
  onJoin: (opts: { audio: boolean; video: boolean }) => void
  className?: string
  tokenError?: string | null
}

export function WaitingRoom({ displayName, onJoin, className, tokenError }: WaitingRoomProps) {
  const { t, i18n } = useTranslation()
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const isRTL = i18n.language === 'ar'

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      await onJoin({ audio: audioEnabled, video: videoEnabled })
    } catch {
      // parent handles the error toast
    }
    setIsJoining(false)
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-gray-950 to-black',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-500/20 flex items-center justify-center"
          >
            <HiVideoCamera className="w-10 h-10 text-primary-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('classroom.waitingRoom')}
          </h1>
          <p className="text-gray-400 text-sm">
            {t('classroom.waitingRoom')}
          </p>
          {tokenError && (
            <p className="mt-3 text-xs text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-2">
              {tokenError}
            </p>
          )}
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-gray-800 aspect-video mb-6 shadow-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gray-700 flex items-center justify-center mb-3">
              {videoEnabled ? (
                <HiVideoCamera className="w-8 h-8 text-gray-400" />
              ) : (
                <HiVideoCameraSlash className="w-8 h-8 text-danger-400" />
              )}
            </div>
            <p className="text-white text-sm font-medium">{displayName}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all',
              audioEnabled
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-danger-500/20 text-danger-400 hover:bg-danger-500/30',
            )}
          >
            {audioEnabled ? (
              <HiMicrophone className="w-6 h-6" />
            ) : (
              <HiSpeakerXMark className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center transition-all',
              videoEnabled
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-danger-500/20 text-danger-400 hover:bg-danger-500/30',
            )}
          >
            {videoEnabled ? (
              <HiVideoCamera className="w-6 h-6" />
            ) : (
              <HiVideoCameraSlash className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6 text-gray-400 text-sm">
          <HiClock className="w-4 h-4" />
          <span>~2 {isRTL ? 'دقائق' : 'minutes'} estimated wait</span>
        </div>

        <Button
          onClick={handleJoin}
          loading={isJoining}
          fullWidth
          size="lg"
          className="text-base"
        >
          {t('classroom.join')}
        </Button>
      </motion.div>
    </div>
  )
}
