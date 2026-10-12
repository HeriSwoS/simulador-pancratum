import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

interface SignUpData {
  name: string
  email: string
  password: string
  passwordConfirm: string
}
interface AuthContextValue {
  user: RecordModel | null
  ready: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => setUser(record), true)
    const verify = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
        } catch {
          pb.authStore.clear()
        }
      }
      setReady(true)
    }
    void verify()
    return unsubscribe
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password)
  }, [])

  const signUp = useCallback(async (data: SignUpData) => {
    await pb.collection('users').create(data)
    await pb.collection('users').authWithPassword(data.email, data.password)
  }, [])

  const signOut = useCallback(() => pb.authStore.clear(), [])
  const refreshUser = useCallback(async () => {
    await pb.collection('users').authRefresh()
  }, [])

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signOut, refreshUser }),
    [user, ready, signIn, signUp, signOut, refreshUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return value
}
