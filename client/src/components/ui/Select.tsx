import { type SelectHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <motion.div whileFocus={{ scale: 1.005 }}>
            <select
              ref={ref}
              id={selectId}
              className={cn(
                'w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary transition-all duration-200 appearance-none cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
                'dark:focus:ring-primary-400/20 dark:focus:border-primary-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                error && 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500',
                className,
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${selectId}-error` : undefined}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </motion.div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-tertiary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${selectId}-error`}
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

Select.displayName = 'Select'
