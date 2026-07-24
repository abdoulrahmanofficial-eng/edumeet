import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, token, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    const unsubscribe = initialize()
    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
