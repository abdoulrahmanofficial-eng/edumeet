import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiPaperAirplane,
  HiFaceSmile,
  HiPaperClip,
  HiXMark,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2'
import { useTranslation } from 'react-i18next'
import { ref, push, onChildAdded, set, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from '@/firebase/config'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/utils/format'
import type { Message } from '@/types'

interface ChatPanelProps {
  meetingId: string
  userId: string
  userName: string
  userRole: 'teacher' | 'student'
  isOpen: boolean
  onClose: () => void
  className?: string
}

const quickEmojis = ['😀', '😂', '❤️', '👍', '🎉', '😮', '😢', '🔥', '👏', '🙌']

export function ChatPanel({
  meetingId,
  userId,
  userName,
  userRole,
  isOpen,
  onClose,
  className,
}: ChatPanelProps) {
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevOpenRef = useRef(false)
  const isRTL = i18n.language === 'ar'

  useEffect(() => {
    if (!meetingId) return
    const messagesRef = ref(db, `meetings/${meetingId}/messages`)
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(200))

    onChildAdded(messagesQuery, (snapshot) => {
      const data = snapshot.val() as Message
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === snapshot.key)) return prev
          return [...prev, { ...data, id: snapshot.key! }]
        })
        if (!isOpen) {
          setUnreadCount((c) => c + 1)
        }
      }
    })
  }, [meetingId, isOpen])

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setUnreadCount(0)
    }
    prevOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(
    async (type: 'text' | 'file' = 'text', content?: string) => {
      const text = content || input.trim()
      if (!text && type === 'text') return

      try {
        const messagesRef = ref(db, `meetings/${meetingId}/messages`)
        await push(messagesRef, {
          senderId: userId,
          senderName: userName,
          senderRole: userRole,
          content: type === 'text' ? text : content || '',
          timestamp: new Date().toISOString(),
          type,
        })
        setInput('')
      } catch {
        console.error('Failed to send message')
      }
    },
    [meetingId, input, userId, userName, userRole],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setInput((prev) => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
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
              <HiChatBubbleLeftRight className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold text-sm">
                {t('classroom.chat')}
              </h3>
              <Badge variant="primary" size="sm">
                {messages.length}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar"
          >
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  <p>{t('classroom.typeMessage')}</p>
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.senderId === userId
                const isSystem = msg.type === 'system'
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex flex-col',
                      isSystem && 'items-center',
                      !isSystem && (isOwn ? 'items-end' : 'items-start'),
                    )}
                  >
                    {isSystem ? (
                      <span className="text-xs text-gray-500 italic bg-white/5 px-3 py-1.5 rounded-full">
                        {msg.content}
                      </span>
                    ) : (
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2',
                          isOwn
                            ? 'bg-primary-600 text-white rounded-tr-md'
                            : 'bg-gray-800 text-gray-200 rounded-tl-md',
                        )}
                      >
                        {!isOwn && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium text-primary-300">
                              {msg.senderName}
                            </span>
                            {msg.senderRole === 'teacher' && (
                              <Badge variant="primary" size="sm">
                                Teacher
                              </Badge>
                            )}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <span className="text-[10px] opacity-60 mt-1 block text-right">
                          {formatRelativeTime(msg.timestamp)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <div className="shrink-0 border-t border-white/10 p-3">
            <div className="relative">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <HiFaceSmile className="w-5 h-5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('classroom.typeMessage')}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                />
                <button className="text-gray-400 hover:text-white transition-colors shrink-0">
                  <HiPaperClip className="w-5 h-5" />
                </button>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="p-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <HiPaperAirplane className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800 rounded-xl p-2 shadow-xl border border-white/10"
                  >
                    <div className="grid grid-cols-5 gap-1">
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiClick(emoji)}
                          className="p-2 hover:bg-white/10 rounded-lg text-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
