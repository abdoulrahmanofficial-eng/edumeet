import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <motion.div
          animate={{ backgroundColor: checked ? '#6366f1' : '#d1d5db' }}
          className={cn(
            'w-10 h-6 rounded-full transition-colors',
            'dark:bg-gray-600',
          )}
        >
          <motion.div
            animate={{ x: checked ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-5 h-5 bg-white rounded-full shadow-sm mt-0.5"
          />
        </motion.div>
      </div>
      {label && (
        <span className="text-sm text-text-primary select-none">{label}</span>
      )}
    </label>
  )
}
