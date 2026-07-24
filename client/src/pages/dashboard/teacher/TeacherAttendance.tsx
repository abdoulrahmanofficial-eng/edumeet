import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowDownTray,
  HiOutlineCalendarDays,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import type { Class, Attendance } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatTime, formatDateTime, formatDuration } from '@/utils/format'

export default function TeacherAttendance() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { classes, fetchClasses } = useClassStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState('')

  useEffect(() => {
    Promise.all([fetchClasses()]).finally(() => setIsLoading(false))
  }, [fetchClasses])

  const classOptions = useMemo(
    () => [
      { value: '', label: t('Select a class') },
      ...classes.map((c: Class) => ({ value: c.id, label: c.title })),
    ],
    [classes, t],
  )

  const meetingOptions = useMemo(() => {
    if (!selectedClass) return [{ value: '', label: t('Select a class first') }]
    return [
      { value: '', label: t('All meetings') },
      { value: 'meeting-1', label: `${t('Session')} 1 - ${formatDateTime(new Date().toISOString())}` },
      { value: 'meeting-2', label: `${t('Session')} 2 - ${formatDateTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}` },
    ]
  }, [selectedClass, t])

  const attendanceData: Attendance[] = useMemo(() => {
    if (!selectedClass) return []
    return Array.from({ length: 12 }).map((_, i) => ({
      id: `att-${i}`,
      classId: selectedClass,
      meetingId: selectedMeeting || 'meeting-1',
      studentId: `st-${i}`,
      studentName: `Student ${i + 1}`,
      joinTime: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
      leaveTime: new Date(Date.now() + Math.random() * 30 * 60 * 1000).toISOString(),
      duration: Math.floor(Math.random() * 45) + 15,
      status: (['present', 'late', 'absent'] as const)[Math.floor(Math.random() * 3)],
    }))
  }, [selectedClass, selectedMeeting])

  const summary = useMemo(() => {
    const total = attendanceData.length
    const present = attendanceData.filter((a) => a.status === 'present').length
    const late = attendanceData.filter((a) => a.status === 'late').length
    const absent = attendanceData.filter((a) => a.status === 'absent').length
    const avgDuration = attendanceData.length > 0
      ? attendanceData.reduce((sum, a) => sum + a.duration, 0) / attendanceData.length
      : 0
    return { total, present, late, absent, avgDuration }
  }, [attendanceData])

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Join Time', 'Leave Time', 'Duration (min)', 'Status']
    const rows = attendanceData.map((a) => [
      a.studentName,
      formatDateTime(a.joinTime),
      formatDateTime(a.leaveTime),
      a.duration.toString(),
      a.status,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${selectedClass}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('Attendance exported'))
  }

  const attendanceColumns = [
    {
      key: 'studentName',
      label: t('Student'),
      render: (a: Attendance) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.studentName} size="sm" />
          <span className="text-sm font-medium text-text-primary">{a.studentName}</span>
        </div>
      ),
    },
    {
      key: 'joinTime',
      label: t('Join Time'),
      render: (a: Attendance) => (
        <span className="text-sm text-text-secondary">{a.joinTime ? formatTime(a.joinTime) : '-'}</span>
      ),
    },
    {
      key: 'leaveTime',
      label: t('Leave Time'),
      render: (a: Attendance) => (
        <span className="text-sm text-text-secondary">{a.leaveTime ? formatTime(a.leaveTime) : '-'}</span>
      ),
    },
    {
      key: 'duration',
      label: t('Duration'),
      render: (a: Attendance) => (
        <span className="text-sm text-text-secondary">{a.duration} min</span>
      ),
    },
    {
      key: 'status',
      label: t('Status'),
      render: (a: Attendance) => (
        <Badge
          variant={a.status === 'present' ? 'success' : a.status === 'late' ? 'warning' : 'danger'}
          dot
        >
          {a.status}
        </Badge>
      ),
    },
  ]

  if (isLoading) {
    return (
    <>
        <PageHeader title={t('Attendance')} description={t('Track student attendance')} icon={<HiOutlineClipboardDocumentCheck className="w-5 h-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-64 w-full" />
    </>
    )
  }

  return (
      <>
      <PageHeader
        title={t('Attendance')}
        description={t('Track student attendance')}
        icon={<HiOutlineClipboardDocumentCheck className="w-5 h-5" />}
        actions={
          attendanceData.length > 0 && (
            <Button variant="secondary" icon={<HiOutlineArrowDownTray className="w-4 h-4" />} onClick={handleExportCSV}>
              {t('Export CSV')}
            </Button>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          label={t('Class')}
          options={classOptions}
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setSelectedMeeting('') }}
          className="w-full sm:w-64"
        />
        <Select
          label={t('Meeting')}
          options={meetingOptions}
          value={selectedMeeting}
          onChange={(e) => setSelectedMeeting(e.target.value)}
          className="w-full sm:w-64"
          disabled={!selectedClass}
        />
      </div>

      {!selectedClass ? (
        <EmptyState
          icon={<HiOutlineClipboardDocumentCheck className="w-8 h-8" />}
          title={t('Select a class')}
          description={t('Choose a class to view attendance records')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
                  <HiOutlineCheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">{t('Present')}</p>
                  <p className="text-lg font-bold text-text-primary">{summary.present}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center">
                  <HiOutlineExclamationTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">{t('Late')}</p>
                  <p className="text-lg font-bold text-text-primary">{summary.late}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
                  <HiOutlineXCircle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">{t('Absent')}</p>
                  <p className="text-lg font-bold text-text-primary">{summary.absent}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <HiOutlineClock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">{t('Avg Duration')}</p>
                  <p className="text-lg font-bold text-text-primary">{Math.round(summary.avgDuration)} min</p>
                </div>
              </div>
            </Card>
          </div>

          <Card padding="none">
            {attendanceData.length === 0 ? (
              <div className="p-5">
                <EmptyState title={t('No attendance records')} description={t('Attendance data will appear after class sessions')} />
              </div>
            ) : (
              <DataTable columns={attendanceColumns} data={attendanceData} />
            )}
          </Card>
        </>
      )}
      </>
  )
}
