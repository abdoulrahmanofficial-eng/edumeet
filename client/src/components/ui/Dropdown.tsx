import { useState, useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { IconType } from 'react-icons'

interface DropdownItem {
  label: string
  icon?: IconType
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({
  trigger,
  items,
  align = 'left',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-1 min-w-[180px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-border/50 overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            <div className="py-1" role="menu">
              {items.map((item, i) => (
                <button
                  key={i}
                  role="menuitem"
                  onClick={() => {
                    item.onClick()
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-4 py-2 text-sm transition-colors',
                    item.variant === 'danger'
                      ? 'text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-700/50',
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
