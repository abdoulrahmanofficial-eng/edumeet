import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineVideoCamera,
  HiOutlineMagnifyingGlass,
  HiOutlinePlay,
  HiOutlineDocumentArrowDown,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineAcademicCap,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import type { Class } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDuration } from '@/utils/format'

interface Recording {
  id: string
  title: string
  classId: string
  className: string
  date: string
  duration: number
  url: string
  thumbnail?: string
}

export default function TeacherRecordings() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { classes, fetchClasses } = useClassStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')

  useEffect(() => {
    Promise.all([fetchClasses()]).finally(() => setIsLoading(false))
  }, [fetchClasses])

  const recordings: Recording[] = useMemo(() => {
    if (classes.length === 0) return []
    return classes.filter((c: Class) => c.status === 'completed').slice(0, 8).map((cls: Class, i) => ({
      id: `rec-${i}`,
      title: `${cls.title} - Session ${i + 1}`,
      classId: cls.id,
      className: cls.title,
      date: cls.scheduledAt,
      duration: cls.duration,
      url: '#',
    }))
  }, [classes])

  const filteredRecordings = useMemo(() => {
    return recordings.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.className.toLowerCase().includes(search.toLowerCase())
      const matchesClass = classFilter === 'all' || r.classId === classFilter
      return matchesSearch && matchesClass
    })
  }, [recordings, search, classFilter])

  const classOptions = useMemo(
    () => [
      { value: 'all', label: t('All Classes') },
      ...classes.map((c: Class) => ({ value: c.id, label: c.title })),
    ],
    [classes, t],
  )

  const handleDownload = (recording: Recording) => {
    toast.success(t(`Downloading: ${recording.title}`))
  }

  const handleDelete = (id: string) => {
    toast.success(t('Recording deleted'))
  }

  if (isLoading) {
    return (
    <>
        <PageHeader title={t('Recordings')} description={t('Browse and manage your recordings')} icon={<HiOutlineVideoCamera className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
    </>
    )
  }

  return (
      <>
      <PageHeader
        title={t('Recordings')}
        description={t('Browse and manage your recordings')}
        icon={<HiOutlineVideoCamera className="w-5 h-5" />}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder={t('Search recordings...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white dark:bg-gray-800/80 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
        <Select
          options={classOptions}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      {filteredRecordings.length === 0 ? (
        <EmptyState
          icon={<HiOutlineVideoCamera className="w-8 h-8" />}
          title={search || classFilter !== 'all' ? t('No matching recordings') : t('No recordings yet')}
          description={search || classFilter !== 'all' ? t('Try adjusting your search or filter') : t('Recordings will appear after meetings end')}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filteredRecordings.map((rec, idx) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card padding="none" className="h-full flex flex-col overflow-hidden">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center group cursor-pointer"
                    onClick={() => window.open(rec.url, '_blank')}
                  >
                    {rec.thumbnail ? (
                      <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover" />
                    ) : (
                      <HiOutlineVideoCamera className="w-12 h-12 text-white/40" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <HiOutlinePlay className="w-6 h-6 text-gray-900 ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge size="sm">
                        <HiOutlineClock className="w-3 h-3 mr-0.5" />
                        {formatDuration(rec.duration)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-text-primary mb-1 line-clamp-1">{rec.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary mb-3">
                      <HiOutlineAcademicCap className="w-3 h-3" />
                      {rec.className}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary mb-3">
                      <HiOutlineCalendarDays className="w-3 h-3" />
                      {formatDate(rec.date)}
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Button size="sm" variant="secondary" fullWidth icon={<HiOutlineDocumentArrowDown className="w-4 h-4" />}
                        onClick={() => handleDownload(rec)}
                      >
                        {t('Download')}
                      </Button>
                      <Button size="sm" variant="ghost" icon={<HiOutlineTrash className="w-4 h-4 text-danger-500" />}
                        onClick={() => handleDelete(rec.id)}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      </>
  )
}
