export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  dailyGoal: number
  pricePerPack: number
  cigarettesPerPack: number
  cigaretteBrand?: string
  age?: number
  weight?: number
  height?: number
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

export interface ChallengeParticipant {
  uid: string
  displayName: string
  photoURL?: string
}

export interface Challenge {
  id: string
  challengeCode: string
  creatorId: string
  creatorName: string
  creatorPhoto?: string
  maxParticipants: number
  participantIds: string[]
  pendingRequestIds: string[]
  participants: Record<string, ChallengeParticipant>
  pendingRequests: Record<string, ChallengeParticipant>
  scores: Record<string, number>
  todayScores: Record<string, number>
  startDate: string
  endDate: string
  status: 'pending' | 'active' | 'cancelled' | 'completed'
  type: 'weekly' | 'monthly'
  cancellationMessage?: string
  deletedBy?: string[]
}
