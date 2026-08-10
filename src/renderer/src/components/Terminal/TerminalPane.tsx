import { useEffect, useRef, useCallback } from 'react'
import type { SessionActivity } from '../../../../shared/types'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface Props {
  sessionId: string
  cwd?: string
  isActive?: boolean
  onActivityChange?: (id: string, activity: SessionActivity) => void
}

function playDoneSound() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime
    // Ascending C-E-G chime
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + i * 0.1
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.start(t)
      osc.stop(t + 0.45)
    })
  } catch { /* AudioContext not available */ }
}

const THEME = {
  background: '#0a0a0f',
  foreground: '#e2e8f0',
  cursor: '#3b82f6',
  cursorAccent: '#0a0a0f',
  selectionBackground: '#1e3a5f80',
  black: '#0f0f17',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#8b5cf6',
  cyan: '#06b6d4',
  white: '#cbd5e1',
  brightBlack: '#334155',
  brightRed: '#f87171',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#a78bfa',
  brightCyan: '#22d3ee',
  brightWhite: '#f1f5f9',
}

export default function TerminalPane({ sessionId, cwd, isActive, onActivityChange }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null)
  const termRef           = useRef<Terminal | null>(null)
  const fitAddonRef       = useRef<FitAddon | null>(null)
  const isActiveRef       = useRef(isActive ?? false)
  const activityRef       = useRef<SessionActivity>('idle')
  const doneTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUsageCheckRef = useRef(0)

  // Keep isActiveRef in sync without triggering the main effect
  isActiveRef.current = isActive ?? false

  const setActivity = useCallback((next: SessionActivity) => {
    if (activityRef.current === next) return
    activityRef.current = next
    onActivityChange?.(sessionId, next)
    if (next === 'done') {
      playDoneSound()
      // Auto-run /usage after each completed task (max once per 5 min)
      const now = Date.now()
      if (now - lastUsageCheckRef.current > 5 * 60_000) {
        lastUsageCheckRef.current = now
        setTimeout(() => {
          window.edith.terminal.write(sessionId, '/usage\r')
        }, 1000)
      }
    }
  }, [sessionId, onActivityChange])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      theme: THEME,
      fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
    })

    const fitAddon = new FitAddon()
    fitAddonRef.current = fitAddon
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())
    term.open(containerRef.current)
    termRef.current = term

    const focusTerm = () => {
      try { fitAddon.fit(); term.focus() } catch { /* disposed */ }
    }

    // Only focus if this pane is currently active
    const focusIfActive = () => { if (isActiveRef.current) focusTerm() }

    requestAnimationFrame(focusIfActive)
    const t1 = setTimeout(focusIfActive, 150)
    const t2 = setTimeout(focusIfActive, 600)

    const scheduleDone = () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
      doneTimerRef.current = setTimeout(() => setActivity('done'), 2000)
    }

    const removeDataListener = window.edith.terminal.onData((id, data) => {
      if (id !== sessionId) return
      term.write(data)
      // Reset done timer on every PTY output while working
      if (activityRef.current === 'working') scheduleDone()
    })

    term.onData((data) => {
      window.edith.terminal.write(sessionId, data)
      // Enter key = user sent a command → working state
      if (data === '\r') {
        if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
        setActivity('working')
      }
    })
    term.onResize(({ cols, rows }) => window.edith.terminal.resize(sessionId, cols, rows))

    window.edith.terminal.create(sessionId, cwd).then(() => {
      setTimeout(() => {
        window.edith.terminal.write(sessionId, 'claude\r')
        setActivity('working')
        focusTerm()
      }, 800)
    })

    const ro = new ResizeObserver(() => {
      try { fitAddon.fit() } catch { /* disposed */ }
    })
    ro.observe(containerRef.current)

    // Global fallback: keydown refocuses the terminal, but only if this pane is active
    const handleWindowKey = () => {
      if (isActiveRef.current && termRef.current) termRef.current.focus()
    }
    window.addEventListener('keydown', handleWindowKey, { capture: true })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
      removeDataListener()
      ro.disconnect()
      window.removeEventListener('keydown', handleWindowKey, { capture: true })
      termRef.current = null
      window.edith.terminal.close(sessionId)
      term.dispose()
    }
  }, [sessionId, cwd, setActivity])

  // Re-fit and focus when this pane becomes the active one
  useEffect(() => {
    if (isActive) {
      const t = setTimeout(() => {
        try { fitAddonRef.current?.fit(); termRef.current?.focus() } catch { /* disposed */ }
      }, 50)
      return () => clearTimeout(t)
    }
  }, [isActive])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      tabIndex={0}
      onFocus={() => termRef.current?.focus()}
      onClick={() => termRef.current?.focus()}
    />
  )
}
