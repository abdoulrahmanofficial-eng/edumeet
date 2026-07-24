import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineClipboardDocumentList,
  HiOutlinePlusCircle,
  HiOutlineAcademicCap,
  HiOutlineCalendarDays,
  HiOutlineDocumentArrowDown,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineStar,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import type { Assignment, Submission, Class } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/format'

export default function TeacherAssignments() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { classes, fetchClasses } = useClassStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [assignments, setAssignments] = useState<(Assignment & { className: string; submissionsCount: number; status: string })[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
  })

  useEffect(() => {
    Promise.all([fetchClasses()]).finally(() => setIsLoading(false))
  }, [fetchClasses])

  useEffect(() => {
    if (classes.length > 0 && assignments.length === 0) {
      const mockAssignments = classes.slice(0, 5).map((cls: Class, i) => ({
        id: `a${i}`,
        classId: cls.id,
        className: cls.title,
        title: `Assignment ${i + 1}`,
        description: 'Complete the following exercises...',
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        files: [],
        createdAt: new Date().toISOString(),
        submissionsCount: Math.floor(Math.random() * 20),
        status: i % 2 === 0 ? 'active' : 'closed',
      }))
      setAssignments(mockAssignments)
    }
  }, [classes, assignments.length])

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.dueDate || !formData.classId) {
      toast.error(t('Please fill in all required fields'))
      return
    }
    setCreating(true)
    try {
      const newAssignment = {
        id: `a${Date.now()}`,
        classId: formData.classId,
        className: classes.find((c: Class) => c.id === formData.classId)?.title || '',
        title: formData.title,
        description: formData.description,
        dueDate: new Date(formData.dueDate).toISOString(),
        files: [],
        createdAt: new Date().toISOString(),
        submissionsCount: 0,
        status: 'active',
      }
      setAssignments((prev) => [newAssignment, ...prev])
      toast.success(t('Assignment created'))
      setShowCreateModal(false)
      setFormData({ title: '', description: '', classId: '', dueDate: '' })
    } catch {
      toast.error(t('Failed to create assignment'))
    } finally {
      setCreating(false)
    }
  }

  const handleViewSubmissions = (assignmentId: string) => {
    setSelectedAssignment(assignmentId)
    const mockSubmissions: Submission[] = Array.from({ length: Math.floor(Math.random() * 8) + 2 }).map((_, i) => ({
      id: `s${i}`,
      assignmentId,
      studentId: `st${i}`,
      studentName: `Student ${i + 1}`,
      files: ['assignment.pdf'],
      submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      grade: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 50 : 0,
      feedback: '',
    }))
    setSubmissions(mockSubmissions)
  }

  const handleGradeSubmission = (submissionId: string, grade: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, grade, feedback } : s))
    )
    toast.success(t('Submission graded'))
  }

  const classOptions = useMemo(
    () => classes.map((c: Class) => ({ value: c.id, label: c.title })),
    [classes],
  )

  const submissionColumns = [
    {
      key: 'student',
      label: t('Student'),
      render: (s: Submission) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.studentName} size="sm" />
          <span className="text-sm font-medium text-text-primary">{s.studentName}</span>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      label: t('Submitted'),
      render: (s: Submission) => (
        <span className="text-sm text-text-secondary">{formatDateTime(s.submittedAt)}</span>
      ),
    },
    {
      key: 'files',
      label: t('File'),
      render: (s: Submission) =>
        s.files.length > 0 ? (
          <Button size="sm" variant="ghost" icon={<HiOutlineDocumentArrowDown className="w-4 h-4" />}>
            {s.files[0]}
          </Button>
        ) : (
          <span className="text-sm text-text-tertiary">-</span>
        ),
    },
    {
      key: 'grade',
      label: t('Grade'),
      render: (s: Submission) => (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            defaultValue={s.grade || ''}
            onBlur={(e) => handleGradeSubmission(s.id, parseInt(e.target.value) || 0, s.feedback)}
            className="w-16 rounded border border-border bg-white dark:bg-gray-800 px-2 py-1 text-sm text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            placeholder="-"
          />
          <span className="text-xs text-text-tertiary">/100</span>
        </div>
      ),
    },
    {
      key: 'feedback',
      label: t('Feedback'),
      render: (s: Submission) => (
        <input
          type="text"
          defaultValue={s.feedback}
          placeholder={t('Add feedback...')}
          onBlur={(e) => handleGradeSubmission(s.id, s.grade, e.target.value)}
          className="w-32 rounded border border-border bg-white dark:bg-gray-800 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      ),
    },
  ]

  if (isLoading) {
    return (
    <>
        <PageHeader title={t('Assignments')} description={t('Manage assignments and grades')} icon={<HiOutlineClipboardDocumentList className="w-5 h-5" />} />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-12 w-full" /></Card>
          ))}
        </div>
    </>
    )
  }

  return (
      <>
      <PageHeader
        title={t('Assignments')}
        description={t('Manage assignments and grades')}
        icon={<HiOutlineClipboardDocumentList className="w-5 h-5" />}
        actions={
          <Button icon={<HiOutlinePlusCircle className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            {t('Create Assignment')}
          </Button>
        }
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={<HiOutlineClipboardDocumentList className="w-8 h-8" />}
          title={t('No assignments yet')}
          description={t('Create your first assignment for a class')}
          action={{ label: t('Create Assignment'), onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card hover onClick={() => handleViewSubmissions(a.id)}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                      <HiOutlineClipboardDocumentList className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{a.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary mt-0.5">
                        <span className="flex items-center gap-1">
                          <HiOutlineAcademicCap className="w-3 h-3" />
                          {a.className}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendarDays className="w-3 h-3" />
                          {t('Due')}: {formatDate(a.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={a.status === 'active' ? 'primary' : 'default'}>{a.status}</Badge>
                    <span className="text-sm text-text-secondary">{a.submissionsCount} {t('submissions')}</span>
                    <Button size="sm" variant="ghost" icon={<HiOutlineEye className="w-4 h-4" />}
                      onClick={(e) => { e.stopPropagation(); handleViewSubmissions(a.id) }}
                    >
                      {t('View')}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)}
        title={t('Submissions')} size="xl">
        {submissions.length === 0 ? (
          <EmptyState title={t('No submissions yet')} description={t('Students have not submitted yet')} />
        ) : (
          <div className="space-y-4">
            <DataTable columns={submissionColumns} data={submissions} />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedAssignment(null)}>
                {t('Close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('Create Assignment')} size="lg">
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Select
            label={t('Class')}
            required
            options={classOptions}
            placeholder={t('Select a class')}
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
          />
          <Input label={t('Assignment Title')} required value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('e.g. Chapter 5 Review')}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">{t('Description')}</label>
            <textarea rows={4} value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
            />
          </div>
          <Input label={t('Due Date')} type="datetime-local" required value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={creating}>
              {t('Create Assignment')}
            </Button>
          </div>
        </form>
      </Modal>
      </>
  )
}
