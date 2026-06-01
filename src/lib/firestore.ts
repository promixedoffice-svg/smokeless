import {
  doc, getDoc, setDoc, addDoc, deleteDoc,
  collection, query, where, getDocs, onSnapshot,
  orderBy, Unsubscribe, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { UserProfile, CigaretteLog, DayStats, Challenge } from '@/types'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

// --- User Profile ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function saveUserProfile(profile: Partial<UserProfile> & { uid: string }): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), profile, { merge: true })
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// --- Cigarette Logs ---

export function todayDate(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export async function logCigarette(userId: string): Promise<string> {
  const ref = await addDoc(collection(db, 'logs'), {
    userId,
    timestamp: Date.now(),
    date: todayDate(),
  })
  return ref.id
}

export async function deleteLastCigarette(userId: string): Promise<void> {
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', userId),
    where('date', '==', todayDate()),
  )
  const snap = await getDocs(q)
  if (snap.empty) return
  const sorted = snap.docs.sort((a, b) => b.data().timestamp - a.data().timestamp)
  await deleteDoc(sorted[0].ref)
}

export function subscribeToTodayLogs(
  userId: string,
  callback: (logs: CigaretteLog[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'logs'),
    where('userId', '==', userId),
    where('date', '==', todayDate()),
  )
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CigaretteLog))
    logs.sort((a, b) => b.timestamp - a.timestamp)
    callback(logs)
  })
}

export async function getWeekStats(userId: string, dailyGoal: number): Promise<DayStats[]> {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return format(d, 'yyyy-MM-dd')
  })

  const q = query(
    collection(db, 'logs'),
    where('userId', '==', userId),
    where('date', 'in', days)
  )
  const snap = await getDocs(q)

  const countByDate: Record<string, number> = {}
  snap.docs.forEach((d) => {
    const date = d.data().date as string
    countByDate[date] = (countByDate[date] ?? 0) + 1
  })

  const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

  return days.map((date) => ({
    date,
    label: hebrewDays[new Date(date + 'T12:00:00').getDay()],
    count: countByDate[date] ?? 0,
    goal: dailyGoal,
  }))
}

export async function getMonthTotal(userId: string): Promise<number> {
  const start = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  const end = format(new Date(), 'yyyy-MM-dd')
  const days: string[] = []
  let d = new Date(start + 'T12:00:00')
  const endD = new Date(end + 'T12:00:00')
  while (d <= endD) {
    days.push(format(d, 'yyyy-MM-dd'))
    d = new Date(d.getTime() + 86400000)
  }
  if (days.length === 0) return 0

  const batchSize = 30
  let total = 0
  for (let i = 0; i < days.length; i += batchSize) {
    const batch = days.slice(i, i + batchSize)
    const q = query(collection(db, 'logs'), where('userId', '==', userId), where('date', 'in', batch))
    const snap = await getDocs(q)
    total += snap.size
  }
  return total
}

export async function resetAllUserLogs(userId: string): Promise<void> {
  const q = query(collection(db, 'logs'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const deletions = snap.docs.map((d) => deleteDoc(d.ref))
  await Promise.all(deletions)
}

// --- Challenges ---

export async function getUserByInviteCode(code: string): Promise<UserProfile | null> {
  const q = query(collection(db, 'users'), where('inviteCode', '==', code.toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as UserProfile
}

export async function createChallenge(creator: UserProfile, type: 'weekly' | 'monthly'): Promise<string> {
  const now = new Date()
  const endDate = type === 'weekly'
    ? format(new Date(now.getTime() + 7 * 86400000), 'yyyy-MM-dd')
    : format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')

  const ref = await addDoc(collection(db, 'challenges'), {
    creatorId: creator.uid,
    creatorName: creator.displayName,
    creatorPhoto: creator.photoURL ?? '',
    startDate: format(now, 'yyyy-MM-dd'),
    endDate,
    type,
    status: 'pending',
    creatorTotal: 0,
    participantTotal: 0,
  })
  return ref.id
}

export async function joinChallenge(
  challengeId: string,
  participant: UserProfile
): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), {
    participantId: participant.uid,
    participantName: participant.displayName,
    participantPhoto: participant.photoURL ?? '',
    status: 'active',
  })
}

export function subscribeToMyChallenges(
  userId: string,
  callback: (challenges: Challenge[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'challenges'),
    where('creatorId', '==', userId)
  )
  return onSnapshot(q, async (snap) => {
    const asCreator = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge)
    )

    const q2 = query(collection(db, 'challenges'), where('participantId', '==', userId))
    const snap2 = await getDocs(q2)
    const asParticipant = snap2.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge))

    const all = [...asCreator, ...asParticipant].filter(
      (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
    )
    callback(all)
  })
}

export async function updateChallengeScores(userId: string): Promise<void> {
  const q = query(
    collection(db, 'challenges'),
    where('status', '==', 'active')
  )
  const snap = await getDocs(q)
  const today = todayDate()

  for (const challengeDoc of snap.docs) {
    const c = challengeDoc.data() as Challenge
    if (c.creatorId !== userId && c.participantId !== userId) continue

    const start = c.startDate
    const days: string[] = []
    let d = new Date(start + 'T12:00:00')
    const endD = new Date(today + 'T12:00:00')
    while (d <= endD) {
      days.push(format(d, 'yyyy-MM-dd'))
      d = new Date(d.getTime() + 86400000)
    }

    if (days.length === 0) continue

    const countLogs = async (uid: string) => {
      const batchSize = 30
      let total = 0
      for (let i = 0; i < days.length; i += batchSize) {
        const batch = days.slice(i, i + batchSize)
        const lq = query(collection(db, 'logs'), where('userId', '==', uid), where('date', 'in', batch))
        const ls = await getDocs(lq)
        total += ls.size
      }
      return total
    }

    const creatorTotal = await countLogs(c.creatorId)
    const participantTotal = c.participantId ? await countLogs(c.participantId) : 0

    await updateDoc(challengeDoc.ref, { creatorTotal, participantTotal })
  }
}
