import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface Props {
  sessionId: string
  cwd?: string
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

export default function TerminalPane({ sessionId, cwd }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)

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
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())
    term.open(containerRef.current)
    termRef.current = term

    const focusTerm = () => {
      try { fitAddon.fit(); term.focus() } catch { /* disposed */ }
    }

    // Multiple focus attempts — layout may settle asynchronously
    requestAnimationFrame(focusTerm)
    const t1 = setTimeout(focusTerm, 150)
    const t2 = setTimeout(focusTerm, 600)

    const removeDataListener = window.edith.terminal.onData((id, data) => {
      if (id === sessionId) term.write(data)
    })

    term.onData((data) => window.edith.terminal.write(sessionId, data))
    term.onResize(({ cols, rows }) => window.edith.terminal.resize(sessionId, cols, rows))

    window.edith.terminal.create(sessionId, cwd).then(() => {
      setTimeout(() => {
        window.edith.terminal.write(sessionId, 'claude\r')
        focusTerm()
      }, 800)
    })

    const ro = new ResizeObserver(() => {
      try { fitAddon.fit() } catch { /* disposed */ }
    })
    ro.observe(containerRef.current)

    // Global fallback: any keydown refocuses the terminal
    const handleWindowKey = () => {
      if (termRef.current) termRef.current.focus()
    }
    window.addEventListener('keydown', handleWindowKey, { capture: true })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      removeDataListener()
      ro.disconnect()
      window.removeEventListener('keydown', handleWindowKey, { capture: true })
      termRef.current = null
      window.edith.terminal.close(sessionId)
      term.dispose()
    }
  }, [sessionId, cwd])

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
