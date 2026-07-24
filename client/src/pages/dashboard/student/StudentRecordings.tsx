import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiVideoCamera, HiPlay, HiMagnifyingGlass,
  HiCalendarDays, HiClock,
} from 'react-icons/hi2'
import { useClassStore } from '@/store/classStore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate, formatDuration } from '@/utils/format'
import api from '@/services/api'
import type { Meeting } from '@/types'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
}

export default function StudentRecordings() {
  const { t } = useTranslation()
  const { classes, fetchClasses } = useClassStore()

  const [recordings, setRecordings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('all')

  useEffect(() => {
    fetchClasses()
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get<Meeting[]>('/meetings/recorded')
      setRecordings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = recordings.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase())
    const matchClass = filterClass === 'all' || r.classId === filterClass
    return matchSearch && matchClass
  })

  const classOptions = [
    { value: 'all', label: t('common.all') },
    ...classes.map((c) => ({ value: c.id, label: c.title })),
  ]

  if (isLoading && recordings.length === 0) {
    return (
      <div>
        <PageHeader title={t('recordings.title')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error && recordings.length === 0) {
    return (
      <div>
        <PageHeader title={t('recordings.title')} />
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger-500 mb-4">{error}</p>
          <Button onClick={loadRecordings}>{t('common.retry')}</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title={t('recordings.title')}
        description={t('recordings.ready')}
      />

      <motion.div variants={cardItem} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder={t('recordings.searchRecordings')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<HiMagnifyingGlass className="w-4 h-4" />}
          />
        </div>
        <Select
          options={classOptions}
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        />
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<HiVideoCamera className="w-8 h-8" />}
          title={t('recordings.noRecordings')}
          description={search || filterClass !== 'all' ? t('common.noResults') : undefined}
        />
      ) : (
        <motion.div
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map((r) => {
            const classInfo = classes.find((c) => c.id === r.classId)
            return (
              <motion.div key={r.id} variants={cardItem}>
                <Card className="h-full flex flex-col">
                  <div className="relative w-full aspect-video rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 overflow-hidden group">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors z-10" />
                    <HiPlay className="w-12 h-12 text-text-tertiary group-hover:text-white transition-colors z-20" />
                    <button
                      onClick={() => window.open(r.recordingUrl, '_blank')}
                      className="absolute inset-0 z-30"
                      aria-label={`Watch ${r.title}`}
                    />
                  </div>

                  <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{r.title}</h3>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-text-secondary">
                    {classInfo && (
                      <span className="flex items-center gap-1">
                        <HiVideoCamera className="w-3.5 h-3.5" />
                        {classInfo.title}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <HiCalendarDays className="w-3.5 h-3.5" />
                      {formatDate(r.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiClock className="w-3.5 h-3.5" />
                      {formatDuration(r.duration)}
                    </span>
                  </div>

                  <div className="mt-auto pt-3">
                    <Button
                      size="sm"
                      fullWidth
                      icon={<HiPlay className="w-4 h-4" />}
                      onClick={() => window.open(r.recordingUrl, '_blank')}
                    >
                      Watch
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
