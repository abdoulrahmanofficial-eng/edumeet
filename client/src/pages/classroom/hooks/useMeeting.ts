import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Room,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  RoomEvent,
  ConnectionState,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
  type TrackPublication,
  type LocalTrack,
  VideoPreset,
} from 'livekit-client'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { meetingsService } from '@/services/meetings'

interface UseMeetingOptions {
  token: string
  serverUrl?: string
  role?: 'teacher' | 'student'
  onLeave?: () => void
}

interface UseMeetingReturn {
  room: Room | null
  isConnected: boolean
  connectionState: ConnectionState
  isReconnecting: boolean
  participants: RemoteParticipant[]
  localParticipant: LocalParticipant | null
  isMuted: boolean
  isCameraOff: boolean
  isSharing: boolean
  sharingParticipant: RemoteParticipant | null
  activeSpeaker: RemoteParticipant | null
  connect: () => Promise<void>
  disconnect: () => void
  toggleMute: () => Promise<void>
  toggleCamera: () => Promise<void>
  toggleScreenShare: () => Promise<void>
  muteParticipant: (identity: string) => Promise<void>
  disableParticipantCamera: (identity: string) => Promise<void>
  enableParticipantCamera: (identity: string) => Promise<void>
  removeParticipant: (identity: string) => Promise<void>
  localTrackVersion: number
}

const VIDEO_QUALITY = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const

