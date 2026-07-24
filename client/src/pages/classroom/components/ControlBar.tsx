import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  HiMicrophone,
  HiSpeakerXMark,
  HiVideoCamera,
  HiVideoCameraSlash,
  HiComputerDesktop,
  HiChatBubbleLeftRight,
  HiUserGroup,
  HiHandRaised,
  HiEllipsisHorizontal,
  HiPaintBrush,
  HiCircleStack,
  HiCog6Tooth,
  HiPhone,
  HiClock,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ControlBarProps {
  isMuted: boolean
  isCameraOff: boolean
  isSharing: boolean
  isHandRaised: boolean
  userRole: 'teacher' | 'student'
  chatUnread: number
  meetingDuration: string
  onToggleMute: () => void
  onToggleCamera: () => void
  onToggleScreenShare: () => void
  onToggleChat: () => void
  onToggleParticipants: () => void
  onToggleHandRaise: () => void
  onOpenWhiteboard: () => void
  onEndRoom?: () => void
  onLeave: () => void
  className?: string
}

export function ControlBar({
  isMuted,
  isCameraOff,
  isSharing,
  isHandRaised,
  userRole,
  chatUnread,
  meetingDuration,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onToggleHandRaise,
  onOpenWhiteboard,
  onEndRoom,
  onLeave,
  className,
}: ControlBarProps) {
  const { t, i18n } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const isRTL = i18n.language === 'ar'

  const handleInvite = useCallback(async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success(isRTL ? 'تم نسخ رابط الدعوة!' : 'Invite link copied!')
    } catch {
      toast.error(isRTL ? 'تعذر نسخ الرابط' : 'Failed to copy link')
    }
    setShowMore(false)
  }, [isRTL])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      switch (e.key.toLowerCase()) {
        case 'm':
          e.preventDefault()
          onToggleMute()
          break
        case 'v':
          e.preventDefault()
          onToggleCamera()
          break
        case 's':
          e.preventDefault()
          onToggleScreenShare()
          break
        case 'c':
          e.preventDefault()
          onToggleChat()
          break
        case 'p':
          e.preventDefault()
          onToggleParticipants()
          break
      }
    },
    [onToggleMute, onToggleCamera, onToggleScreenShare, onToggleChat, onToggleParticipants],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={cn(
          'flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4',
          'bg-gray-900/90 backdrop-blur-xl border-t border-white/10',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <ControlButton
            icon={isMuted ? HiSpeakerXMark : HiMicrophone}
            label={isMuted ? t('classroom.unmute') : t('classroom.mute')}
            active={!isMuted}
            danger={isMuted}
            shortcut="M"
            onClick={onToggleMute}
          />
          <ControlButton
            icon={isCameraOff ? HiVideoCameraSlash : HiVideoCamera}
            label={isCameraOff ? t('classroom.videoOn') : t('classroom.videoOff')}
            active={!isCameraOff}
            danger={isCameraOff}
            shortcut="V"
            onClick={onToggleCamera}
          />
          <ControlButton
            icon={HiComputerDesktop}
            label={isSharing ? t('classroom.stopSharing') : t('classroom.shareScreen')}
            active={isSharing}
            shortcut="S"
            onClick={onToggleScreenShare}
          />

          <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

          <ControlButton
            icon={HiChatBubbleLeftRight}
            label={t('classroom.chat')}
            shortcut="C"
            badge={chatUnread}
            onClick={onToggleChat}
          />
          <ControlButton
            icon={HiUserGroup}
            label={t('classroom.participants')}
            shortcut="P"
            onClick={onToggleParticipants}
          />
          <ControlButton
            icon={HiArrowTopRightOnSquare}
            label={isRTL ? 'دعوة' : 'Invite'}
            onClick={handleInvite}
          />

          {userRole === 'student' && (
            <ControlButton
              icon={HiHandRaised}
              label={isHandRaised ? t('classroom.lowerHand') : t('classroom.raiseHand')}
              active={isHandRaised}
              onClick={onToggleHandRaise}
            />
          )}

          <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

          <div className="relative">
            <ControlButton
              icon={HiEllipsisHorizontal}
              label={t('common.more')}
              onClick={() => setShowMore(!showMore)}
            />
            {showMore && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMore(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'absolute bottom-full mb-2 z-50 min-w-[180px] bg-gray-800 border border-white/10 rounded-xl p-1.5 shadow-xl',
                    isRTL ? 'left-0' : 'right-0',
                  )}
                >
                  <MoreOption
                    icon={HiArrowTopRightOnSquare}
                    label={isRTL ? 'دعوة الطلاب' : 'Invite Students'}
                    onClick={handleInvite}
                  />
                  {userRole === 'teacher' && (
                    <MoreOption
                      icon={HiPhone}
                      label={t('classroom.endRoom')}
                      onClick={() => {
                        setShowMore(false)
                        setShowEndConfirm(true)
                      }}
                    />
                  )}
                  <MoreOption
                    icon={HiPaintBrush}
                    label={t('classroom.openWhiteboard')}
                    onClick={() => {
                      setShowMore(false)
                      onOpenWhiteboard()
                    }}
                  />
                  <MoreOption
                    icon={HiCircleStack}
                    label={t('classroom.record')}
                    onClick={() => setShowMore(false)}
                  />
                  <MoreOption
                    icon={HiCog6Tooth}
                    label={t('classroom.settings')}
                    onClick={() => setShowMore(false)}
                  />
                </motion.div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-2 text-gray-400 text-sm">
          <HiClock className="w-4 h-4" />
          <span className="tabular-nums font-mono">{meetingDuration}</span>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={<HiPhone className="w-4 h-4 rotate-135" />}
          onClick={() => setShowLeaveConfirm(true)}
          className="!bg-danger-500 hover:!bg-danger-600 !rounded-xl ml-2"
        >
          <span className="hidden sm:inline">{t('classroom.leave')}</span>
        </Button>
      </motion.div>

      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title={t('classroom.leave')}
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
            <HiPhone className="w-8 h-8 text-danger-500 rotate-135" />
          </div>
          <p className="text-sm text-text-secondary mb-6">
            {t('classroom.meetingEnded')}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowLeaveConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={onLeave}>
              {t('classroom.leave')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        title={t('classroom.endRoom')}
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
            <HiPhone className="w-8 h-8 text-danger-500 rotate-135" />
          </div>
          <p className="text-sm text-text-secondary mb-6">
            {t('classroom.endRoomConfirm')}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowEndConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => { setShowEndConfirm(false); onEndRoom?.(); }}>
              {t('classroom.endRoom')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function ControlButton({
  icon: Icon,
  label,
  active,
  danger,
  shortcut,
  badge,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
  danger?: boolean
  shortcut?: string
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] sm:min-w-[64px] py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl transition-all duration-200',
        active
          ? 'bg-primary-600/20 text-primary-400 hover:bg-primary-600/30'
          : danger
            ? 'bg-danger-500/20 text-danger-400 hover:bg-danger-500/30'
            : 'text-gray-400 hover:text-white hover:bg-white/10',
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] sm:text-[10px] leading-tight truncate max-w-full">
        {label}
      </span>
      {shortcut && (
        <span className="text-[8px] opacity-40 hidden sm:inline">({shortcut})</span>
      )}
    </button>
  )
}

function MoreOption({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}
