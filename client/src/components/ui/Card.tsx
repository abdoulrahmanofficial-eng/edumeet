import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export function Card({
  children,
  className,
  hover = false,
  onClick,
  padding = 'md',
}: CardProps) {
  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      onClick={onClick}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      whileTap={onClick ? { scale: 0.995 } : undefined}
      className={cn(
        'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-border/50 shadow-sm',
        hover && 'hover:shadow-lg hover:border-border transition-all duration-200',
        onClick && 'cursor-pointer text-left w-full',
        paddings[padding],
        className,
      )}
    >
      {children}
    </Component>
  )
}
