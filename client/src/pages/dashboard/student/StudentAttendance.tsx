import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiAcademicCap, HiCheckCircle, HiXCircle,
  HiClock, HiCalendarDays, HiUser,
} from 'react-icons/hi2'
import { useClassStore } from '@/store/classStore'
import { attendanceService } from '@/services/attendance'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate, formatTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Attendance } from '@/types'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
}

export default function StudentAttendance() {
  const { t } = useTranslation()
  const { classes, fetchClasses } = useClassStore()

  const [records, setRecords] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterClass, setFilterClass] = useState('all')

  useEffect(() => {
    fetchClasses()
    loadAttendance()
  }, [])

  const loadAttendance = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await attendanceService.getMyAttendance()
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = filterClass === 'all'
    ? records
    : records.filter((r) => r.classId === filterClass)

  const total = filtered.length
  const present = filtered.filter((r) => r.status === 'present').length
  const absent = filtered.filter((r) => r.status === 'absent').length
  const late = filtered.filter((r) => r.status === 'late').length
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  const statCards = [
    {
      label: 'Total Classes',
      value: total,
      icon: HiCalendarDays,
      color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20',
    },
    {
      label: 'Present',
      value: present,
      icon: HiCheckCircle,
      color: 'text-success-600 bg-success-50 dark:bg-success-900/20',
    },
    {
      label: 'Absent',
      value: absent,
      icon: HiXCircle,
      color: 'text-danger-600 bg-danger-50 dark:bg-danger-900/20',
    },
    {
      label: 'Late',
      value: late,
      icon: HiClock,
      color: 'text-warning-600 bg-warning-50 dark:bg-warning-900/20',
    },
    {
      label: 'Attendance %',
      value: `${attendanceRate}%`,
      icon: HiAcademicCap,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  const classOptions = [
    { value: 'all', label: t('common.all') },
    ...classes.map((c) => ({ value: c.id, label: c.title })),
  ]

  if (isLoading && records.length === 0) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (error && records.length === 0) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger-500 mb-4">{error}</p>
          <Button onClick={loadAttendance}>{t('common.retry')}</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Attendance"
        description="Your attendance history across all classes"
        actions={
          <Select
            options={classOptions}
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          />
        }
      />

      <motion.div
        variants={item}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6"
      >
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="text-center">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2', s.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={item}>
        <Card padding="none">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Attendance Records</h2>
          </div>
          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<HiAcademicCap className="w-8 h-8" />}
                title="No attendance records found"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary">Class</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const classInfo = classes.find((c) => c.id === r.classId)
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-text-primary">{classInfo?.title || 'Unknown Class'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-text-secondary">
                            {formatDate(r.joinTime)} {formatTime(r.joinTime)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              r.status === 'present'
                                ? 'success'
                                : r.status === 'late'
                                  ? 'warning'
                                  : 'danger'
                            }
                            dot
                          >
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-text-secondary">
                            {r.duration > 0 ? `${Math.round(r.duration / 60)} min` : '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
