import { useState, useEffect } from 'react'
import type { Profile, Session, SessionActivity, Worktree } from '../../../../shared/types'

interface Props {
  profile: Profile
  sessions: Session[]
  worktrees: Worktree[]
  activeSessionId: string | null
  sessionActivity: Record<string, SessionActivity>
  onSessionSelect: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, name: string) => void
  onSwitchProfile: () => void
}

export default function Sidebar({
  profile,
  sessions,
  worktrees,
  activeSessionId,
  sessionActivity,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onSwitchProfile,
}: Props) {
  const [stats, setStats] = useState({ mcps: 0, skills: 0 })
  const [usage, setUsage] = useState({
    session: 0,
    weekly: 0,
    dailyLimit: 200_000,
    creditsPct: null as number | null,
    creditsUpdatedAt: null as number | null,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    window.edith.profile.stats(profile).then(setStats)
    const interval = setInterval(
      () => window.edith.profile.stats(profile).then(setStats),
      30_000,
    )
    return () => clearInterval(interval)
  }, [profile])

  useEffect(() => {
    if (!activeSessionId) return
    const refresh = () =>
      window.edith.usage.get(profile, activeSessionId).then(setUsage)
    refresh()
    const interval = setInterval(refresh, 10_000)
    // Real-time update when /usage-credits is run
    const unsub = window.edith.usage.onCreditsUpdated((p, pct) => {
      if (p === profile) setUsage((prev) => ({ ...prev, creditsPct: pct, creditsUpdatedAt: Date.now() }))
    })
    return () => { clearInterval(interval); unsub() }
  }, [profile, activeSessionId])

  const isWork = profile === 'work'
  const accentText = isWork ? 'text-amber-400' : 'text-emerald-400'
  const accentBorder = isWork ? 'border-amber-500/30' : 'border-emerald-500/30'
  const activeDot = isWork ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <aside className="w-56 bg-[#0d0d14] border-r border-[#1a1a24] flex flex-col flex-shrink-0">
      {/* Logo + profile badge */}
      <div className="px-4 py-4 border-b border-[#1a1a24]">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold tracking-[0.2em] text-sm">E.D.I.T.H.</span>
          <button
            onClick={onSwitchProfile}
            className={`text-[10px] px-2 py-0.5 rounded border ${accentBorder} ${accentText} hover:bg-[#1a1a24] transition-colors tracking-widest`}
          >
            {isWork ? 'WORK' : 'PERSONAL'}
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[#334155] text-[10px] tracking-[0.2em] font-semibold">SESSIONS</span>
          <button
            onClick={onNewSession}
            className="text-[#334155] hover:text-[#94a3b8] text-base leading-none transition-colors"
            title="New session"
          >
            +
          </button>
        </div>

        <div className="space-y-0.5 px-2">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId
            const isEditing = editingId === session.id
            const activity = sessionActivity[session.id] ?? 'idle'

            const startEdit = (e: React.MouseEvent) => {
              e.stopPropagation()
              setEditingId(session.id)
              setEditingName(session.name)
            }

            const commitEdit = () => {
              const trimmed = editingName.trim()
              if (trimmed && trimmed !== session.name) {
                onRenameSession(session.id, trimmed)
              }
              setEditingId(null)
            }

            const cancelEdit = () => setEditingId(null)

            const dotClass =
              activity === 'working'
                ? 'bg-blue-400 animate-pulse'
                : activity === 'done'
                  ? `${activeDot} animate-pulse`
                  : isActive
                    ? activeDot
                    : 'bg-[#1e1e2a]'

            return (
              <div
                key={session.id}
                onClick={() => !isEditing && onSessionSelect(session.id)}
                className={`group flex items-center justify-between px-2 py-2 rounded transition-colors ${
                  isEditing
                    ? 'bg-[#1a1a24]'
                    : isActive
                      ? 'bg-[#1a1a24] text-white cursor-pointer'
                      : 'text-[#64748b] hover:bg-[#13131c] hover:text-[#94a3b8] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${dotClass}`} />
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') cancelEdit()
                        e.stopPropagation()
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-transparent text-xs text-white outline-none border-b border-blue-500/60 pb-px"
                    />
                  ) : (
                    <span className="text-xs truncate flex-1" onDoubleClick={startEdit}>
                      {session.name}
                    </span>
                  )}
                  {activity === 'working' && (
                    <span className="text-blue-400 text-[10px] tracking-widest animate-pulse flex-shrink-0">
                      ···
                    </span>
                  )}
                  {activity === 'done' && (
                    <span className={`text-[10px] flex-shrink-0 ${accentText}`}>✓</span>
                  )}
                </div>
                {!isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[#334155] hover:text-red-400 text-[10px] transition-all ml-1 flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}

          {sessions.length === 0 && (
            <p className="text-[#334155] text-xs px-2 py-2">No sessions yet</p>
          )}
        </div>

        {/* Worktrees */}
        {worktrees.length > 0 && (
          <div className="mt-4 border-t border-[#1a1a24] pt-3">
            <div className="px-4 mb-2">
              <span className="text-[#334155] text-[10px] tracking-[0.2em] font-semibold">WORKTREES</span>
            </div>
            <div className="space-y-0.5 px-2">
              {worktrees.map((wt) => (
                <div
                  key={wt.id}
                  className="flex items-center gap-2 px-2 py-2 rounded text-[#64748b] hover:bg-[#13131c] hover:text-[#94a3b8] cursor-pointer transition-colors"
                >
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25"
                    />
                  </svg>
                  <div className="min-w-0">
                    <div className="text-xs truncate">{wt.name}</div>
                    <div className="text-[10px] text-[#334155] truncate">{wt.branch}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1a1a24] space-y-3">

        {/* Token usage */}
        {(() => {
          const barColor = (pct: number) =>
            pct >= 0.9 ? 'bg-red-500' :
            pct >= 0.7 ? 'bg-amber-400' :
            isWork     ? 'bg-amber-400' : 'bg-emerald-400'

          const fmt = (n: number) =>
            n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
            n >= 1_000     ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k` :
            `${n}`

          const sessionPct = Math.min(usage.session / usage.dailyLimit, 1)
          const creditsPct = usage.creditsPct !== null ? usage.creditsPct / 100 : null

          const ago = usage.creditsUpdatedAt
            ? (() => {
                const mins = Math.round((Date.now() - usage.creditsUpdatedAt) / 60_000)
                return mins < 1 ? 'just now' : `${mins}m ago`
              })()
            : null

          return (
            <div className="space-y-1.5">
              {/* Session tokens */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#334155] text-[9px] tracking-[0.12em]">SESSION</span>
                  <span className="text-[#475569] text-[9px] tabular-nums">{fmt(usage.session)}</span>
                </div>
                <div className="h-0.5 rounded-full bg-[#1a1a24] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor(sessionPct)}`}
                    style={{ width: `${Math.max(sessionPct * 100, sessionPct > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Credits from /usage-credits */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#334155] text-[9px] tracking-[0.12em]">CREDITS</span>
                  {creditsPct !== null ? (
                    <span className="text-[#475569] text-[9px] tabular-nums">{usage.creditsPct}%</span>
                  ) : (
                    <span className="text-[#1e1e2a] text-[9px]">auto after next task</span>
                  )}
                </div>
                <div className="h-0.5 rounded-full bg-[#1a1a24] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${creditsPct !== null ? barColor(creditsPct) : 'bg-[#1a1a24]'}`}
                    style={{ width: creditsPct !== null ? `${Math.max(creditsPct * 100, creditsPct > 0 ? 2 : 0)}%` : '0%' }}
                  />
                </div>
                {ago && (
                  <p className="text-[#1e1e2a] text-[8px] text-right">{ago}</p>
                )}
              </div>
            </div>
          )
        })()}

        {/* MCP + Skills */}
        <div className="flex items-center justify-around pt-1 border-t border-[#1a1a24]">
          <div className="flex flex-col items-center gap-0.5">
            <span className={`text-sm font-bold tabular-nums ${accentText}`}>{stats.mcps}</span>
            <span className="text-[#334155] text-[9px] tracking-[0.15em]">MCP</span>
          </div>
          <div className="w-px h-6 bg-[#1a1a24]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className={`text-sm font-bold tabular-nums ${accentText}`}>{stats.skills}</span>
            <span className="text-[#334155] text-[9px] tracking-[0.15em]">SKILLS</span>
          </div>
        </div>

        <p className="text-[#1e1e2a] text-[10px] tracking-widest text-center">AGENT HARNESS v0.1</p>
      </div>
    </aside>
  )
}
