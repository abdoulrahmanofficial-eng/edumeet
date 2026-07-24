import { Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { DashboardLayout } from './DashboardLayout'

export function AppLayout() {
  const { user, loading } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  if (loading) return <LoadingScreen />

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user} isDark={isDark} onToggleTheme={toggleTheme}>
      <Outlet />
    </DashboardLayout>
  )
}
