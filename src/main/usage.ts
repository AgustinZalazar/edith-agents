import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Profile } from '../shared/types'

export interface UsageSummary {
  session: number     // tokens this terminal session
  weekly: number      // tokens last 7 days
  dailyLimit: number
  creditsPct: number | null   // % from /usage-credits, null if never run
  creditsUpdatedAt: number | null
}

interface UsageStore {
  daily:   Partial<Record<Profile, Record<string, number>>>
  sessions: Record<string, number>
  limits:  Partial<Record<Profile, number>>
  credits: Partial<Record<Profile, { pct: number; updatedAt: number }>>
}

const FILE = join(app.getPath('userData'), 'usage.json')
export const DEFAULT_LIMIT = 200_000

const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b./g
const TOKEN_RE = /\b([\d,]{4,})\s*(?:total\s+)?tokens?\b|\btokens?[:\s]+\s*([\d,]{2,})/gi

function dateStr(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().slice(0, 10)
}

function read(): UsageStore {
  if (!existsSync(FILE)) return { daily: {}, sessions: {}, limits: {}, credits: {} }
  try {
    const raw = JSON.parse(readFileSync(FILE, 'utf8'))
    return { daily: {}, sessions: {}, limits: {}, credits: {}, ...raw }
  } catch {
    return { daily: {}, sessions: {}, limits: {}, credits: {} }
  }
}

function write(data: UsageStore): void {
  writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8')
}

export function addTokens(profile: Profile, sessionId: string, count: number): void {
  if (count <= 0) return
  const data = read()
  if (!data.daily[profile]) data.daily[profile] = {}
  const today = dateStr()
  data.daily[profile]![today] = (data.daily[profile]![today] ?? 0) + count
  data.sessions[sessionId] = (data.sessions[sessionId] ?? 0) + count
  write(data)
}

export function clearSession(sessionId: string): void {
  const data = read()
  delete data.sessions[sessionId]
  write(data)
}

export function setCredits(profile: Profile, pct: number): void {
  const data = read()
  data.credits[profile] = { pct, updatedAt: Date.now() }
  write(data)
}

export function getUsage(profile: Profile, sessionId: string): UsageSummary {
  const data = read()
  const daily = data.daily[profile] ?? {}

  let weekly = 0
  for (let i = 0; i < 7; i++) weekly += daily[dateStr(i)] ?? 0

  const credits = data.credits[profile] ?? null

  return {
    session: data.sessions[sessionId] ?? 0,
    weekly,
    dailyLimit: data.limits[profile] ?? DEFAULT_LIMIT,
    creditsPct: credits?.pct ?? null,
    creditsUpdatedAt: credits?.updatedAt ?? null,
  }
}

export function parseTokens(rawPtyOutput: string): number {
  const text = rawPtyOutput.replace(ANSI_RE, '')
  let total = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(text)) !== null) {
    const raw = m[1] ?? m[2]
    total += parseInt(raw.replace(/,/g, ''), 10) || 0
  }
  return total
}
