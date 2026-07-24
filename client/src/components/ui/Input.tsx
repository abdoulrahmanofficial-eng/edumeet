import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, type = 'text', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-tertiary">
              {icon}
            </div>
          )}
          <motion.div
            whileFocus={{ scale: 1.005 }}
            className="relative"
          >
            <input
              ref={ref}
              id={inputId}
              type={type}
              className={cn(
                'w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
                'dark:focus:ring-primary-400/20 dark:focus:border-primary-400',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
                icon && 'pl-10',
                error && 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500',
                className,
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${inputId}-error` : undefined}
              {...props}
            />
          </motion.div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${inputId}-error`}
            role="alert"
            className="mt-1.5 text-xs text-danger-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
