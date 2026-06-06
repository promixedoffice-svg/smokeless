'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider, firebaseConfigured } from '@/lib/firebase'
import { getUserProfile, saveUserProfile, generateInviteCode } from '@/lib/firestore'
import { UserProfile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u: User) {
    let p = await getUserProfile(u.uid)
    if (!p) {
      p = {
        uid: u.uid,
        email: u.email ?? '',
        displayName: u.displayName ?? 'אורח',
        photoURL: u.photoURL ?? undefined,
        dailyGoal: 10,
        pricePerPack: 35,
        cigarettesPerPack: 20,
        joinedAt: new Date().toISOString(),
        inviteCode: generateInviteCode(),
        streak: 0,
      }
      await saveUserProfile(p)
      fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🆕 <b>משתמש חדש ב-Smokeless!</b>\n👤 ${p.displayName}\n📧 ${p.email}\n📅 ${new Date().toLocaleString('he-IL')}`,
        }),
      }).catch(() => {})
    }
    setProfile(p)
  }

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return
    }

    // Handle server-side OAuth token (mobile-compatible flow)
    if (typeof window !== 'undefined' && window.location.hash.includes('gtoken=')) {
      const raw = window.location.hash.split('gtoken=')[1]
      const idToken = decodeURIComponent(raw.split('&')[0])
      window.history.replaceState({}, '', '/')
      const credential = GoogleAuthProvider.credential(idToken)
      signInWithCredential(auth, credential).catch(() => setLoading(false))
      // onAuthStateChanged below will pick up the signed-in user
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await loadProfile(u)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    if (isMobile) {
      // Server-side OAuth — no popup, no cross-origin issues
      window.location.href = '/api/auth/google'
    } else {
      await signInWithPopup(auth, googleProvider)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  async function refreshProfile() {
    if (user) await loadProfile(user)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
