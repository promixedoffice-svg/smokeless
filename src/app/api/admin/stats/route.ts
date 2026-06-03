import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID

export async function POST(req: NextRequest) {
  const { callerUid } = await req.json()
  if (!ADMIN_UID || callerUid !== ADMIN_UID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const adminDb = getAdminDb()
  const [usersSnap, challengesSnap] = await Promise.all([
    adminDb.collection('users').get(),
    adminDb.collection('challenges').get(),
  ])

  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const todayStr = new Date().toISOString().slice(0, 10)

  const users = usersSnap.docs.map(d => d.data())
  const challenges = challengesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const newThisWeek = users.filter(u => {
    const joined = u.joinedAt ? new Date(u.joinedAt).getTime() : 0
    return joined >= weekAgo
  }).length

  const activeChallenges = challenges.filter((c: any) => c.status === 'active').length

  // Today's logs count (optional — may be slow with many users)
  let logsToday = 0
  try {
    const logsSnap = await adminDb.collection('logs').where('date', '==', todayStr).get()
    logsToday = logsSnap.size
  } catch {}

  return NextResponse.json({
    totalUsers: users.length,
    newThisWeek,
    totalChallenges: challenges.length,
    activeChallenges,
    logsToday,
    users: users.map(u => ({
      uid: u.uid,
      displayName: u.displayName,
      email: u.email,
      photoURL: u.photoURL,
      joinedAt: u.joinedAt,
      dailyGoal: u.dailyGoal,
      cigaretteBrand: u.cigaretteBrand,
      streak: u.streak,
      currency: u.currency,
      age: u.age,
    })).sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()),
  })
}
