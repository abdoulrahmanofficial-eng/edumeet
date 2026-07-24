import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerReturn {
  elapsed: number
  formatted: string
  isRunning: boolean
  start: (fromTimestamp?: string) => void
  pause: () => void
  resume: () => void
  reset: () => void
}

export function useTimer(initialStart = false): UseTimerReturn {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(initialStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isRunning) {
      const now = Date.now()
      const offset = elapsed
      setStartTime(now)
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - now + offset)
      }, 1000)
    } else {
      clearTimer()
    }
    return clearTimer
  }, [isRunning, clearTimer])

  const start = useCallback((fromTimestamp?: string) => {
    if (fromTimestamp) {
      const from = new Date(fromTimestamp).getTime()
      const now = Date.now()
      const initial = Math.max(0, now - from)
      setElapsed(initial)
      setIsRunning(true)
    } else {
      setElapsed(0)
      setIsRunning(true)
    }
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true)
    }
  }, [isRunning])

  const reset = useCallback(() => {
    clearTimer()
    setElapsed(0)
    setIsRunning(false)
    setStartTime(null)
  }, [clearTimer])

  const hours = Math.floor(elapsed / 3600000)
  const minutes = Math.floor((elapsed % 3600000) / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)

  const formatted = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':')

  return { elapsed, formatted, isRunning, start, pause, resume, reset }
}
