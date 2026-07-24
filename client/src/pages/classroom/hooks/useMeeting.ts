import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Room,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  RoomEvent,
  ConnectionState,
  createLocalAudioTrack,
  createLocalVideoTrack,
  type TrackPublication,
  type LocalTrack,
  type VideoPreset,
} from 'livekit-client'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { meetingsService } from '@/services/meetings'

interface UseMeetingOptions {
  token: string
  serverUrl?: string
  onLeave?: () => void
}

interface UseMeetingReturn {
  room: Room | null
  isConnected: boolean
  connectionState: ConnectionState
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

export function useMeeting({
  token,
  serverUrl,
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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mediaStartedRef = useRef(false)
  const intentionalDisconnectRef = useRef(false)
  const isConnectedRef = useRef(isConnected)
  const onLeaveRef = useRef(onLeave)
  const tRef = useRef(t)
  isConnectedRef.current = isConnected
  onLeaveRef.current = onLeave
  tRef.current = t

  const updateParticipants = useCallback((r: Room) => {
    const list: RemoteParticipant[] = []
    r.remoteParticipants.forEach((p) => list.push(p))
    list.sort((a, b) => Number(a.joinedAt ?? 0) - Number(b.joinedAt ?? 0))
    setParticipants(list)
  }, [])

  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      if (roomRef.current) updateParticipants(roomRef.current)
    },
    [updateParticipants],
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
        if (roomRef.current) {
          updateParticipants(roomRef.current)
          setLocalParticipant(roomRef.current.localParticipant)
          setIsMuted(!roomRef.current.localParticipant.isMicrophoneEnabled)
          setIsCameraOff(!roomRef.current.localParticipant.isCameraEnabled)
        }
      } else if (
        state === ConnectionState.Disconnected &&
        isConnectedRef.current
      ) {
        setIsConnected(false)
        setLocalParticipant(null)
        setParticipants([])
        setActiveSpeaker(null)
        setSharingParticipant(null)
        setIsSharing(false)
        if (intentionalDisconnectRef.current) {
          intentionalDisconnectRef.current = false
        } else if (mediaStartedRef.current) {
          toast(tRef.current('classroom.connectionLost'), { icon: '⚠️' })
          onLeaveRef.current?.()
        }
      }
    },
    [updateParticipants],
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
        videoEncoding: { maxBitrate: 3500000, maxFramerate: 30 },
        videoSimulcastLayers: [
          { width: 1280, height: 720, encoding: { maxBitrate: 1700000, maxFramerate: 30 }, resolution: { width: 1280, height: 720 } },
          { width: 640, height: 360, encoding: { maxBitrate: 600000, maxFramerate: 30 }, resolution: { width: 640, height: 360 } },
        ] as VideoPreset[],
        audioPreset: { maxBitrate: 64000 },
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

  return {
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
  }
}
