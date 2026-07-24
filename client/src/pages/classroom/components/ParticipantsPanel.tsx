import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiMicrophone,
  HiSpeakerXMark,
  HiVideoCamera,
  HiVideoCameraSlash,
  HiHandRaised,
  HiMagnifyingGlass,
  HiXMark,
  HiUserGroup,
} from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { RemoteParticipant, LocalParticipant } from 'livekit-client'

interface ParticipantEntry {
  id: string
  name: string
  role: 'teacher' | 'student'
  isLocal: boolean
  isMuted: boolean
  isVideoOff: boolean
  isHandRaised: boolean
  participant: RemoteParticipant | LocalParticipant
}

interface ParticipantsPanelProps {
  participants: ParticipantEntry[]
  currentUserRole: 'teacher' | 'student'
  onMuteParticipant: (identity: string) => void
  onToggleVideo?: (identity: string, enable: boolean) => void
  onRemoveParticipant?: (identity: string) => void
  onClose: () => void
  isOpen: boolean
  className?: string
}

export function ParticipantsPanel({
  participants,
  currentUserRole,
  onMuteParticipant,
  onToggleVideo,
  onRemoveParticipant,
  onClose,
  isOpen,
  className,
}: ParticipantsPanelProps) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [cameraOffById, setCameraOffById] = useState<Record<string, boolean>>({})
  const isRTL = i18n.language === 'ar'

  const handleToggleVideo = (identity: string) => {
    const currentlyOff = !!cameraOffById[identity]
    setCameraOffById((prev) => ({ ...prev, [identity]: !currentlyOff }))
    onToggleVideo?.(identity, !currentlyOff)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return participants
    const q = search.toLowerCase()
    return participants.filter((p) => p.name.toLowerCase().includes(q))
  }, [participants, search])

  const teacherCount = participants.filter((p) => p.role === 'teacher').length
  const studentCount = participants.filter((p) => p.role === 'student').length

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            'flex flex-col h-full border-l border-white/10 bg-gray-900/95 backdrop-blur-xl overflow-hidden',
            className,
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <HiUserGroup className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold text-sm">
                {t('classroom.participants')}
              </h3>
              <Badge variant="primary" size="sm">
                {participants.length}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full bg-white/5 text-white text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary-500 placeholder-gray-500"
              />
            </div>
          </div>

          {teacherCount > 0 && (
            <div className="px-4 py-1">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                Teacher ({teacherCount})
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
            {filtered
              .filter((p) => p.role === 'teacher')
              .map((entry) => (
                <ParticipantRow
                  key={entry.id}
                  entry={entry}
                  currentUserRole={currentUserRole}
                  cameraOff={!!cameraOffById[entry.participant.identity]}
                  onMute={onMuteParticipant}
                  onToggleVideo={handleToggleVideo}
                  onRemove={onRemoveParticipant}
                />
              ))}

            {studentCount > 0 && (
              <div className="px-2 pt-3 pb-1">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                  Students ({studentCount})
                </span>
              </div>
            )}

            {filtered
              .filter((p) => p.role === 'student')
              .map((entry) => (
                <ParticipantRow
                  key={entry.id}
                  entry={entry}
                  currentUserRole={currentUserRole}
                  cameraOff={!!cameraOffById[entry.participant.identity]}
                  onMute={onMuteParticipant}
                  onToggleVideo={handleToggleVideo}
                  onRemove={onRemoveParticipant}
                />
              ))}

            {filtered.length === 0 && participants.length > 0 && (
              <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
                {t('common.noResultsFor', { query: search })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ParticipantRow({
  entry,
  currentUserRole,
  cameraOff,
  onMute,
  onToggleVideo,
  onRemove,
}: {
  entry: ParticipantEntry
  currentUserRole: 'teacher' | 'student'
  cameraOff: boolean
  onMute: (identity: string) => void
  onToggleVideo?: (identity: string, enable: boolean) => void
  onRemove?: (identity: string) => void
}) {
  const identity = entry.participant.identity
  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
      <div className="relative shrink-0">
        <Avatar name={entry.name} size="sm" />
        {entry.isHandRaised && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-warning-500 text-white text-[8px]">
            <HiHandRaised />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-white font-medium truncate">
            {entry.name}
            {entry.isLocal && ' (You)'}
          </span>
          {entry.role === 'teacher' && (
            <Badge variant="primary" size="sm">
              Teacher
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {entry.isMuted ? (
          <HiSpeakerXMark className="w-4 h-4 text-danger-400" />
        ) : (
          <HiMicrophone className="w-4 h-4 text-success-400" />
        )}
        {entry.isVideoOff ? (
          <HiVideoCameraSlash className="w-4 h-4 text-danger-400" />
        ) : (
          <HiVideoCamera className="w-4 h-4 text-success-400" />
        )}
        {currentUserRole === 'teacher' && !entry.isLocal && (
          <>
            <button
              onClick={() => onMute(identity)}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Mute microphone"
            >
              <HiSpeakerXMark className="w-3.5 h-3.5" />
            </button>
            {onToggleVideo && (
              <button
                onClick={() => onToggleVideo(identity, !cameraOff)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title={cameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {cameraOff ? (
                  <HiVideoCamera className="w-3.5 h-3.5" />
                ) : (
                  <HiVideoCameraSlash className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(identity)}
                className="p-1 rounded text-gray-400 hover:text-danger-400 hover:bg-white/10 transition-colors"
                title="Remove from meeting"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
