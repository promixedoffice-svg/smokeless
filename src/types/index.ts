export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  dailyGoal: number
  pricePerPack: number
  cigarettesPerPack: number
  cigaretteBrand?: string
  joinedAt: string
  lastMotivationDate?: string
  inviteCode: string
  streak: number
  lastStreakDate?: string
}

export interface CigaretteLog {
  id: string
  userId: string
  timestamp: number
  date: string
}

export interface DayStats {
  date: string
  label: string
  count: number
  goal: number
}

export interface ChallengeMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
}

export interface Challenge {
  id: string
  creatorId: string
  creatorName: string
  creatorPhoto?: string
  participantId?: string
  participantName?: string
  participantPhoto?: string
  requesterId?: string
  requesterName?: string
  requesterPhoto?: string
  startDate: string
  endDate: string
  status: 'pending' | 'pending_approval' | 'active' | 'cancelled' | 'completed'
  type: 'weekly' | 'monthly'
  challengeCode: string
  creatorTotal: number
  participantTotal: number
  cancellationMessage?: string
  deletedBy?: string[]
}
