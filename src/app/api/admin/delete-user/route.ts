import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID

export async function POST(req: NextRequest) {
  const { targetUid, callerUid } = await req.json()

  if (!ADMIN_UID || callerUid !== ADMIN_UID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  if (!targetUid) {
    return NextResponse.json({ error: 'Missing targetUid' }, { status: 400 })
  }

  try {
    const adminDb = getAdminDb()
    const adminAuth = getAdminAuth()
    // Delete all user logs in batches
    const logsSnap = await adminDb.collection('logs').where('userId', '==', targetUid).get()
    for (let i = 0; i < logsSnap.docs.length; i += 400) {
      const batch = adminDb.batch()
      logsSnap.docs.slice(i, i + 400).forEach(doc => batch.delete(doc.ref))
      await batch.commit()
    }

    // Remove user from challenges
    const challengesSnap = await adminDb.collection('challenges')
      .where('participantIds', 'array-contains', targetUid).get()
    if (!challengesSnap.empty) {
      const batch = adminDb.batch()
      challengesSnap.docs.forEach(doc => {
        const data = doc.data()
        const participantIds = (data.participantIds || []).filter((id: string) => id !== targetUid)
        batch.update(doc.ref, {
          participantIds,
          [`participants.${targetUid}`]: FieldValue.delete(),
          [`scores.${targetUid}`]: FieldValue.delete(),
          [`todayScores.${targetUid}`]: FieldValue.delete(),
        })
      })
      await batch.commit()
    }

    // Delete Firestore user doc
    await adminDb.doc(`users/${targetUid}`).delete()

    // Delete from Firebase Auth
    await adminAuth.deleteUser(targetUid)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
