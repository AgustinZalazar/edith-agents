export type Profile = 'work' | 'personal'

export interface Session {
  id: string
  name: string
  profile: Profile
  worktreePath?: string
  createdAt: number
  lastUsedAt: number
}

export interface Worktree {
  id: string
  name: string
  path: string
  branch: string
  profile: Profile
  createdAt: number
}

export interface StoreData {
  profile: Profile | null
  sessions: Session[]
  worktrees: Worktree[]
}
