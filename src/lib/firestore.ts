import {
  doc, getDoc, setDoc, addDoc, deleteDoc,
  collection, query, where, getDocs, onSnapshot,
  orderBy, arrayUnion, arrayRemove, Unsubscribe, updateDoc, deleteField,
} from 'firebase/firestore'
import { db } from './firebase'
import { UserProfile, CigaretteLog, DayStats, Challenge, ChallengeMessage, ChallengeParticipant } from '@/types'
import { format, subDays } from 'date-fns'

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
  const q = query(collection(db, 'logs'), where('userId', '==', userId), where('date', 'in', days))
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
  let total = 0
  for (let i = 0; i < days.length; i += 30) {
    const batch = days.slice(i, i + 30)
    const q = query(collection(db, 'logs'), where('userId', '==', userId), where('date', 'in', batch))
    const snap = await getDocs(q)
    total += snap.size
  }
  return total
}

export async function resetAllUserLogs(userId: string): Promise<void> {
  const q = query(collection(db, 'logs'), where('userId', '==', userId))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}

// --- Challenges ---

export async function getUserByInviteCode(code: string): Promise<UserProfile | null> {
  const q = query(collection(db, 'users'), where('inviteCode', '==', code.toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as UserProfile
}

export async function getChallengeByCode(code: string): Promise<Challenge | null> {
  const q = query(collection(db, 'challenges'), where('challengeCode', '==', code.toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Challenge
}

export async function createChallenge(
  creator: UserProfile,
  type: 'weekly' | 'monthly',
  maxParticipants: number
): Promise<string> {
  const now = new Date()
  const endDate = type === 'weekly'
    ? format(new Date(now.getTime() + 7 * 86400000), 'yyyy-MM-dd')
    : format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')
  const challengeCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  const creatorParticipant: ChallengeParticipant = {
    uid: creator.uid,
    displayName: creator.displayName,
    photoURL: creator.photoURL ?? '',
  }
  const ref = await addDoc(collection(db, 'challenges'), {
    creatorId: creator.uid,
    creatorName: creator.displayName,
    creatorPhoto: creator.photoURL ?? '',
    maxParticipants,
    participantIds: [creator.uid],
    pendingRequestIds: [],
    participants: { [creator.uid]: creatorParticipant },
    pendingRequests: {},
    scores: { [creator.uid]: 0 },
    startDate: format(now, 'yyyy-MM-dd'),
    endDate,
    type,
    status: 'pending',
    challengeCode,
    deletedBy: [],
  })
  return ref.id
}

export async function requestJoinChallenge(challengeId: string, requester: UserProfile): Promise<void> {
  const requesterData: ChallengeParticipant = {
    uid: requester.uid,
    displayName: requester.displayName,
    photoURL: requester.photoURL ?? '',
  }
  await updateDoc(doc(db, 'challenges', challengeId), {
    [`pendingRequests.${requester.uid}`]: requesterData,
    pendingRequestIds: arrayUnion(requester.uid),
  })
}

export async function approveJoinRequest(challengeId: string, userId: string): Promise<void> {
  const snap = await getDoc(doc(db, 'challenges', challengeId))
  if (!snap.exists()) return
  const c = snap.data() as Challenge
  const requester = c.pendingRequests[userId]
  if (!requester) return

  const updates: Record<string, unknown> = {
    [`participants.${userId}`]: requester,
    [`scores.${userId}`]: 0,
    participantIds: arrayUnion(userId),
    pendingRequestIds: arrayRemove(userId),
    [`pendingRequests.${userId}`]: deleteField(),
  }
  // Check if challenge should become active
  const nonCreatorCount = (c.participantIds ?? []).filter(id => id !== c.creatorId).length + 1
  if (nonCreatorCount >= c.maxParticipants) {
    updates.status = 'active'
  }
  await updateDoc(doc(db, 'challenges', challengeId), updates)
}

export async function rejectJoinRequest(challengeId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), {
    [`pendingRequests.${userId}`]: deleteField(),
    pendingRequestIds: arrayRemove(userId),
  })
}

export async function startChallenge(challengeId: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), { status: 'active' })
}

export async function removeParticipantFromGroup(challengeId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), {
    [`participants.${userId}`]: deleteField(),
    [`scores.${userId}`]: deleteField(),
    participantIds: arrayRemove(userId),
  })
}

export async function leaveChallenge(challengeId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), {
    [`participants.${userId}`]: deleteField(),
    [`scores.${userId}`]: deleteField(),
    participantIds: arrayRemove(userId),
  })
}

export async function cancelChallenge(challengeId: string, message: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), {
    status: 'cancelled',
    cancellationMessage: message,
  })
}

export async function hardDeleteChallenge(challengeId: string): Promise<void> {
  await deleteDoc(doc(db, 'challenges', challengeId))
}

export async function softDeleteChallenge(challengeId: string, userId: string): Promise<void> {
  const ref = doc(db, 'challenges', challengeId)
  await updateDoc(ref, { deletedBy: arrayUnion(userId) })
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const c = snap.data() as Challenge
  const deletedBy = c.deletedBy ?? []
  const parties = c.participantIds ?? []
  if (parties.length > 0 && parties.every((uid) => deletedBy.includes(uid))) {
    await deleteDoc(ref)
  }
}

export async function sendChallengeMessage(
  challengeId: string,
  userId: string,
  userName: string,
  content: string
): Promise<void> {
  await addDoc(collection(db, 'challenges', challengeId, 'messages'), {
    userId,
    userName,
    content,
    timestamp: Date.now(),
  })
}

export function subscribeToChallengeMessages(
  challengeId: string,
  callback: (messages: ChallengeMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, 'challenges', challengeId, 'messages'), orderBy('timestamp', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChallengeMessage)))
  })
}

export function subscribeToMyChallenges(
  userId: string,
  callback: (challenges: Challenge[]) => void
): Unsubscribe {
  const q = query(collection(db, 'challenges'), where('participantIds', 'array-contains', userId))
  return onSnapshot(q, async (snap) => {
    const asMember = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge))
    const q2 = query(collection(db, 'challenges'), where('pendingRequestIds', 'array-contains', userId))
    const snap2 = await getDocs(q2)
    const asPending = snap2.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge))
    const all = [...asMember, ...asPending]
      .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
      .filter((c) => !(c.deletedBy ?? []).includes(userId))
    callback(all)
  })
}

export async function updateChallengeScores(userId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'challenges'),
      where('participantIds', 'array-contains', userId),
      where('status', '==', 'active')
    )
  )
  const today = todayDate()
  const todaySnap = await getDocs(query(collection(db, 'logs'), where('userId', '==', userId), where('date', '==', today)))
  const todayCount = todaySnap.size

  for (const challengeDoc of snap.docs) {
    const c = challengeDoc.data() as Challenge
    const days: string[] = []
    let d = new Date(c.startDate + 'T12:00:00')
    const endD = new Date(today + 'T12:00:00')
    while (d <= endD) {
      days.push(format(d, 'yyyy-MM-dd'))
      d = new Date(d.getTime() + 86400000)
    }
    if (days.length === 0) continue
    let myTotal = 0
    for (let i = 0; i < days.length; i += 30) {
      const batch = days.slice(i, i + 30)
      const ls = await getDocs(query(collection(db, 'logs'), where('userId', '==', userId), where('date', 'in', batch)))
      myTotal += ls.size
    }
    await updateDoc(challengeDoc.ref, {
      [`scores.${userId}`]: myTotal,
      [`todayScores.${userId}`]: todayCount,
    })
  }
}
