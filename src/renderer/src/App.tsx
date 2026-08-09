import { useState, useEffect } from 'react'
import type { Profile, Session, Worktree } from '../../shared/types'
import ProfileSelector from './components/Startup/ProfileSelector'
import Sidebar from './components/Sidebar/Sidebar'
import TerminalPane from './components/Terminal/TerminalPane'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [worktrees, setWorktrees] = useState<Worktree[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const [p, s, w] = await Promise.all([
        window.edith.profile.get(),
        window.edith.session.list(),
        window.edith.worktree.list(),
      ])
      setProfile(p)
      setSessions(s)
      setWorktrees(w)
      if (p && s.length > 0) {
        const profileSessions = s.filter((x) => x.profile === p)
        if (profileSessions.length > 0) {
          setActiveSessionId(profileSessions[0].id)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleProfileSelect = async (p: Profile) => {
    await window.edith.profile.set(p)
    setProfile(p)
    const existing = sessions.filter((s) => s.profile === p)
    if (existing.length > 0) {
      setActiveSessionId(existing[0].id)
    } else {
      const session = await window.edith.session.create('Session 1', p)
      setSessions((prev) => [...prev, session])
      setActiveSessionId(session.id)
    }
  }

  const handleNewSession = async () => {
    if (!profile) return
    const name = `Session ${sessions.filter((s) => s.profile === profile).length + 1}`
    const session = await window.edith.session.create(name, profile)
    setSessions((prev) => [...prev, session])
    setActiveSessionId(session.id)
  }

  const handleDeleteSession = async (id: string) => {
    await window.edith.session.delete(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id && s.profile === profile)
      setActiveSessionId(remaining[0]?.id ?? null)
    }
  }

  const handleSwitchProfile = () => {
    setActiveSessionId(null)
    setProfile(null)
  }

  const profileSessions = profile ? sessions.filter((s) => s.profile === profile) : []
  const profileWorktrees = profile ? worktrees.filter((w) => w.profile === profile) : []
  const activeSession = profileSessions.find((s) => s.id === activeSessionId) ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
        <span className="text-blue-400 text-xs tracking-[0.3em] animate-pulse">INITIALIZING...</span>
      </div>
    )
  }

  if (!profile) {
    return <ProfileSelector onSelect={handleProfileSelect} />
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        profile={profile}
        sessions={profileSessions}
        worktrees={profileWorktrees}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onSwitchProfile={handleSwitchProfile}
      />
      <main className="flex-1 overflow-hidden bg-[#0a0a0f]">
        {activeSession ? (
          <TerminalPane
            key={activeSession.id}
            sessionId={activeSession.id}
            cwd={activeSession.worktreePath}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-[#64748b] text-sm tracking-widest">NO ACTIVE SESSION</p>
            <button
              onClick={handleNewSession}
              className="px-6 py-2 text-xs tracking-widest border border-[#1e1e2a] rounded text-[#94a3b8] hover:border-blue-500/40 hover:text-blue-400 transition-colors"
            >
              + NEW SESSION
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
