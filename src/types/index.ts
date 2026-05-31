export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  dailyGoal: number
  pricePerPack: number
  cigarettesPerPack: number
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
  date: string // "2024-01-15"
}

export interface DayStats {
  date: string
  label: string // "א׳", "ב׳" etc.
  count: number
  goal: number
}

export interface Challenge {
  id: string
  creatorId: string
  creatorName: string
  creatorPhoto?: string
  participantId?: string
  participantName?: string
  participantPhoto?: string
  startDate: string
  endDate: string
  status: 'pending' | 'active' | 'completed'
  type: 'weekly' | 'monthly'
  creatorTotal: number
  participantTotal: number
}
