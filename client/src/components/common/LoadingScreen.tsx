import { motion } from 'framer-motion'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingScreen({
  message = 'Loading...',
  fullScreen = true,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen && 'fixed inset-0 z-50 bg-white dark:bg-gray-950',
        className,
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Spinner size="lg" />
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-text-secondary"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}
