import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import TeacherDashboard from '@/pages/dashboard/teacher/TeacherDashboard'
import StudentDashboard from '@/pages/dashboard/student/StudentDashboard'
import TeacherClasses from '@/pages/dashboard/teacher/TeacherClasses'
import TeacherClassDetail from '@/pages/dashboard/teacher/TeacherClassDetail'
import TeacherMeetings from '@/pages/dashboard/teacher/TeacherMeetings'
import TeacherRecordings from '@/pages/dashboard/teacher/TeacherRecordings'
import TeacherAssignments from '@/pages/dashboard/teacher/TeacherAssignments'
import TeacherAnnouncements from '@/pages/dashboard/teacher/TeacherAnnouncements'
import TeacherAttendance from '@/pages/dashboard/teacher/TeacherAttendance'
import TeacherProfile from '@/pages/dashboard/teacher/TeacherProfile'
import TeacherSettings from '@/pages/dashboard/teacher/TeacherSettings'
import StudentClasses from '@/pages/dashboard/student/StudentClasses'
import StudentClassDetail from '@/pages/dashboard/student/StudentClassDetail'
import StudentAssignments from '@/pages/dashboard/student/StudentAssignments'
import StudentRecordings from '@/pages/dashboard/student/StudentRecordings'
import StudentAttendance from '@/pages/dashboard/student/StudentAttendance'
import StudentProfile from '@/pages/dashboard/student/StudentProfile'
import StudentSettings from '@/pages/dashboard/student/StudentSettings'
import ClassroomPage from '@/pages/classroom/ClassroomPage'
import WhiteboardPage from '@/pages/whiteboard/WhiteboardPage'

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <div className="text-6xl font-bold text-primary-500">404</div>
      <p className="text-lg text-text-secondary">Page not found</p>
      <a href="/" className="px-4 py-2 text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors">
        Go Home
      </a>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher/dashboard" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/classes" element={<ProtectedRoute requiredRole="teacher"><TeacherClasses /></ProtectedRoute>} />
            <Route path="/teacher/class/:id" element={<ProtectedRoute requiredRole="teacher"><TeacherClassDetail /></ProtectedRoute>} />
            <Route path="/teacher/meetings" element={<ProtectedRoute requiredRole="teacher"><TeacherMeetings /></ProtectedRoute>} />
            <Route path="/teacher/meeting/:id" element={<ProtectedRoute requiredRole="teacher"><TeacherMeetings /></ProtectedRoute>} />
            <Route path="/teacher/recordings" element={<ProtectedRoute requiredRole="teacher"><TeacherRecordings /></ProtectedRoute>} />
            <Route path="/teacher/assignments" element={<ProtectedRoute requiredRole="teacher"><TeacherAssignments /></ProtectedRoute>} />
            <Route path="/teacher/announcements" element={<ProtectedRoute requiredRole="teacher"><TeacherAnnouncements /></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute requiredRole="teacher"><TeacherAttendance /></ProtectedRoute>} />
            <Route path="/teacher/profile" element={<ProtectedRoute requiredRole="teacher"><TeacherProfile /></ProtectedRoute>} />
            <Route path="/teacher/settings" element={<ProtectedRoute requiredRole="teacher"><TeacherSettings /></ProtectedRoute>} />

            <Route path="/student/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/classes" element={<ProtectedRoute requiredRole="student"><StudentClasses /></ProtectedRoute>} />
            <Route path="/student/class/:id" element={<ProtectedRoute requiredRole="student"><StudentClassDetail /></ProtectedRoute>} />
            <Route path="/student/assignments" element={<ProtectedRoute requiredRole="student"><StudentAssignments /></ProtectedRoute>} />
            <Route path="/student/recordings" element={<ProtectedRoute requiredRole="student"><StudentRecordings /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute requiredRole="student"><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/settings" element={<ProtectedRoute requiredRole="student"><StudentSettings /></ProtectedRoute>} />
          </Route>

          <Route path="/classroom/:meetingId" element={<ProtectedRoute><ClassroomPage /></ProtectedRoute>} />
          <Route path="/whiteboard/:meetingId" element={<ProtectedRoute><WhiteboardPage /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}
