import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiHandThumbUp,
  HiHandRaised,
  HiFaceSmile,
  HiExclamationCircle,
  HiStar,
} from 'react-icons/hi2'
import { cn } from '@/utils/cn'
import type { ReactionType } from '../hooks/useReactions'

interface ReactionOverlayProps {
  onReaction: (type: ReactionType) => void
  className?: string
}

interface FloatingEmoji {
  id: string
  emoji: string
  x: number
}

const REACTIONS: { type: ReactionType; icon: typeof HiHandThumbUp; label: string; emoji: string }[] = [
  { type: 'like', icon: HiHandThumbUp, label: 'Like', emoji: '👍' },
  { type: 'clap', icon: HiHandRaised, label: 'Clap', emoji: '👏' },
  { type: 'laugh', icon: HiFaceSmile, label: 'Laugh', emoji: '😂' },
  { type: 'surprise', icon: HiExclamationCircle, label: 'Surprise', emoji: '😮' },
  { type: 'celebrate', icon: HiStar, label: 'Celebrate', emoji: '🎉' },
]

export function ReactionOverlay({ onReaction, className }: ReactionOverlayProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])

  const handleReaction = useCallback(
    (type: ReactionType) => {
      onReaction(type)
      const reaction = REACTIONS.find((r) => r.type === type)
      if (reaction) {
        const id = `${type}-${Date.now()}`
        const x = Math.random() * 60 + 20
        setFloatingEmojis((prev) => [...prev, { id, emoji: reaction.emoji, x }])
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((e) => e.id !== id))
        }, 2500)
      }
    },
    [onReaction],
  )

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1">
        {REACTIONS.map(({ type, icon: Icon, label }) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(type)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={label}
          >
            <Icon className="w-4 h-4" />
          </motion.button>
        ))}
      </div>

      <div className="absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none">
        <AnimatePresence>
          {floatingEmojis.map((fe) => (
            <motion.div
              key={fe.id}
              initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
              animate={{
                opacity: 0,
                y: -80,
                x: fe.x - 50,
                scale: 1.5,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute text-2xl"
              style={{ left: `${fe.x}%` }}
            >
              {fe.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
