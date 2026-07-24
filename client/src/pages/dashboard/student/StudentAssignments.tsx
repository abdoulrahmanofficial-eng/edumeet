import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  HiClipboardDocumentList, HiChevronRight, HiCalendarDays,
  HiDocumentText, HiArrowUpTray, HiXMark,
} from 'react-icons/hi2'
import { useClassStore } from '@/store/classStore'
import { assignmentsService } from '@/services/assignments'
import { uploadService } from '@/services/upload'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileUpload } from '@/components/ui/FileUpload'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate, formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Assignment, Submission } from '@/types'

export default function StudentAssignments() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { classes, fetchClasses } = useClassStore()

  const [allAssignments, setAllAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterClass, setFilterClass] = useState('all')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchClasses()
    loadAllAssignments()
  }, [])

  useEffect(() => {
    const assignmentId = searchParams.get('assignment')
    if (assignmentId && allAssignments.length > 0) {
      const found = allAssignments.find((a) => a.id === assignmentId)
      if (found) {
        setSelectedAssignment(found)
      }
    }
  }, [searchParams, allAssignments])

  const loadAllAssignments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await fetchClasses()
      const classIds = classes.map((c) => c.id)
      const results = await Promise.allSettled(
        classIds.map((cid) => assignmentsService.getClassAssignments(cid)),
      )
      const all: Assignment[] = []
      const subMap: Record<string, Submission> = {}
      const subPromises: Promise<void>[] = []

      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          for (const a of r.value) {
            all.push(a)
            subPromises.push(
              assignmentsService.getSubmissions(a.id).then((subs) => {
                if (subs.length > 0) subMap[a.id] = subs[0]
              }).catch(() => {}),
            )
          }
        }
      })

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setAllAssignments(all)
      await Promise.all(subPromises)
      setSubmissions(subMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const openAssignment = async (a: Assignment) => {
    setSelectedAssignment(a)
    setSearchParams({ assignment: a.id }, { replace: true })
  }

  const closeDetail = () => {
    setSelectedAssignment(null)
    setSearchParams({}, { replace: true })
  }

  const filtered = filterClass === 'all'
    ? allAssignments
    : allAssignments.filter((a) => a.classId === filterClass)

  const getStatus = (a: Assignment): { label: string; variant: 'warning' | 'success' | 'default' | 'danger' | 'primary' } => {
    const sub = submissions[a.id]
    if (sub?.grade !== undefined) return { label: t('assignments.graded'), variant: 'success' }
    if (sub) return { label: t('assignments.submitted'), variant: 'primary' }
    if (new Date(a.dueDate) < new Date()) return { label: t('assignments.overdue'), variant: 'danger' }
    return { label: t('assignments.pending'), variant: 'warning' }
  }

  const classOptions = [
    { value: 'all', label: t('common.all') },
    ...classes.map((c) => ({ value: c.id, label: c.title })),
  ]

  if (isLoading && allAssignments.length === 0) {
    return (
      <div>
        <PageHeader title={t('assignments.title')} />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error && allAssignments.length === 0) {
    return (
      <div>
        <PageHeader title={t('assignments.title')} />
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger-500 mb-4">{error}</p>
          <Button onClick={loadAllAssignments}>{t('common.retry')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('assignments.title')}
        actions={
          <Select
            options={classOptions}
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          />
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<HiClipboardDocumentList className="w-8 h-8" />}
          title={t('assignments.noAssignments')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const status = getStatus(a)
            const sub = submissions[a.id]
            const classInfo = classes.find((c) => c.id === a.classId)
            return (
              <motion.button
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openAssignment(a)}
                className="w-full text-left"
              >
                <Card hover padding="md">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                      <HiClipboardDocumentList className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{a.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {classInfo?.title} &middot; {t('assignments.dueOn', { date: formatDate(a.dueDate) })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={status.variant as any}>{status.label}</Badge>
                      {sub?.grade !== undefined && (
                        <p className="text-xs font-medium text-text-primary mt-1">
                          {sub.grade} {t('assignments.points', { points: '' }).trim() || 'pts'}
                        </p>
                      )}
                    </div>
                    <HiChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
                  </div>
                </Card>
              </motion.button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedAssignment && (
          <AssignmentDetailModal
            assignment={selectedAssignment}
            submission={submissions[selectedAssignment.id]}
            onClose={closeDetail}
            onSubmitted={() => loadAllAssignments()}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AssignmentDetailModal({
  assignment,
  submission,
  onClose,
  onSubmitted,
}: {
  assignment: Assignment
  submission?: Submission
  onClose: () => void
  onSubmitted: () => void
}) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')

  const handleSubmit = async (files: File[]) => {
    if (files.length === 0) {
      toast.error('Please select a file')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('notes', notes)
      files.forEach((f) => formData.append('files', f))
      await assignmentsService.submitAssignment(assignment.id, formData)
      toast.success(t('assignments.submittedSuccess'))
      onSubmitted()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.uploadFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const overdue = new Date(assignment.dueDate) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary truncate">{assignment.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <HiCalendarDays className="w-4 h-4" />
              {t('assignments.dueOn', { date: formatDate(assignment.dueDate) })}
            </span>
            {overdue && <Badge variant="danger">{t('assignments.overdue')}</Badge>}
          </div>

          <div>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {assignment.description || 'No description provided.'}
            </p>
          </div>

          {assignment.files && assignment.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">{t('assignments.attachments')}</h3>
              <div className="space-y-2">
                {assignment.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <HiDocumentText className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm text-text-primary flex-1 truncate">{f.split('/').pop() || f}</span>
                    <Button variant="ghost" size="sm" onClick={() => window.open(f, '_blank')}>
                      {t('common.download')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission && (
            <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                {t('assignments.submitted')}
              </h3>
              <p className="text-xs text-text-secondary">
                {t('assignments.submittedOn', { date: formatDateTime(submission.submittedAt) })}
              </p>
              {submission.files?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {submission.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <HiDocumentText className="w-3.5 h-3.5" />
                      <span className="truncate">{f.split('/').pop() || f}</span>
                    </div>
                  ))}
                </div>
              )}
              {submission.grade !== undefined && (
                <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                      {t('assignments.grade')}: {submission.grade}
                    </span>
                  </div>
                  {submission.feedback && (
                    <p className="text-sm text-text-secondary mt-1">{submission.feedback}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {(!submission || submission.grade === undefined) && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                {submission ? t('assignments.resubmit') : t('assignments.submitAssignment')}
              </h3>
              <FileUpload
                onUpload={handleSubmit}
                multiple
                maxSize={50}
                label={t('assignments.attachments')}
              />
            </div>
          )}
        </div>

        {(!submission || submission.grade === undefined) && (
          <div className="px-6 py-4 border-t border-border bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={submitting} onClick={() => handleSubmit}>
              {submission ? t('assignments.resubmit') : t('assignments.submitAssignment')}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
