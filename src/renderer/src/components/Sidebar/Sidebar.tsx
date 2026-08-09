import type { Profile, Session, Worktree } from '../../../../shared/types'

interface Props {
  profile: Profile
  sessions: Session[]
  worktrees: Worktree[]
  activeSessionId: string | null
  onSessionSelect: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onSwitchProfile: () => void
}

export default function Sidebar({
  profile,
  sessions,
  worktrees,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onSwitchProfile,
}: Props) {
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
            return (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`group flex items-center justify-between px-2 py-2 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#1a1a24] text-white'
                    : 'text-[#64748b] hover:bg-[#13131c] hover:text-[#94a3b8]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                      isActive ? activeDot : 'bg-[#1e1e2a]'
                    }`}
                  />
                  <span className="text-xs truncate">{session.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[#334155] hover:text-red-400 text-[10px] transition-all ml-1 flex-shrink-0"
                >
                  ✕
                </button>
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
      <div className="px-4 py-3 border-t border-[#1a1a24]">
        <p className="text-[#1e1e2a] text-[10px] tracking-widest text-center">AGENT HARNESS v0.1</p>
      </div>
    </aside>
  )
}
