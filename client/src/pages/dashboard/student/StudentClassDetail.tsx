import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  HiAcademicCap, HiArrowLeft, HiVideoCamera, HiPlay,
  HiDocumentText, HiClipboardDocumentList, HiMegaphone,
  HiCalendarDays, HiClock, HiUser, HiArrowDownTray,
  HiChevronRight,
} from 'react-icons/hi2'
import { useClassStore } from '@/store/classStore'
import { assignmentsService } from '@/services/assignments'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDuration, formatRelativeTime } from '@/utils/format'
import type { Assignment, Submission, Announcement, Meeting } from '@/types'
import api from '@/services/api'

type TabId = 'materials' | 'assignments' | 'announcements' | 'recordings'

export default function StudentClassDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentClass, isLoading: classLoading, error, fetchClass } = useClassStore()

  const [activeTab, setActiveTab] = useState<TabId>('materials')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tabLoading, setTabLoading] = useState(false)

  useEffect(() => {
    if (id) fetchClass(id)
  }, [id, fetchClass])

  useEffect(() => {
    if (!id) return
    if (activeTab === 'assignments') loadAssignments()
    else if (activeTab === 'announcements') loadAnnouncements()
    else if (activeTab === 'recordings') loadRecordings()
  }, [id, activeTab])

  const loadAssignments = async () => {
    if (!id) return
    setTabLoading(true)
    try {
      const data = await assignmentsService.getClassAssignments(id)
      setAssignments(data)
      const subMap: Record<string, Submission> = {}
      await Promise.all(
        data.map(async (a) => {
          try {
            const subs = await assignmentsService.getSubmissions(a.id)
            if (subs.length > 0) subMap[a.id] = subs[0]
          } catch {
            // no submission
          }
        }),
      )
      setSubmissions(subMap)
    } catch {
      toast.error(t('errors.loadFailed'))
    } finally {
      setTabLoading(false)
    }
  }

  const loadAnnouncements = async () => {
    if (!id) return
    setTabLoading(true)
    try {
      const data = await api.get<Announcement[]>(`/announcements/class/${id}`)
      setAnnouncements(data)
    } catch {
      setAnnouncements([])
    } finally {
      setTabLoading(false)
    }
  }

  const loadRecordings = async () => {
    if (!id) return
    setTabLoading(true)
    try {
      const data = await api.get<Meeting[]>(`/classes/${id}/meetings`)
      setMeetings(data.filter((m) => m.recordingUrl))
    } catch {
      setMeetings([])
    } finally {
      setTabLoading(false)
    }
  }

  const handleJoinMeeting = () => {
    if (!id || !currentClass?.currentMeetingId) return
    navigate(`/classroom/${currentClass.currentMeetingId}`)
  }

  const isLive = currentClass?.status === 'ongoing'

  if (classLoading && !currentClass) {
    return (
      <div>
        <div className="mb-6">
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (error && !currentClass) {
    return (
      <div>
        <button
          onClick={() => navigate('/student/classes')}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger-500 mb-4">{error}</p>
          <Button onClick={() => id && fetchClass(id)}>{t('common.retry')}</Button>
        </div>
      </div>
    )
  }

  if (!currentClass) return null

  const tabs = [
    { id: 'materials' as TabId, label: t('classes.materials'), icon: <HiDocumentText className="w-4 h-4" /> },
    { id: 'assignments' as TabId, label: t('assignments.title'), icon: <HiClipboardDocumentList className="w-4 h-4" />, badge: assignments.length || undefined },
    { id: 'announcements' as TabId, label: 'Announcements', icon: <HiMegaphone className="w-4 h-4" />, badge: announcements.length || undefined },
    { id: 'recordings' as TabId, label: t('recordings.title'), icon: <HiVideoCamera className="w-4 h-4" />, badge: meetings.length || undefined },
  ]

  const getAssignmentStatus = (a: Assignment): { label: string; variant: 'warning' | 'success' | 'default' | 'danger' | 'primary' } => {
    const sub = submissions[a.id]
    if (sub?.grade !== undefined) return { label: t('assignments.graded'), variant: 'success' }
    if (sub) return { label: t('assignments.submitted'), variant: 'primary' }
    if (new Date(a.dueDate) < new Date()) return { label: t('assignments.overdue'), variant: 'danger' }
    return { label: t('assignments.pending'), variant: 'warning' }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/student/classes')}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <HiArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
            <HiAcademicCap className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">{currentClass.title}</h1>
              {isLive && <Badge variant="success" dot>{t('meetings.live')}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <HiUser className="w-3.5 h-3.5" />
                {currentClass.teacherName}
              </span>
              <span className="flex items-center gap-1.5">
                <HiCalendarDays className="w-3.5 h-3.5" />
                {formatDate(currentClass.scheduledAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <HiClock className="w-3.5 h-3.5" />
                {currentClass.duration} min
              </span>
            </div>
          </div>
          {isLive && (
            <Button onClick={handleJoinMeeting} icon={<HiVideoCamera className="w-4 h-4" />}>
              {t('meetings.joinMeeting')}
            </Button>
          )}
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(tab) => setActiveTab(tab as TabId)} className="mb-6" />

      {tabLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : activeTab === 'materials' ? (
        <MaterialsTab classId={currentClass.id} />
      ) : activeTab === 'assignments' ? (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <EmptyState
              icon={<HiClipboardDocumentList className="w-8 h-8" />}
              title={t('assignments.noAssignments')}
            />
          ) : (
            assignments.map((a) => {
              const status = getAssignmentStatus(a)
              const sub = submissions[a.id]
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/student/assignments?assignment=${a.id}`)}
                  className="w-full text-left"
                >
                  <Card hover padding="md" className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{a.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {t('assignments.dueOn', { date: formatDate(a.dueDate) })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={status.variant as any}>{status.label}</Badge>
                      {sub?.grade !== undefined && (
                        <p className="text-xs text-text-secondary mt-1">
                          {t('assignments.grade')}: {sub.grade}
                        </p>
                      )}
                    </div>
                    <HiChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
                  </Card>
                </button>
              )
            })
          )}
        </div>
      ) : activeTab === 'announcements' ? (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <EmptyState
              icon={<HiMegaphone className="w-8 h-8" />}
              title="No announcements yet"
            />
          ) : (
            announcements.map((a) => (
              <Card key={a.id}>
                <div className="flex items-start gap-3">
                  <HiMegaphone className="w-5 h-5 text-warning-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{a.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{a.content}</p>
                    <p className="text-xs text-text-tertiary mt-2">{formatRelativeTime(a.createdAt)}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<HiVideoCamera className="w-8 h-8" />}
                title={t('recordings.noRecordings')}
              />
            </div>
          ) : (
            meetings.map((m) => (
              <Card key={m.id}>
                <div className="flex flex-col h-full">
                  <div className="w-full aspect-video rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <HiPlay className="w-10 h-10 text-text-tertiary" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{m.title}</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {formatDate(m.startTime)} &middot; {formatDuration(m.duration)}
                  </p>
                  <div className="mt-auto pt-3">
                    <Button
                      size="sm"
                      fullWidth
                      icon={<HiPlay className="w-4 h-4" />}
                      onClick={() => window.open(m.recordingUrl, '_blank')}
                    >
                      Watch
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function MaterialsTab({ classId }: { classId: string }) {
  const { t } = useTranslation()
  const [materials, setMaterials] = useState<{ name: string; url: string; type: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await api.get<{ name: string; url: string; type: string }[]>(`/classes/${classId}/materials`)
        setMaterials(data)
      } catch {
        setMaterials([])
      } finally {
        setLoading(false)
      }
    })()
  }, [classId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={<HiDocumentText className="w-8 h-8" />}
        title={t('classes.noMaterials')}
      />
    )
  }

  return (
    <div className="space-y-2">
      {materials.map((m, i) => (
        <Card key={i} padding="sm" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
            <HiDocumentText className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{m.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<HiArrowDownTray className="w-4 h-4" />}
            onClick={() => window.open(m.url, '_blank')}
          >
            {t('common.download')}
          </Button>
        </Card>
      ))}
    </div>
  )
}
