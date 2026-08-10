// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pty = (eval('require') as NodeRequire)('node-pty') as typeof import('node-pty')
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import type { Profile } from '../shared/types'
import { addTokens, clearSession, parseTokens, setCredits } from './usage'
import { engramDataDir } from './engram'

const DEFAULT_SHELL = process.platform === 'win32' ? 'powershell.exe' : 'bash'
const DEFAULT_CWD =
  process.env.HOME || process.env.USERPROFILE || (process.platform === 'win32' ? 'C:\\' : '/')

const terminals    = new Map<string, pty.IPty>()
const profiles     = new Map<string, Profile>()   // id → profile
const inputBuffers = new Map<string, string>()    // id → current input line
const creditWait   = new Set<string>()            // ids awaiting /usage-credits output
const creditBufs   = new Map<string, string>()    // id → accumulated output buffer

const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b./g

// Matches "4%", "4.2 %", used as credit percentage
const PCT_RE = /\b(\d+(?:\.\d+)?)\s*%/

export function createTerminal(
  id: string,
  cwd: string | undefined,
  profile: Profile,
  win: BrowserWindow,
): void {
  const claudeConfigDir = join(app.getPath('userData'), `claude-${profile}`)

  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    CLAUDE_CONFIG_DIR: claudeConfigDir,
    ENGRAM_DATA_DIR: engramDataDir(profile),
  }

  const ptyProcess = pty.spawn(DEFAULT_SHELL, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: cwd || DEFAULT_CWD,
    env,
  })

  profiles.set(id, profile)

  ptyProcess.onData((data) => {
    if (!win.isDestroyed()) {
      win.webContents.send('terminal:data', { id, data })
    }

    // Token accumulation
    const found = parseTokens(data)
    if (found > 0) addTokens(profile, id, found)

    // Credit percentage detection: buffer output after /usage-credits
    if (creditWait.has(id)) {
      const stripped = data.replace(ANSI_RE, '')
      const buf = (creditBufs.get(id) ?? '') + stripped
      creditBufs.set(id, buf)

      const m = buf.match(PCT_RE)
      if (m) {
        const pct = parseFloat(m[1])
        if (pct >= 0 && pct <= 100) {
          setCredits(profile, pct)
          if (!win.isDestroyed()) {
            win.webContents.send('usage:credits-updated', { profile, pct })
          }
        }
        creditWait.delete(id)
        creditBufs.delete(id)
      }

      // Give up after accumulating 2 kB with no match
      if (buf.length > 2048) {
        creditWait.delete(id)
        creditBufs.delete(id)
      }
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    terminals.delete(id)
    profiles.delete(id)
    if (!win.isDestroyed()) {
      win.webContents.send('terminal:exit', { id, exitCode })
    }
  })

  terminals.set(id, ptyProcess)
}

export function writeToTerminal(id: string, data: string): void {
  terminals.get(id)?.write(data)

  // Accumulate typed characters to detect /usage-credits command
  if (data === '\r') {
    const line = (inputBuffers.get(id) ?? '').trim()
    if (line === '/usage') {
      creditWait.add(id)
      creditBufs.set(id, '')
    }
    inputBuffers.set(id, '')
  } else if (data === '\x7f' || data === '\b') {
    const cur = inputBuffers.get(id) ?? ''
    inputBuffers.set(id, cur.slice(0, -1))
  } else if (data.length === 1 && !data.startsWith('\x1b')) {
    inputBuffers.set(id, (inputBuffers.get(id) ?? '') + data)
  }
}

export function resizeTerminal(id: string, cols: number, rows: number): void {
  terminals.get(id)?.resize(cols, rows)
}

export function closeTerminal(id: string): void {
  const term = terminals.get(id)
  if (term) {
    term.kill()
    terminals.delete(id)
    profiles.delete(id)
    inputBuffers.delete(id)
    creditWait.delete(id)
    creditBufs.delete(id)
    clearSession(id)
  }
}

export function closeAll(): void {
  terminals.forEach((term) => term.kill())
  terminals.clear()
  profiles.clear()
  inputBuffers.clear()
  creditWait.clear()
  creditBufs.clear()
}
