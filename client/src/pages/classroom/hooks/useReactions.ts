import { useState, useEffect, useCallback, useRef } from 'react'
import { ref, push, onChildAdded, off } from 'firebase/database'
import { db } from '@/firebase/config'

export type ReactionType = 'like' | 'clap' | 'laugh' | 'surprise' | 'celebrate'

export interface Reaction {
  id: string
  senderId: string
  senderName: string
  type: ReactionType
  timestamp: number
}

export interface ActiveReaction extends Reaction {
  tileId: string
}

const REACTION_TIMEOUT = 3000
const EMOJI_MAP: Record<ReactionType, string> = {
  like: '👍',
  clap: '👏',
  laugh: '😂',
  surprise: '😮',
  celebrate: '🎉',
}

interface UseReactionsReturn {
  reactions: ActiveReaction[]
  sendReaction: (meetingId: string, type: ReactionType) => void
}

export function useReactions(meetingId: string, localUserId: string, localName: string): UseReactionsReturn {
  const [reactions, setReactions] = useState<ActiveReaction[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!meetingId) return
    const reactionsRef = ref(db, `meetings/${meetingId}/reactions`)
    const handleNew = onChildAdded(reactionsRef, (snapshot) => {
      const data = snapshot.val() as Reaction
      if (!data) return
      const active: ActiveReaction = {
        ...data,
        id: snapshot.key!,
        tileId: data.senderId,
      }
      setReactions((prev) => [...prev, active])
      const timer = setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== active.id))
        timersRef.current.delete(active.id)
      }, REACTION_TIMEOUT)
      timersRef.current.set(active.id, timer)
    })

    return () => {
      off(reactionsRef, 'child_added', handleNew)
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
    }
  }, [meetingId])

  const sendReaction = useCallback(
    (meetingId: string, type: ReactionType) => {
      if (!meetingId) return
      const reactionsRef = ref(db, `meetings/${meetingId}/reactions`)
      push(reactionsRef, {
        senderId: localUserId,
        senderName: localName,
        type,
        timestamp: Date.now(),
      })
    },
    [localUserId, localName],
  )

  return { reactions, sendReaction }
}

export { EMOJI_MAP }
