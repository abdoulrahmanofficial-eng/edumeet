import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiSquares2X2,
  HiUser,
  HiMiniSpeakerWave,
} from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { VideoTile } from './VideoTile'
import { ScreenShareView } from './ScreenShareView'
import type { Room, RemoteParticipant, LocalParticipant } from 'livekit-client'
import type { ActiveReaction } from '../hooks/useReactions'

type ViewMode = 'grid' | 'speaker'

interface MeetingLayoutProps {
  room: Room
  participants: RemoteParticipant[]
  localParticipant: LocalParticipant | null
  localTrackVersion: number
  activeSpeaker: RemoteParticipant | null
  sharingParticipant: RemoteParticipant | null
  isSharing: boolean
  onStopSharing: () => void
  handRaisedParticipants: Set<string>
  pinnedParticipant: string | null
  onPinParticipant: (sid: string | null) => void
  reactions: ActiveReaction[]
  className?: string
}

export function MeetingLayout({
  room,
  participants,
  localParticipant,
  localTrackVersion,
  activeSpeaker,
  sharingParticipant,
  isSharing: isSharingActive,
  onStopSharing,
  handRaisedParticipants,
  pinnedParticipant,
  onPinParticipant,
  reactions,
  className,
}: MeetingLayoutProps) {
  const { t, i18n } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('speaker')
  const isRTL = i18n.language === 'ar'

  const allTiles = useMemo(() => {
    const tiles: {
      participant: RemoteParticipant | LocalParticipant
      isLocal: boolean
      isSpeaking: boolean
      isPinned: boolean
    }[] = []

    if (localParticipant) {
      tiles.push({
        participant: localParticipant,
        isLocal: true,
        isSpeaking: false,
        isPinned: pinnedParticipant === localParticipant.sid,
      })
    }

    participants.forEach((p) => {
      tiles.push({
        participant: p,
        isLocal: false,
        isSpeaking: activeSpeaker?.sid === p.sid,
        isPinned: pinnedParticipant === p.sid,
      })
    })

    if (pinnedParticipant) {
      tiles.sort((a, b) => {
        if (a.isPinned) return -1
        if (b.isPinned) return 1
        return 0
      })
    }

    return tiles
  }, [localParticipant, participants, activeSpeaker, pinnedParticipant])

  const gridCols = useMemo(() => {
    const count = allTiles.length
    if (count <= 2) return 'grid-cols-1 sm:grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3'
    if (count <= 9) return 'grid-cols-3'
    return 'grid-cols-3 sm:grid-cols-4'
  }, [allTiles.length])

  const speakerTile = useMemo(() => {
    if (pinnedParticipant) {
      return allTiles.find((t) => t.isPinned)
    }
    if (activeSpeaker) {
      return allTiles.find((t) => !t.isLocal && t.isSpeaking)
    }
    return allTiles.find((t) => !t.isLocal) || allTiles[0]
  }, [allTiles, pinnedParticipant, activeSpeaker])

  const otherTiles = useMemo(() => {
    if (!speakerTile) return allTiles.slice(1)
    return allTiles.filter((t) => t.participant.sid !== speakerTile.participant.sid)
  }, [allTiles, speakerTile])

  if (isSharingActive && sharingParticipant) {
    return (
      <div className={cn('relative flex-1 flex flex-col', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex-1 p-2 sm:p-3">
          <ScreenShareView
            participant={sharingParticipant}
            isLocal={
              localParticipant?.sid === sharingParticipant.sid
            }
            onStopSharing={
              localParticipant?.sid === sharingParticipant.sid
                ? onStopSharing
                : undefined
            }
            className="w-full h-full"
          />
        </div>
        <div className="absolute right-4 bottom-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10">
          {speakerTile && (
            <VideoTile
              participant={speakerTile.participant}
              isLocal={speakerTile.isLocal}
              isSpeaking={speakerTile.isSpeaking}
              isPinned={speakerTile.isPinned}
              isHandRaised={handRaisedParticipants.has(speakerTile.participant.sid)}
              reactions={reactions}
              trackVersion={speakerTile.isLocal ? localTrackVersion : 0}
              onPin={
                !speakerTile.isLocal
                  ? () =>
                      onPinParticipant(
                        speakerTile.isPinned ? null : speakerTile.participant.sid,
                      )
                  : undefined
              }
              className="w-full h-full"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex-1 flex flex-col overflow-hidden',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-gray-900/60 backdrop-blur-md rounded-lg p-0.5 border border-white/10">
        <button
          onClick={() => setViewMode('speaker')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            viewMode === 'speaker'
              ? 'bg-primary-600/30 text-primary-400'
              : 'text-gray-400 hover:text-white',
          )}
          title={t('classroom.speakerView')}
        >
          <HiMiniSpeakerWave className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            viewMode === 'grid'
              ? 'bg-primary-600/30 text-primary-400'
              : 'text-gray-400 hover:text-white',
          )}
          title={t('classroom.gridView')}
        >
          <HiSquares2X2 className="w-4 h-4" />
        </button>
      </div>

      {viewMode === 'speaker' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 sm:p-3">
          <div className="flex-1 min-h-0">
            {speakerTile ? (
              <VideoTile
                participant={speakerTile.participant}
                isLocal={speakerTile.isLocal}
                isSpeaking={speakerTile.isSpeaking}
                isPinned={speakerTile.isPinned}
                isHandRaised={handRaisedParticipants.has(speakerTile.participant.sid)}
                reactions={reactions}
                trackVersion={speakerTile.isLocal ? localTrackVersion : 0}
                onPin={
                  !speakerTile.isLocal
                    ? () =>
                        onPinParticipant(
                          speakerTile.isPinned ? null : speakerTile.participant.sid,
                        )
                    : undefined
                }
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full rounded-2xl bg-gray-900">
                <HiUser className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {otherTiles.length > 0 && (
            <div className="flex lg:flex-col gap-2 lg:w-48 xl:w-56 overflow-x-auto lg:overflow-y-auto lg:max-h-full pb-1">
              {otherTiles.map((tile) => (
                <div
                  key={tile.participant.sid}
                  className="shrink-0 w-40 lg:w-full aspect-video lg:aspect-auto lg:h-24"
                >
                  <VideoTile
                    participant={tile.participant}
                    isLocal={tile.isLocal}
                    isSpeaking={tile.isSpeaking}
                    isPinned={tile.isPinned}
                    isHandRaised={handRaisedParticipants.has(tile.participant.sid)}
                    reactions={reactions}
                    trackVersion={tile.isLocal ? localTrackVersion : 0}
                    onPin={
                      !tile.isLocal
                        ? () =>
                            onPinParticipant(
                              tile.isPinned ? null : tile.participant.sid,
                            )
                        : undefined
                    }
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          <div className={cn('grid gap-2 sm:gap-3 auto-rows-fr', gridCols)}>
            <AnimatePresence>
              {allTiles.map((tile) => (
                <div key={tile.participant.sid} className="aspect-video">
                  <VideoTile
                    participant={tile.participant}
                    isLocal={tile.isLocal}
                    isSpeaking={tile.isSpeaking}
                    isPinned={tile.isPinned}
                    isHandRaised={handRaisedParticipants.has(tile.participant.sid)}
                    reactions={reactions}
                    trackVersion={tile.isLocal ? localTrackVersion : 0}
                    onPin={
                      !tile.isLocal
                        ? () =>
                            onPinParticipant(
                              tile.isPinned ? null : tile.participant.sid,
                            )
                        : undefined
                    }
                    className="w-full h-full"
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
