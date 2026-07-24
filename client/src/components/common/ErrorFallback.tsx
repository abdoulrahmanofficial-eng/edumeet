import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
          <HiOutlineExclamationTriangle className="w-8 h-8 text-danger-500" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-sm text-text-secondary mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {resetError && (
          <Button variant="primary" onClick={resetError}>
            Try Again
          </Button>
        )}
      </Card>
    </div>
  )
}
