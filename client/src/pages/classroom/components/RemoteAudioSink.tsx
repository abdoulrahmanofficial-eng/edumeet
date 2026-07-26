import { useEffect, useRef } from 'react'
import { Track } from 'livekit-client'
import type { RemoteParticipant } from 'livekit-client'

interface RemoteAudioSinkProps {
  participants: RemoteParticipant[]
}

export function RemoteAudioSink({ participants }: RemoteAudioSinkProps) {
  return (
    <>
      {participants.map((p) => (
        <AudioTrack key={p.sid} participant={p} />
      ))}
    </>
  )
}

function AudioTrack({ participant }: { participant: RemoteParticipant }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const attach = () => {
      const pub = participant.getTrackPublication(Track.Source.Microphone)
      const track = pub?.audioTrack
      if (track && audioRef.current && track.attachedElements.length === 0) {
        track.attach(audioRef.current)
      }
    }
    attach()
    const interval = setInterval(attach, 1000)
    return () => {
      clearInterval(interval)
      const pub = participant.getTrackPublication(Track.Source.Microphone)
      if (pub?.audioTrack && audioRef.current) {
        try {
          pub.audioTrack.detach(audioRef.current)
        } catch {}
      }
    }
  }, [participant])

  return <audio ref={audioRef} autoPlay />
}