export function useMeeting({
  token,
  serverUrl,
  role,
  onLeave,
}: UseMeetingOptions): UseMeetingReturn {
  const { t } = useTranslation()
  const roomRef = useRef<Room | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  )
  const [participants, setParticipants] = useState<RemoteParticipant[]>([])
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isCameraOff, setIsCameraOff] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [sharingParticipant, setSharingParticipant] = useState<RemoteParticipant | null>(null)
  const [activeSpeaker, setActiveSpeaker] = useState<RemoteParticipant | null>(null)
  const [localTrackVersion, setLocalTrackVersion] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mediaStartedRef = useRef(false)
  const intentionalDisconnectRef = useRef(false)
  const isConnectedRef = useRef(isConnected)
  const onLeaveRef = useRef(onLeave)
  const tRef = useRef(t)
  const reconnectAttemptsRef = useRef(0)
  const applyVideoQualityRef = useRef(applyVideoQuality)
  isConnectedRef.current = isConnected
  onLeaveRef.current = onLeave
  tRef.current = t
  applyVideoQualityRef.current = applyVideoQuality

  const updateParticipants = useCallback((r: Room) => {
    const list: RemoteParticipant[] = []
    r.remoteParticipants.forEach((p) => list.push(p))
    list.sort((a, b) => Number(a.joinedAt ?? 0) - Number(b.joinedAt ?? 0))
    setParticipants(list)
  }, [])

  const applyVideoQuality = useCallback(
    (publication: TrackPublication, participant: RemoteParticipant) => {
      if (!role || publication.kind !== 'video' || publication.source === 'screen_share') return
      const track = publication.videoTrack
      if (!track || typeof (track as any).setVideoQuality !== 'function') return
      const publisherRole = participant.attributes?.role || 'student'
      if (role === 'student' && publisherRole === 'teacher') {
        ;(track as any).setVideoQuality(VIDEO_QUALITY.HIGH)
      } else if (role === 'teacher' && publisherRole !== 'teacher') {
        ;(track as any).setVideoQuality(VIDEO_QUALITY.LOW)
      }
    },
    [role],
  )

  const checkScreenShare = useCallback((participant: RemoteParticipant | LocalParticipant) => {
    const pub = participant.getTrackPublication(Track.Source.ScreenShare)
    if (pub?.videoTrack) {
      setSharingParticipant(participant as RemoteParticipant)
      setIsSharing(true)
    }
  }, [])

  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      if (roomRef.current) updateParticipants(roomRef.current)
      checkScreenShare(participant)
      participant.trackPublications.forEach((pub) => applyVideoQualityRef.current(pub, participant))
    },
    [updateParticipants, checkScreenShare],
  )

  const handleParticipantDisconnected = useCallback(
    (participant: RemoteParticipant) => {
      if (roomRef.current) updateParticipants(roomRef.current)
    },
    [updateParticipants],
  )

  const handleConnectionStateChanged = useCallback(
    (state: ConnectionState) => {
      setConnectionState(state)
      if (state === ConnectionState.Connected) {
        setIsConnected(true)
        setIsReconnecting(false)
        reconnectAttemptsRef.current = 0
        if (roomRef.current) {
          updateParticipants(roomRef.current)
          setLocalParticipant(roomRef.current.localParticipant)
          setIsMuted(!roomRef.current.localParticipant.isMicrophoneEnabled)
          setIsCameraOff(!roomRef.current.localParticipant.isCameraEnabled)
          roomRef.current.remoteParticipants.forEach((p) => {
            checkScreenShare(p)
            p.trackPublications.forEach((pub) => applyVideoQualityRef.current(pub, p))
          })
          setTimeout(() => {
            if (roomRef.current) {
              roomRef.current.remoteParticipants.forEach((p) => checkScreenShare(p))
            }
          }, 2000)
        }
      } else if (state === ConnectionState.Reconnecting) {
        setIsReconnecting(true)
      } else if (
        state === ConnectionState.Disconnected &&
        isConnectedRef.current
      ) {
        setIsConnected(false)
        setIsReconnecting(false)
        setLocalParticipant(null)
        setParticipants([])
        setActiveSpeaker(null)
        setSharingParticipant(null)
        setIsSharing(false)
        if (intentionalDisconnectRef.current) {
          intentionalDisconnectRef.current = false
        } else if (mediaStartedRef.current) {
          setIsReconnecting(true)
        }
      }
    },
    [updateParticipants, checkScreenShare],
  )

  const handleTrackPublished = useCallback(
    (publication: TrackPublication, participant: RemoteParticipant) => {
      if (
        publication.kind === 'video' &&
        publication.source === 'screen_share'
      ) {
        setSharingParticipant(participant)
        setIsSharing(true)
      }
    },
    [],
  )

  const handleTrackUnpublished = useCallback(
    (publication: TrackPublication, participant: RemoteParticipant) => {
      if (
        publication.kind === 'video' &&
        publication.source === 'screen_share'
      ) {
        if (sharingParticipant?.sid === participant.sid) {
          setSharingParticipant(null)
          setIsSharing(false)
        }
      }
    },
    [sharingParticipant],
  )

  const handleActiveSpeakersChanged = useCallback(
    (speakers: Participant[]) => {
      setActiveSpeaker(speakers[0] as RemoteParticipant ?? null)
    },
    [],
  )

  useEffect(() => {
    const r = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 1920, height: 1080 },
      },
      publishDefaults: {
        videoEncoding: { maxBitrate: 8000000, maxFramerate: 60 },
        videoSimulcastLayers: [
          new VideoPreset(1280, 720, 3000000, 60),
          new VideoPreset(640, 360, 1200000, 30),
        ],
        audioPreset: { maxBitrate: 256000 },
      },
    })

    r.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    r.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    r.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
    r.on(RoomEvent.TrackPublished, handleTrackPublished)
    r.on(RoomEvent.TrackUnpublished, handleTrackUnpublished)
    r.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
    r.on(RoomEvent.TrackMuted, () => {
      if (r.localParticipant) setIsMuted(!r.localParticipant.isMicrophoneEnabled)
    })
    r.on(RoomEvent.TrackUnmuted, () => {
      if (r.localParticipant) setIsMuted(!r.localParticipant.isMicrophoneEnabled)
    })
    r.on(RoomEvent.TrackSubscribed, (_track, publication, participant) => {
      if (
        publication.kind === 'video' &&
        publication.source === 'screen_share'
      ) {
        setSharingParticipant(participant as RemoteParticipant)
        setIsSharing(true)
      }
      applyVideoQualityRef.current(publication, participant as RemoteParticipant)
    })
    r.on(RoomEvent.LocalTrackPublished, () => {
      setLocalTrackVersion(v => v + 1)
    })
    r.on(RoomEvent.LocalTrackUnpublished, () => {
      setLocalTrackVersion(v => v + 1)
      setIsSharing(false)
      setSharingParticipant(null)
    })

    roomRef.current = r
    setRoom(r)

    return () => {
      r.removeAllListeners()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      intentionalDisconnectRef.current = true
      r.disconnect()
    }
  }, [])

  const connect = useCallback(async () => {
    if (!roomRef.current || !token) return
    if (
      roomRef.current.state === ConnectionState.Connected ||
      roomRef.current.state === ConnectionState.Connecting
    )
      return
    try {
      await roomRef.current.connect(serverUrl ?? 'wss://localhost:7880', token, {
        autoSubscribe: true,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect'
      throw new Error(message)
    }
  }, [token, serverUrl])

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      intentionalDisconnectRef.current = true
      roomRef.current.disconnect()
    }
    setIsConnected(false)
    setParticipants([])
    setLocalParticipant(null)
    setActiveSpeaker(null)
    setSharingParticipant(null)
    setIsSharing(false)
    onLeave?.()
  }, [onLeave])

  const toggleMute = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return
    mediaStartedRef.current = true
    const lp = roomRef.current.localParticipant
    const enabled = !lp.isMicrophoneEnabled
    await lp.setMicrophoneEnabled(enabled)
    setIsMuted(!enabled)
  }, [])

  const toggleCamera = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return
    mediaStartedRef.current = true
    const lp = roomRef.current.localParticipant
    const enabled = !lp.isCameraEnabled
    await lp.setCameraEnabled(enabled)
    setIsCameraOff(!enabled)
  }, [])

  const toggleScreenShare = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return
    const lp = roomRef.current.localParticipant
    try {
      if (isSharing && sharingParticipant?.sid === lp.sid) {
        await lp.setScreenShareEnabled(false)
        setIsSharing(false)
        setSharingParticipant(null)
      } else {
        await lp.setScreenShareEnabled(true)
        setIsSharing(true)
        setSharingParticipant(lp as unknown as RemoteParticipant)
      }
    } catch {
      toast.error(t('classroom.failedToShare'))
    }
  }, [isSharing, sharingParticipant, t])

  const muteParticipant = useCallback(
    async (identity: string) => {
      try {
        await meetingsService.muteParticipant(roomRef.current?.name ?? '', identity)
        toast.success(t('classroom.participantMuted'))
      } catch {
        toast.error(t('classroom.failedToMute'))
      }
    },
    [t],
  )

  const disableParticipantCamera = useCallback(
    async (identity: string) => {
      try {
        await meetingsService.disableParticipantCamera(roomRef.current?.name ?? '', identity)
        toast.success(t('classroom.participantCameraOff'))
      } catch {
        toast.error(t('classroom.failedToDisableVideo'))
      }
    },
    [t],
  )

  const removeParticipant = useCallback(
    async (identity: string) => {
      try {
        await meetingsService.removeParticipant(roomRef.current?.name ?? '', identity)
        toast.success(t('classroom.participantRemoved'))
      } catch {
        toast.error(t('classroom.failedToRemove'))
      }
    },
    [t],
  )

  const enableParticipantCamera = useCallback(
    async (identity: string) => {
      try {
        await meetingsService.enableParticipantCamera(roomRef.current?.name ?? '', identity)
        toast.success(t('classroom.participantCameraOn'))
      } catch {
        toast.error(t('classroom.failedToEnableVideo'))
      }
    },
    [t],
  )

  useEffect(() => {
    if (!isReconnecting || isConnected || !token) return
    const interval = setInterval(async () => {
      try {
        if (!roomRef.current) return
        if (roomRef.current.state !== ConnectionState.Disconnected) {
          roomRef.current.disconnect()
        }
        console.log('[useMeeting] Attempting reconnect...')
        await connect()
        console.log('[useMeeting] Reconnect succeeded')
      } catch (err) {
        console.error('[useMeeting] Reconnect failed:', err)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isReconnecting, isConnected, token, connect])

  return {
    room,
    isConnected,
    connectionState,
    isReconnecting,
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
  }
}
