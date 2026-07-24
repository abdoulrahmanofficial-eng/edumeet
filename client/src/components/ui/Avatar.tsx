import { type ReactNode, useState } from 'react'
import { cn } from '@/utils/cn'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  online?: boolean
  onClick?: () => void
  fallback?: ReactNode
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const dotSizes = {
  sm: 'w-2.5 h-2.5 border',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
}

const bgColors = [
  'bg-primary-500',
  'bg-success-500',
  'bg-warning-500',
  'bg-danger-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-cyan-500',
]

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getColor(name?: string): string {
  if (!name) return bgColors[0]
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return bgColors[index % bgColors.length]
}

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  online,
  onClick,
  fallback,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const content = (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full shrink-0',
        sizes[size],
        !src || imgError ? getColor(name) : undefined,
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className,
      )}
      onClick={onClick}
      title={name}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : fallback ? (
        <span className="text-white font-medium">{fallback}</span>
      ) : (
        <span className="text-white font-medium">{getInitials(name)}</span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white dark:border-gray-900 bg-success-500',
            dotSizes[size],
          )}
        />
      )}
    </div>
  )

  return content
}
