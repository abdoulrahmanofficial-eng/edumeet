import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/firebase/config'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { useMeetingStore } from '@/store/meetingStore'
import { meetingsService } from '@/services/meetings'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorFallback } from '@/components/common/ErrorFallback'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useMeeting } from './hooks/useMeeting'
import { useTimer } from './hooks/useTimer'
import { useReactions } from './hooks/useReactions'
import { MeetingLayout } from './components/MeetingLayout'
import { RemoteAudioSink } from './components/RemoteAudioSink'
import { ControlBar } from './components/ControlBar'
import { ChatPanel } from './components/ChatPanel'
import { ParticipantsPanel } from './components/ParticipantsPanel'
import { WaitingRoom } from './components/WaitingRoom'
import { ReactionOverlay } from './components/ReactionOverlay'
import type { RemoteParticipant, LocalParticipant, RemoteTrackPublication } from 'livekit-client'
import { ConnectionState, Track } from 'livekit-client'
import type { ReactionType } from './hooks/useReactions'

function ClassroomPageContent() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { fetchMeeting, currentMeeting, isLoading: meetingLoading, error: meetingError } = useMeetingStore()
  const isRTL = i18n.language === 'ar'

  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [showPreJoin, setShowPreJoin] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null)
  const [handRaisedParticipants, setHandRaisedParticipants] = useState<Set<string>>(new Set())

  const {
    room,
    isConnected,
    connectionState,
    participants,
    localParticipant,
    isMuted,
    isCameraOff,
    isSharing,
    sharingParticipant,
    activeSpeaker,
    connect,
    disconnect,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    muteParticipant,
    disableParticipantCamera,
    enableParticipantCamera,
    removeParticipant,
    localTrackVersion,
  } = useMeeting({
    token: token ?? '',
    serverUrl: import.meta.env.VITE_LIVEKIT_URL || undefined,
    onLeave: () => {
      useMeetingStore.getState().reset()
      navigate(`/${user?.role || 'student'}/dashboard`, { replace: true })
    },
  })

  const timer = useTimer()
  const { reactions, sendReaction } = useReactions(
    meetingId ?? '',
    user?.uid ?? '',
    user?.displayName ?? '',
  )

  useEffect(() => {
    if (!meetingId) return
    fetchMeeting(meetingId)
  }, [meetingId, fetchMeeting])

  useEffect(() => {
    if (!meetingId || !user) return
    setTokenLoading(true)
    setTokenError(null)
    useMeetingStore
      .getState()
      .getMeetingToken(meetingId)
      .then((t) => {
        setToken(t)
        setTokenLoading(false)
      })
      .catch((err) => {
        setTokenError(err instanceof Error ? err.message : 'Failed to get token')
        setTokenLoading(false)
      })
  }, [meetingId, user])

  useEffect(() => {
    if (currentMeeting?.startTime) {
      timer.start(currentMeeting.startTime)
    }
  }, [currentMeeting?.startTime, timer])

  const endInitiatedRef = useRef(false)
  const meetingExistedRef = useRef(false)

  useEffect(() => {
    if (!meetingId) return
    const meetingRef = ref(db, `meetings/${meetingId}`)
    const unsubscribe = onValue(meetingRef, (snapshot) => {
      if (snapshot.exists()) {
        meetingExistedRef.current = true
      } else if (meetingExistedRef.current && !endInitiatedRef.current) {
        toast.success(t('classroom.meetingEnded'))
        disconnect()
      }
    })
    return () => off(meetingRef, 'value')
  }, [meetingId, t, disconnect])

  const handleJoin = useCallback(
    async (opts: { audio: boolean; video: boolean }) => {
      if (!token) {
        toast.error(tokenError || 'Unable to join: no meeting token available')
        return
      }
      try {
        if (opts.video || opts.audio) {
          try {
            const ms = await navigator.mediaDevices.getUserMedia({ video: opts.video, audio: opts.audio })
            ms.getTracks().forEach(t => t.stop())
          } catch {
            toast.error('Camera/mic access denied')
            return
          }
        }
        if (!isConnected) {
          await connect()
        }
        if (opts.audio) {
          await toggleMute()
        }
        if (opts.video) {
          await toggleCamera()
        }
        setShowPreJoin(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('errors.general'))
      }
    },
    [token, tokenError, isConnected, connect, toggleMute, toggleCamera, t],
  )

  useEffect(() => {
    if (token && !isConnected && showPreJoin && connectionState !== ConnectionState.Connecting) {
      connect().catch(() => {})
    }
  }, [token, isConnected, showPreJoin, connectionState, connect])

  const handleLeave = useCallback(() => {
    timer.reset()
    disconnect()
  }, [timer, disconnect])

  const handleToggleHandRaise = useCallback(() => {
    setIsHandRaised((prev) => !prev)
  }, [])

  const handleEndRoom = useCallback(async () => {
    if (!meetingId) return
    endInitiatedRef.current = true
    try {
      await meetingsService.endMeeting(meetingId)
      toast.success(t('classroom.meetingEnded'))
      timer.reset()
      disconnect()
    } catch (err) {
      endInitiatedRef.current = false
      toast.error(err instanceof Error ? err.message : t('errors.general'))
    }
  }, [meetingId, timer, disconnect, t])

  const handleOpenWhiteboard = useCallback(() => {
    window.open(`/whiteboard/${meetingId}`, '_blank')
  }, [meetingId])

  const handleReaction = useCallback(
    (type: ReactionType) => {
      sendReaction(meetingId ?? '', type)
    },
    [meetingId, sendReaction],
  )

  const handlePinParticipant = useCallback((sid: string | null) => {
    setPinnedParticipant((prev) => (prev === sid ? null : sid))
  }, [])

  const viewerIsTeacher =
    user?.role === 'teacher' || user?.uid === currentMeeting?.teacherId

  const isTeacher = (identity?: string, role?: string) =>
    identity === currentMeeting?.teacherId || role === 'teacher'

  const visibleParticipants = viewerIsTeacher
    ? participants
    : participants.filter((p) => isTeacher(p.identity, p.attributes?.role as string))

  const participantEntries = [
    ...(localParticipant
      ? [
          {
            id: localParticipant.sid,
            name: user?.displayName || localParticipant.identity || 'You',
            role: user?.role || 'student',
            isLocal: true,
            isMuted,
            isVideoOff: isCameraOff,
            isHandRaised,
            participant: localParticipant as LocalParticipant,
          },
        ]
      : []),
    ...participants.map((p) => ({
      id: p.sid,
      name: p.name || p.identity || 'Unknown',
      role: (p.attributes?.role as 'teacher' | 'student') || 'student',
      isLocal: false,
      isMuted: true,
      isVideoOff: true,
      isHandRaised: handRaisedParticipants.has(p.sid),
      participant: p as RemoteParticipant,
    })),
  ]

  useEffect(() => {
    if (viewerIsTeacher) return
    participants.forEach((p) => {
      if (!isTeacher(p.identity, p.attributes?.role as string)) {
        p.getTrackPublications().forEach((pub) => {
          // Keep audio so students can HEAR each other; only hide video
          const isVideo =
            pub.source === Track.Source.Camera || pub.source === Track.Source.ScreenShare
          if (isVideo) {
            try {
              ;(pub as RemoteTrackPublication).setSubscribed(false)
            } catch {}
          }
        })
      }
    })
  }, [participants, viewerIsTeacher])

  const isLoading = meetingLoading || (tokenLoading && !tokenError)

  if (isLoading && !isConnected) {
    return <LoadingScreen message={t('classroom.reconnecting')} />
  }

  if (meetingError && !isConnected) {
    return (
      <ErrorFallback
        error={new Error(meetingError)}
        resetError={() => window.location.reload()}
      />
    )
  }

  if (showPreJoin) {
    return (
      <WaitingRoom
        displayName={user?.displayName || 'Guest'}
        onJoin={handleJoin}
        tokenError={tokenError}
      />
    )
  }

  return (
    <div
      className={cn(
        'h-screen flex flex-col bg-gray-950 text-white overflow-hidden',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <MeetingLayout
            room={room!}
            participants={visibleParticipants}
            localParticipant={localParticipant}
            localTrackVersion={localTrackVersion}
            activeSpeaker={activeSpeaker}
            sharingParticipant={sharingParticipant}
            isSharing={isSharing}
            onStopSharing={toggleScreenShare}
            handRaisedParticipants={handRaisedParticipants}
            pinnedParticipant={pinnedParticipant}
            onPinParticipant={handlePinParticipant}
            reactions={reactions}
          />
          <ControlBar
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isSharing={isSharing}
            isHandRaised={isHandRaised}
            userRole={user?.role || 'student'}
            chatUnread={0}
            meetingDuration={timer.formatted}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={toggleScreenShare}
            onToggleChat={() => {
              setShowChat((p) => !p)
              setShowParticipants(false)
            }}
            onToggleParticipants={() => {
              setShowParticipants((p) => !p)
              setShowChat(false)
            }}
            onToggleHandRaise={handleToggleHandRaise}
            onOpenWhiteboard={handleOpenWhiteboard}
            onEndRoom={handleEndRoom}
            onLeave={handleLeave}
          />
          {!viewerIsTeacher && (
            <RemoteAudioSink participants={participants} />
          )}
        </div>

        <AnimatePresence>
          {showChat && meetingId && user && (
            <ChatPanel
              meetingId={meetingId}
              userId={user.uid}
              userName={user.displayName}
              userRole={user.role}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showParticipants && (
          <ParticipantsPanel
            participants={participantEntries}
            currentUserRole={user?.role || 'student'}
            onMuteParticipant={muteParticipant}
            onToggleVideo={(identity, enable) =>
              enable ? enableParticipantCamera(identity) : disableParticipantCamera(identity)
            }
            onRemoveParticipant={removeParticipant}
            isOpen={showParticipants}
            onClose={() => setShowParticipants(false)}
          />
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-24 right-4 z-40">
        <ReactionOverlay onReaction={handleReaction} />
      </div>
    </div>
  )
}

export default function ClassroomPage() {
  return (
    <ErrorBoundary>
      <ClassroomPageContent />
    </ErrorBoundary>
  )
}
