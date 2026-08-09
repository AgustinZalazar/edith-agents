import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Session, Worktree, Profile, StoreData } from '../shared/types'

const DATA_DIR = app.getPath('userData')
const STORE_FILE = join(DATA_DIR, 'edith-store.json')

function read(): StoreData {
  if (!existsSync(STORE_FILE)) {
    return { profile: null, sessions: [], worktrees: [] }
  }
  try {
    return JSON.parse(readFileSync(STORE_FILE, 'utf8'))
  } catch {
    return { profile: null, sessions: [], worktrees: [] }
  }
}

function write(data: StoreData): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8')
}

export const getProfile = (): Profile | null => read().profile

export const setProfile = (profile: Profile): void => {
  write({ ...read(), profile })
}

export const getSessions = (): Session[] => read().sessions

export const createSession = (name: string, profile: Profile, worktreePath?: string): Session => {
  const data = read()
  const session: Session = {
    id: randomUUID(),
    name,
    profile,
    worktreePath,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  }
  write({ ...data, sessions: [...data.sessions, session] })
  return session
}

export const deleteSession = (id: string): void => {
  const data = read()
  write({ ...data, sessions: data.sessions.filter((s) => s.id !== id) })
}

export const updateSession = (id: string, updates: Partial<Session>): void => {
  const data = read()
  write({
    ...data,
    sessions: data.sessions.map((s) =>
      s.id === id ? { ...s, ...updates, lastUsedAt: Date.now() } : s,
    ),
  })
}

export const getWorktrees = (): Worktree[] => read().worktrees

export const createWorktree = (
  name: string,
  path: string,
  branch: string,
  profile: Profile,
): Worktree => {
  const data = read()
  const worktree: Worktree = {
    id: randomUUID(),
    name,
    path,
    branch,
    profile,
    createdAt: Date.now(),
  }
  write({ ...data, worktrees: [...data.worktrees, worktree] })
  return worktree
}

export const deleteWorktree = (id: string): void => {
  const data = read()
  write({ ...data, worktrees: data.worktrees.filter((w) => w.id !== id) })
}
